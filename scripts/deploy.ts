import { ethers, upgrades } from "hardhat";
import { Staking } from "../typechain-types";


async function main() {

  const [admin, staker] = await ethers.getSigners();

  const StakingFactory = await ethers.getContractFactory("Staking");
  const stakingProxy = await upgrades.deployProxy(StakingFactory, {
    initializer: 'initialize',
  }) as unknown as Staking;

  await stakingProxy.waitForDeployment();

  console.log("StakingContract deployed to:", await stakingProxy.getAddress());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// 0x2B3635c6b1370358844CBc028B0e5305Cf323454
