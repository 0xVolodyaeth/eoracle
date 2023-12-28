import { loadFixture, } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Staking } from "../typechain-types";
import { ethers, upgrades } from "hardhat";
import { expect } from "chai";

describe("Staking", function () {

  interface StakingProtocol {
    staking: Staking;
    admin: SignerWithAddress;
    staker: SignerWithAddress;
    adminRole: string;
    waiterRole: string;
    stakerRole: string;
  }

  async function deployStaking(): Promise<StakingProtocol> {
    const [admin, staker] = await ethers.getSigners();

    const StakingFactory = await ethers.getContractFactory("Staking");
    const stakingProxy = await upgrades.deployProxy(StakingFactory, { initializer: 'initialize' }) as unknown as Staking;

    await stakingProxy.waitForDeployment();

    const adminRole = await stakingProxy.DEFAULT_ADMIN_ROLE();
    const waiterRole = await stakingProxy.WAITER_ROLE();
    const stakerRole = await stakingProxy.STAKER_ROLE();

    return {
      staking: stakingProxy,
      admin: admin,
      staker: staker,
      adminRole: adminRole,
      waiterRole: waiterRole,
      stakerRole: stakerRole
    };
  }

  describe("Deployment", function () {
    it("Should change configuration", async function () {
      const sp: StakingProtocol = await loadFixture(deployStaking);

      await expect(sp.staking.setConfiguration(0, 0, 0))
        .to.emit(sp.staking, "ConfigurationSet")
        .withArgs(0, 0, 0);
    });

    it("Should register staker to the queue", async function () {
      const sp: StakingProtocol = await loadFixture(deployStaking);

      await expect(sp.staking.connect(sp.staker).registerStakerToTheQueue())
        .to.emit(sp.staking, "StakerAddedToTheQueue")
        .withArgs(await sp.staker.getAddress());
    });

    it("Should register staker to the queue and activate it, try to activate staker again and be reverted", async function () {
      const sp: StakingProtocol = await loadFixture(deployStaking);

      await expect(sp.staking.connect(sp.staker).registerStakerToTheQueue())
        .to.emit(sp.staking, "StakerAddedToTheQueue")
        .withArgs(await sp.staker.getAddress());

      const stake = ethers.parseEther("1");

      await expect(sp.staking.connect(sp.staker).activateStaker({ value: stake }))
        .to.emit(sp.staking, "StakerActivated")
        .withArgs(await sp.staker.getAddress(), stake, 1);

      await expect(sp.staking.connect(sp.staker).activateStaker({ value: stake }))
        .to.be.revertedWithCustomError(sp.staking, "AccessControlUnauthorizedAccount")
    });

    it("Should register staker to the queue and activate it, deactivate it", async function () {
      const sp: StakingProtocol = await loadFixture(deployStaking);

      await expect(sp.staking.connect(sp.staker).registerStakerToTheQueue())
        .to.emit(sp.staking, "StakerAddedToTheQueue")
        .withArgs(await sp.staker.getAddress());

      const stake = ethers.parseEther("1");

      await expect(sp.staking.connect(sp.staker).activateStaker({ value: stake }))
        .to.emit(sp.staking, "StakerActivated")
        .withArgs(await sp.staker.getAddress(), stake, 1);

      await expect(sp.staking.connect(sp.staker).deactivateStaker())
        .to.emit(sp.staking, "StakerDeactivated")
        .withArgs(await sp.staker.getAddress(), stake, 0);
    });

    it("Should register staker to the queue, activate it and slash it", async function () {
      const sp: StakingProtocol = await loadFixture(deployStaking);

      await expect(sp.staking.connect(sp.staker).registerStakerToTheQueue())
        .to.emit(sp.staking, "StakerAddedToTheQueue")
        .withArgs(await sp.staker.getAddress());

      const fine = ethers.parseEther("0.09");
      const stake = ethers.parseEther("1");

      await expect(sp.staking.connect(sp.staker).activateStaker({ value: stake }))
        .to.emit(sp.staking, "StakerActivated")
        .withArgs(await sp.staker.getAddress(), stake, 1);

      await expect(sp.staking.connect(sp.admin).slashStaker(await sp.staker.getAddress(), fine))
        .to.emit(sp.staking, "StakerSlashed")
        .withArgs(await sp.staker.getAddress(), fine);
    });

    it("Should chech requires for the slashStaker method", async function () {
      const sp: StakingProtocol = await loadFixture(deployStaking);

      await expect(sp.staking.connect(sp.staker).registerStakerToTheQueue())
        .to.emit(sp.staking, "StakerAddedToTheQueue")
        .withArgs(await sp.staker.getAddress());

      const fine = ethers.parseEther("0.09");
      const stake = ethers.parseEther("1");

      await expect(sp.staking.connect(sp.admin).slashStaker(await sp.staker.getAddress(), fine))
        .to.be.revertedWith("Staking: staker not registered");

      await expect(sp.staking.connect(sp.staker).activateStaker({ value: stake }))
        .to.emit(sp.staking, "StakerActivated")
        .withArgs(await sp.staker.getAddress(), stake, 1);

      await expect(sp.staking.connect(sp.admin).slashStaker(await sp.staker.getAddress(), stake))
        .to.be.revertedWith("Staking: too big fine");
    });
  });

  describe("Upgreades", function () {
    it("Should upgrade the staking contract", async function () {
      const sp: StakingProtocol = await loadFixture(deployStaking);

      const stakingV2 = await upgrades.upgradeProxy(await sp.staking.getAddress(), await ethers.getContractFactory("StakingV2"));
      expect(await stakingV2.version()).equals("V2");
    })
  })
});
