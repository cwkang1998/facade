/* eslint-disable jsdoc/require-jsdoc */
export function buildSolidityProof(snarkProof: any, publicSignals: any) {
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

export function bigintToArray(n: number, k: number, x: bigint) {
  let mod = 1n;
  for (let idx = 0; idx < n; idx++) {
    mod *= 2n;
  }

  const ret = [];
  let xTemp = x;
  for (let idx = 0; idx < k; idx++) {
    ret.push(xTemp % mod);
    xTemp /= mod;
  }
  return ret;
}

export function Uint8ArrayToBigint(x: Uint8Array) {
  let ret = 0n;
  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let idx = 0; idx < x.length; idx++) {
    ret *= 256n;
    ret += BigInt(x[idx]);
  }
  return ret;
}
