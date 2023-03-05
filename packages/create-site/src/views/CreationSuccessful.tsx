import { Card, CardBody, CardHeader, Progress, Text } from '@chakra-ui/react';
import { AddSnapButton } from '../components/AddSnapButton';

export const CreationSuccessful = () => {
  return (
    <Card>
      <CardHeader>
        <Text>Create your first Zk Multisig Wallet</Text>
        <Progress value={80} />
      </CardHeader>
      <CardBody>
        <AddSnapButton onConnectClick={() => {}} state={{ isFlask: true }} />
      </CardBody>
    </Card>
  );
};
