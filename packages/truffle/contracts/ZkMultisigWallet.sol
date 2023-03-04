// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract ZKMultisigWallet {
  uint256 value;

  function read() public view returns (uint256) {
    return value;
  }

  function write(uint256 newValue) public {
    value = newValue;
  }
}