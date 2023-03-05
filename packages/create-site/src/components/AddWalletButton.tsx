// export const sendHello = async () => {
//     await window.ethereum.request({
//       method: 'wallet_invokeSnap',
//       params: { snapId: defaultSnapOrigin, request: { method: 'hello' } },
//     });
//   };

import { Button } from '@chakra-ui/react';
import { ComponentProps } from 'react';

export const AddWalletButton = (props: ComponentProps<typeof Button>) => {
  return <Button {...props}>Add Wallet</Button>;
};