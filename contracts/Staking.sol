// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {IStaking} from "./interfaces/IStaking.sol";

contract Staking is
    IStaking,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable
{
    bytes32 public constant STAKER_ROLE = keccak256("STAKER_ROLE");
    bytes32 public constant WAITER_ROLE = keccak256("WAITER_ROLE");

    uint120 public constant maxFine = 1e17;

    // pack variables; enough for this contract
    uint120 public registrationWei;
    uint120 public registrationDelay;
    uint8 public maxStakers;
    uint8 public stakersCounter;

    mapping(address => uint) public stakersBalances;

    function initialize() public initializer {
        __UUPSUpgradeable_init();
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        grantRole(STAKER_ROLE, msg.sender);
        grantRole(WAITER_ROLE, msg.sender);

        // Default configurations
        registrationWei = 1 ether;
        registrationDelay = 1 days;
        maxStakers = 10;
    }

    function setConfiguration(
        uint120 _registrationWei,
        uint120 _registrationDelay,
        uint8 _maxStakers
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        registrationWei = _registrationWei;
        registrationDelay = _registrationDelay;
        maxStakers = _maxStakers;

        emit ConfigurationSet(
            _registrationWei,
            _registrationDelay,
            _maxStakers
        );
    }

    function registerStakerToTheQueue() external {
        require(stakersBalances[msg.sender] == 0, "Staker already registered");
        _grantRole(WAITER_ROLE, msg.sender);

        emit StakerAddedToTheQueue(msg.sender);
    }

    function activateStaker() external payable onlyRole(WAITER_ROLE) {
        require(stakersCounter < maxStakers, "Staking: max stakers reached");
        require(msg.value == registrationWei, "Staking: wrong wei amount");

        renounceRole(WAITER_ROLE, msg.sender);
        _grantRole(STAKER_ROLE, msg.sender);

        stakersBalances[msg.sender] = registrationWei;
        stakersCounter++;

        emit StakerActivated(msg.sender, registrationWei, stakersCounter);
    }

    function deactivateStaker()
        external
        payable
        nonReentrant
        onlyRole(STAKER_ROLE)
    {
        renounceRole(STAKER_ROLE, msg.sender);

        (bool success, ) = payable(msg.sender).call{value: registrationWei}("");
        require(success, "Staking: transfer failed");

        stakersCounter--;

        emit StakerDeactivated(msg.sender, registrationWei, stakersCounter);
    }

    function slashStaker(
        address _staker,
        uint120 _fine
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(stakersBalances[_staker] > 0, "Staking: staker not registered");
        require(maxFine >= _fine, "Staking: too big fine");

        stakersBalances[_staker] = stakersBalances[_staker] - _fine;
        (bool success, ) = payable(address(0)).call{value: _fine}("");
        require(success, "Staking: transfer failed");

        emit StakerSlashed(_staker, _fine);
    }

    function _authorizeUpgrade(
        address
    ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
