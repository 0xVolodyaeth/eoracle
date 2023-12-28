// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IStaking {
    event ConfigurationSet(
        uint120 _registrationWei,
        uint120 _registrationDelay,
        uint8 _maxStakers
    );

    event StakerAddedToTheQueue(address _staker);

    event StakerActivated(
        address _staker,
        uint120 _weiAmount,
        uint _currentNumberOfStakers
    );

    event StakerDeactivated(
        address _staker,
        uint120 _weiAmount,
        uint _currentNumberOfStakers
    );

    event StakerSlashed(address _staker, uint120 _fine);

    function setConfiguration(
        uint120 _registrationWei,
        uint120 _registrationDelay,
        uint8 _maxStakers
    ) external;

    function registerStakerToTheQueue() external;

    function activateStaker() external payable;

    function deactivateStaker() external payable;

    function slashStaker(address _staker, uint120 _fine) external;
}
