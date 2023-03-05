import { OnRpcRequestHandler, OnCronjobHandler } from '@metamask/snaps-types';
import { heading, panel, text } from '@metamask/snaps-ui';
import { BigNumber, ethers } from 'ethers';
import { bigintToArray, buildSolidityProof } from './utils';
import zkWalletAbi from './abi.json';

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */

const zkWalletInterface = new ethers.utils.Interface(zkWalletAbi);

const getNonce = async (zkWalletAddress: string): Promise<BigNumber> => {
  const inputData = zkWalletInterface.encodeFunctionData('nonce');
  const callParam = {
    to: zkWalletAddress,
    data: inputData,
  };

  const nonceHex = await ethereum.request({
    method: 'eth_call',
    params: [callParam],
  });

  const nonce = BigNumber.from(nonceHex);
  return nonce;
};

export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  switch (request.method) {
    case 'registerWallet': {
      const account = await ethereum.request({ method: 'eth_requestAccounts' });
      const walletAddress = (await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'Prompt',
          content: panel([
            heading('Your Zk Multisig'),
            text('Please enter the wallet address'),
          ]),
          placeholder: '0x123...',
        },
      })) as string;

      await snap.request({
        method: 'snap_manageState',
        params: {
          operation: 'update',
          newState: {
            zkWallet: walletAddress,
            ownerAddress: account,
            proofCount: 0,
          },
        },
      });

      return;
    }

    case 'generateProof': {
      // use wasm to generate proof
      const proof = '';

      const persistedData = await snap.request({
        method: 'snap_manageState',
        params: { operation: 'get' },
      });
      const zkWallet = persistedData['zkWallet'];

      // get nonce from contract
      const nonce = await getNonce(zkWallet);

      // post proof to server
      const data = {
        zkWallet,
        proof,
        walletNonce: nonce,
      };
      await fetch('http://localhost:3001', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      return;
    }

    case 'submitProof': {
      const isConfirm = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'Confirmation',
          content: panel([text(`Confirm submission?`)]),
        },
      });

      if (!isConfirm) {
        return;
      }

      const persistedData = await snap.request({
        method: 'snap_manageState',
        params: { operation: 'get' },
      });
      const zkWallet = persistedData['zkWallet'];

      // get wallet nonce
      const nonce = getNonce(zkWallet);

      // get proofs from api
      const proofRes = await fetch(
        `http://localhost:3001/address/${zkWallet}?nonce=${nonce}`,
      );

      const proofJson = await proofRes.json();
      const proofs = proofJson.map((x: { proof: any }) => {
        return x.proof;
      });

      // send to relayer

      const data = {
        walletAddress: zkWallet,
        proofs,
        network: 'goerli',
      };
      await fetch('http://localhost:3001/relay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      return;
    }
    default:
      throw new Error('Method not found.');
  }
};

export const onCronjob: OnCronjobHandler = async ({ request }) => {
  switch (request.method) {
    case 'loop': {
      const persistedData = await snap.request({
        method: 'snap_manageState',
        params: { operation: 'get' },
      });
      const zkWallet = persistedData['zkWallet'];
      const proofCount = persistedData['proofCount'] as number;

      const nonce = await getNonce(zkWallet);

      // call api to get proof that targets this ownerAddress
      const proofStorageRes = await fetch(
        `http://localhost:3001/address/${zkWallet}?${nonce}`,
      );
      const proofStorage: any[] = await proofStorageRes.json();
      const newProofCount = proofStorage.length;

      if (proofCount === newProofCount) {
        return;
      }

      persistedData['proofCount'] = newProofCount;

      await snap.request({
        method: 'snap_manageState',
        params: {
          operation: 'update',
          newState: persistedData,
        },
      });

      await snap.request({
        method: 'snap_notify',
        params: {
          type: 'inApp',
          message: `New Proof received`,
        },
      });

      return;
    }
    default:
      throw new Error('Method not found.');
  }
};
