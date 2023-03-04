const multiSig = artifacts.require('ZKMultisigWallet');

module.exports = function (deployer) {
  deployer.deploy(multiSig);
};
