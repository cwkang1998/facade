// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./Verifier.sol";

contract ZkMultisigWallet is Verifier {

  uint public nonce;            
  uint public threshold;
  mapping(uint => bool) private ownerHashes;

  constructor(uint threshold_, uint256[] memory owners_) {
    require(owners_.length >= threshold_);
    threshold = threshold_;
    for (uint i = 0; i < owners_.length; i++) {
      ownerHashes[owners_[i]] = true;
    }
    // Potential replace attack due to the prove not tied to this specific wallet?
    // Prove right now also doesn't really check for the nonce, which is definitely replace attack worthy
  }

  // Note that address recovered from signatures must be strictly increasing, in order to prevent duplicates
  function execute(
        uint[2][] calldata a,
        uint[2][2][] calldata b,
        uint[2][] calldata c,
        uint[6][] calldata input
    ) external {
    require(input.length >= threshold);
    require(a.length == b.length && b.length == c.length);

    /**
     * The input shape and schema is as follows:
     * calldata
     * 1. destination
     * 2. value
     * 3. gasLimit
     * 4. data
     * hashPubKey
     * 1. pubKey
     */
    uint lastAdd = 0; 
    for (uint i = 0; i < threshold; i++) {
      require(ownerHashes[input[i][4]]);
      require(input[i][4] > lastAdd);

      bool isValid = this.verifyProof(a[i], b[i], c[i], input[i]);
      lastAdd = input[i][4];
      
      require(isValid);
    }

    bool success = false;
    address destination = address(uint160(uint(keccak256(abi.encodePacked(input[0][0])))));
    
    (success,) = destination.call{value: input[0][1], gas: input[0][2]}(abi.encodePacked(input[0][3]));
    require(success);
  }

  receive() external payable {}
}
