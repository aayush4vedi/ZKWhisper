// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IZKWhisper {
    function signupFn(
        uint256 _commitment
    ) external returns (uint256, uint256[10] memory, uint8[10] memory);

    function getTreeHeight() external view returns (uint256);   
}