import bodyParser from 'body-parser';
import express, { Application, Request, Response } from 'express';
import format from 'pg-format';
import { getClient, getTestQuery } from './client';
import zkWalletAbi from './abi/zkWalletAbi.json';
import { ethers, Wallet } from 'ethers';

import * as dotenv from 'dotenv';

dotenv.config();
const privateKey = process.env.PRIVATE_KEY!;
const infuraKey = process.env.INFURA_KEY!;
const rpcUrl = `https://goerli.infura.io/v3/${infuraKey}`;
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
const wallet = new Wallet(privateKey, provider);

const zkWalletInterface = new ethers.utils.Interface(zkWalletAbi);

const sendExecute = async (
  zkWalletAddr: string,
  proofs: Proof[],
  functionInputData: string,
) => {
  const a_s = [];
  const b_s = [];
  const c_s = [];
  const inputs = [];

  for (let i = 0; i < proofs.length; i++) {
    a_s.push(proofs[i].a);
    b_s.push(proofs[i].b);
    c_s.push(proofs[i].c);
    inputs.push(proofs[i].input);
  }
  const inputData = zkWalletInterface.encodeFunctionData('execute', [
    a_s,
    b_s,
    c_s,
    inputs,
    zkWalletAddr,
    functionInputData,
  ]);

  const tx = await wallet.sendTransaction({
    to: zkWalletAddr,
    data: inputData,
  });
  return tx;
};

const app: Application = express();
app.use(bodyParser.json());
const PORT: number = 3001;

app.get('/', async (req: Request, res: Response): Promise<void> => {
  const client = await getClient();
  await client.connect();
  const res1 = await client.query(getTestQuery());
  console.log(`res: ${JSON.stringify(res1)}`);

  await client.end();
  res.json({
    number: 1,
  });
});

app.get('/address/:address', async (req: Request, res: Response) => {
  const address = req.params.address;
  const nonce = req.query.nonce;
  if (nonce === null || nonce === undefined) {
    res.sendStatus(404);
  }

  const client = await getClient();
  await client.connect();

  const queryRes = await client.query(
    format(
      `Select id, target_wallet, proof, wallet_nonce
              from main.proof_storage
              where target_wallet = %L
              and wallet_nonce = %L`,
      address,
      nonce,
    ),
  );
  await client.end();
  console.log(`queryRes: ${JSON.stringify(queryRes)}`);

  if (!queryRes || queryRes.rowCount === 0) {
    res.sendStatus(204);
    return;
  }

  const result = [];

  for (let i = 0; i < queryRes.rowCount; i++) {
    result.push({
      id: queryRes.rows[i].id,
      zkWallet: queryRes.rows[i].target_wallet,
      proof: queryRes.rows[i].proof,
      walletNonce: queryRes.rows[i].wallet_nonce,
    });
  }

  res.json(result);
  return;
});

app.post('/', async (req: Request, res: Response): Promise<void> => {
  const data = req.body;
  const targetWallet = data.zkWallet;
  const proof = data.proof;
  const walletNonce = data.walletNonce;

  const client = await getClient();
  await client.connect();

  await client.query(
    format(
      `insert into main.proof_storage
          (target_wallet, proof, wallet_nonce)
          VALUES (%L);
      `,
      [targetWallet, proof, walletNonce],
    ),
  );

  await client.end();
  res.sendStatus(200);
  return;
});

app.delete('/id/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  const client = await getClient();
  await client.connect();

  await client.query(
    format(`delete from main.proof_storage where id = %L`, [id]),
  );

  await client.end();
  res.sendStatus(200);
  return;
});

interface Proof {
  a: any;
  b: any;
  c: any;
  input: any;
}
app.post('/relay', async (req: Request, res: Response): Promise<void> => {
  const data = req.body;

  const walletAddress = data.walletAddress;
  const proofs: Proof[] = data.proofs;
  const network = data.network;

  const xx = new ethers.utils.Interface(zkWalletAbi);
  const inputData = zkWalletInterface.encodeFunctionData('nonce');

  const tx = await sendExecute(walletAddress, proofs, inputData);

  res.status(200);
  res.json(tx);
});

app.listen(PORT, (): void => {
  console.log('SERVER IS UP ON PORT:', PORT);
});
