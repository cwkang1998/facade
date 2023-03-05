import {
  Heading,
  CardBody,
  CardHeader,
  VStack,
  Divider,
  Box,
  HStack,
  Text,
  Flex,
  Button,
} from '@chakra-ui/react';
import { AddSnapButton } from '../components/AddSnapButton';
import { CardViewState, useCardViewContext } from '../hooks/CardViewContext';

export const Initial = () => {
  const [currentView, setCurrentView] = useCardViewContext();
  return (
    <>
      <CardBody>
        <VStack padding="2">
          <Flex justifyContent="space-between" width="100%">
            <Box padding="2.5">
              <Heading size={'md'}>Create new Zk Wallet</Heading>
              <Text>Create a new wallet that's secure by default.</Text>
            </Box>
            <Box padding="3" marginTop="auto" marginBottom="auto">
              <Button onClick={() => setCurrentView(CardViewState.CREATING)}>
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
                onConnectClick={() => {}}
                state={{ isFlask: true }}
              />
            </Box>
          </Flex>
        </VStack>
      </CardBody>
    </>
  );
};
