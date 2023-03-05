import { ethers } from 'ethers';

const API_URL = process.env.REACT_APP_RELAYER_URL;

export type WalletCreationDetail = {
  name?: string;
  network?: 'goerli' | 'scroll' | 'mumbai';
  ownerHashes?: string[];
  threshold?: number;
};

export const createWallet = async (data: WalletCreationDetail) => {
  console.log(API_URL);
  const res = await fetch(`${API_URL}/create`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const jsonRes = await res.json();
  console.log(jsonRes)

  return jsonRes as ethers.providers.TransactionReceipt;
};
