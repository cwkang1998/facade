/* eslint-disable jsdoc/require-jsdoc */
import { ethers, utils } from 'ethers';
import { keccak256 } from 'ethers/lib/utils';
import { Point, utils as secp256k1Util } from '@noble/secp256k1';
import { buildPoseidon } from 'circomlibjs';
import { groth16 } from 'snarkjs';

import { bigintToArray, buildSolidityProof, Uint8ArrayToBigint } from './utils';

const main = async () => {
  const poseidonJs = await buildPoseidon();

  const wallet = ethers.Wallet.createRandom();
  const hashPubKey = ethers.BigNumber.from(
    poseidonJs.F.toObject(poseidonJs([wallet.publicKey])),
  );

  // Serialize a message hash
  const serializedTx = await utils.serializeTransaction({
    to: '0xcA51855FBA4aAe768DCc273349995DE391731e70',
    value: utils.parseEther('1'),
  });

  console.log('msgHash: ', serializedTx);
  const encoded = new TextEncoder().encode(serializedTx);
  const msgHash = await secp256k1Util.sha256(encoded);
  const msgHashBigInt = await Uint8ArrayToBigint(msgHash);
  console.log('msgHash:!! ', msgHash);

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
  const pubKeyPoints = Point.fromPrivateKey(wallet.privateKey.slice(2));
  const signatureRBigInt = Uint8ArrayToBigint(
    Uint8Array.from(Buffer.from(signedTx.r.slice(2), 'hex')),
  );
  const signatureSBigInt = Uint8ArrayToBigint(
    Uint8Array.from(Buffer.from(signedTx.s.slice(2), 'hex')),
  );

  const input = {
    transactionCallData: bigintToArray(64, 4, msgHashBigInt),
    hashPubKey: hashPubKey.toBigInt(),
    pubKey: [
      bigintToArray(64, 4, pubKeyPoints.x),
      bigintToArray(64, 4, pubKeyPoints.y),
    ],
    signatureR: bigintToArray(64, 4, signatureRBigInt),
    signatureS: bigintToArray(64, 4, signatureSBigInt),
  };

  const { proof, publicSignals } = await groth16.fullProve(
    input,
    'ecdsa_verify_js/ecdsa_verify.wasm',
    'ecdsa_verify.zkey',
  );

  const formattedInput = buildSolidityProof(proof, publicSignals);
};

main().then(() => console.log('Done'));
