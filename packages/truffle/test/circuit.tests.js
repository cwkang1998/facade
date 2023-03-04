const { expect } = require('chai');
const { ethers } = require('ethers');
const {Point} = require('@noble/secp256k1');

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

/**
 *
 * @param {bigint} x
 * @returns {[bigint, bigint, bigint, bigint]}
 */
function bigintToTuple(x) {
  let mod = 2n ** 64n;
  let ret = [0n, 0n, 0n, 0n];

  var x_temp = x;
  for (var idx = 0; idx < ret.length; idx++) {
    ret[idx] = x_temp % mod;
    x_temp = x_temp / mod;
  }
  return ret;
}

/**
 *
 * @param {Uint8Array} x
 * @returns
 */
function Uint8ArrayToBigint(x) {
  let ret = 0n;
  for (let idx = 0; idx < x.length; idx++) {
    ret = ret * 256n;
    ret = ret + BigInt(x[idx]);
  }
  return ret;
}

contract('ZkMultisigWallet', () => {
  let poseidonJs;

  before(async () => {
    poseidonJs = await buildPoseidon();
  });

  it('should validate', async () => {
    const [owner, otherAccount] = await ethers.getSigners();

    const zkWalletFactory = await ethers.getContractFactory('ZkMultisigWallet');

    const wallet = new ethers.Wallet.createRandom();
    const hashPubKey = ethers.BigNumber.from(
      poseidonJs.F.toObject(poseidonJs([wallet.publicKey])),
    );

    const zkWalletInstance = await zkWalletFactory.deploy(1, [hashPubKey]);

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
    const recoveredPubKey = utils.recoverPublicKey(
      keccak256(serializedTx),
      signedTx,
    );

    // the guess is sent to the owner which will be responsible in generating the proof
    const pubKeyPoints = Point.fromHex(recoveredPubKey.slice(2));
    const pubKeyXBigInt = Uint8ArrayToBigint(bigintToTuple(pubKeyPoints.x));
    const pubKeyYBigInt = Uint8ArrayToBigint(bigintToTuple(pubKeyPoints.y));
    const signatureRBigInt = Uint8ArrayToBigint(
      Uint8Array.from(Buffer.from(signedTx.r, 'hex')),
    );
    const signatureSBigInt = Uint8ArrayToBigint(
      Uint8Array.from(Buffer.from(signedTx.s, 'hex')),
    );

    const input = {
      transactionCallData: bigintToArray(64, 4, BigInt(serializedTx)),
      hashPubKey: hashPubKey,
      pubKey: [bigintToArray(pubKeyXBigInt), bigintToArray(pubKeyYBigInt)],
      signatureR: bigintToArray(64, 4, signatureRBigInt),
      signatureS: bigintToArray(64, 4, signatureSBigInt),
    };

    const { proof, publicSignals } = await groth16.fullProve(
      input,
      '../circuits/ecdsa_verify_js/ecdsa_verify.wasm',
      '../circuits/ecdsa_verify.zkey',
    );

    formattedInput = buildSolidityProof(proof, publicSignals);
    const result = await zkWalletInstance.verifyProof(
      formattedInput.a,
      formattedInput.b,
      formattedInput.c,
      formattedInput.input,
    );
    expect(result).to.equal(true);
  });
});
