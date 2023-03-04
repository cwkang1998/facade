const { describe, before } = require('mocha');
const { expect } = require('chai');
const { ethers } = require('ethers');

const { poseidonContract } = require('circomlibjs');
const { buildPoseidon } = require('circomlibjs');
const { groth16 } = require('snarkjs');
const ZkWallet = artifacts.require('ZkMultisigWallet');

function buildSolidityProof(snarkProof, publicSignals) {
  return {
    a: snarkProof.pi_a.slice(0, 2),
    b: [
      snarkProof.pi_b[0].slice(0).reverse(),
      snarkProof.pi_b[1].slice(0).reverse(),
    ],
    c: snarkProof.pi_c.slice(0, 2),
    input: publicSignals,
  };
}

function bigintToArray(n, k, x) {
  let mod = 1n;
  for (var idx = 0; idx < n; idx++) {
      mod = mod * 2n;
  }

  let ret = [];
  var x_temp = x;
  for (var idx = 0; idx < k; idx++) {
      ret.push(x_temp % mod);
      x_temp = x_temp / mod;
  }
  return ret;
}

contract('ZkMultisigWallet', () => {
  let poseidonJs;
  let walletInstance;

  before(async () => {
    walletInstance = await ZkWallet.deployed();
    poseidonJs = await buildPoseidon();
  });

  it('should validate', async () => {
    const wallet = new ethers.Wallet.createRandom();

    // Serialize a message hash
    const serializedTx = await utils.serializeTransaction({
      to: '0xcA51855FBA4aAe768DCc273349995DE391731e70',
      value: utils.parseEther('1'),
    });

    console.log('msgHash: ', serializedTx);

    // Extract r and s
    const signedTx = await wallet
      ._signingKey()
      .signDigest(keccak256(serializedTx));
    console.log('signature r: ', signedTx.r);
    console.log('signature s: ', signedTx.s);

    // Now we extract the public key from the signature
    const recoveredPubKey = recoverPublicKey(keccak256(serializedTx), signedTx);

    const transactionCallData = ethers.BigNumber.from(
      poseidonJs.F.toObject(poseidonJs([secret, ...solutions])),
    );

    const hashPubKey = ethers.BigNumber.from(
      poseidonJs.F.toObject(poseidonJs([wallet.publicKey])),
    );

    // the guess is sent to the owner which will be responsible in generating the proof
    const input = {
      transactionCallData: guessHash,
      hashPubKey: hashPubKey,
      pubKey: bigintToArray(64, 4, )
      signatureR: bigintToArray()
      signatureS: bigintToArray()
    };

    const { proof, publicSignals } = await groth16.fullProve(
      input,
      '../circuits/ecdsa_verify_js/ecdsa_verify.wasm',
      '../circuits/ecdsa_verify.zkey',
    );

    formattedInput = buildSolidityProof(proof, publicSignals);
    const result = await walletInstance.verifyProof(
      formattedInput.a,
      formattedInput.b,
      formattedInput.c,
      formattedInput.input,
    );
    expect(result).to.equal(true);
  });
});
