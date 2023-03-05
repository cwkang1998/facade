import { Card, CardBody, Box, Text, CardFooter } from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import { AddSnapButton } from '../components/AddSnapButton';

export const CreationSuccessful = () => {
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
        <Box marginRight="auto" marginLeft="auto">
          <AddSnapButton onConnectClick={() => {}} state={{ isFlask: true }} />
        </Box>
      </CardFooter>
    </Card>
  );
};
