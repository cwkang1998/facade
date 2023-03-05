const multiSig = artifacts.require('ZkMultisigWallet');

module.exports = function (deployer) {
  deployer.deploy(multiSig, 1, [1, 2]);
};
