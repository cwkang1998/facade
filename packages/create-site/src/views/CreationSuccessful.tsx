import {
  Card,
  CardBody,
  Box,
  Text,
  CardFooter,
  Button,
  Flex,
} from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import { AddSnapButton } from '../components/AddSnapButton';
import { useContext } from 'react';
import { MetamaskActions, MetaMaskContext } from '../hooks';
import { addWallet, connectSnap, getSnap } from '../utils';

export const CreationSuccessful = () => {
  const [state, dispatch] = useContext(MetaMaskContext);

  const handleConnectClick = async () => {
    try {
      await connectSnap();
      const installedSnap = await getSnap();

      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      });
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const handleAddWalletClick = async () => {
    try {
      await addWallet();
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  return (
    <Card>
      <CardBody>
        <Box textAlign="center" py={10} px={6}>
          <CheckCircleIcon boxSize={'50px'} color={'green.500'} />
          <Text fontSize="4xl" mt={6} mb={2}>
            Successfully created your Facade wallet!
          </Text>
          <Text color={'gray.500'}>
            Start using your Facade wallet by adding the snap to Metamask Flask.
          </Text>
        </Box>
      </CardBody>
      <CardFooter>
        <Flex marginRight="auto" marginLeft="auto">
          <Box padding="3" marginTop="auto" marginBottom="auto">
            <AddSnapButton onConnectClick={handleConnectClick} state={state} />
          </Box>
          <Box padding="3" marginTop="auto" marginBottom="auto">
            <Button onClick={handleAddWalletClick}>Add Wallet to Snap</Button>
          </Box>
        </Flex>
      </CardFooter>
    </Card>
  );
};
