import {
  Heading,
  CardBody,
  CardHeader,
  VStack,
  Divider,
  Box,
  Text,
  Flex,
  Button,
  Card,
} from '@chakra-ui/react';
import { useContext } from 'react';
import { AddSnapButton } from '../components/AddSnapButton';
import { MetamaskActions, MetaMaskContext } from '../hooks';
import { CardViewState, useCardViewContext } from '../hooks/CardViewContext';
import { addWallet, connectSnap, getSnap } from '../utils';

export const Initial = () => {
  const {setView} = useCardViewContext();
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
        <VStack padding="2">
          <Flex justifyContent="space-between" width="100%">
            <Box padding="2.5">
              <Heading size={'md'}>Create new Zk Wallet</Heading>
              <Text>Create a new wallet that's secure by default.</Text>
            </Box>
            <Box padding="3" marginTop="auto" marginBottom="auto">
              <Button onClick={() => setView(CardViewState.CREATING)}>
                + Create new
              </Button>
            </Box>
          </Flex>
          <Divider />
          <Flex justifyContent="space-between" width="100%">
            <Box padding="2.5">
              <Heading size={'md'}>Add Zk Wallet</Heading>
              <Text>
                Already have a Zk Wallet? Add your Zk Wallet to your Metamask
                Flask with our snap!
              </Text>
            </Box>
            <Box padding="3" marginTop="auto" marginBottom="auto">
              <AddSnapButton
                onConnectClick={handleConnectClick}
                state={state}
              />
            </Box>
            <Box padding="3" marginTop="auto" marginBottom="auto">
              <Button
                onClick={handleAddWalletClick}
              >Add Wallet to Snap</Button>
            </Box>
          </Flex>
        </VStack>
      </CardBody>
    </Card>
  );
};
