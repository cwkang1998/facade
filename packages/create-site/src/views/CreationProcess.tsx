import { CardBody, CardHeader, Progress } from '@chakra-ui/react';
import { AddSnapButton } from '../components/AddSnapButton';

export const CreationProcess = () => {
  return (
    <>
      <CardHeader>
        <Progress value={80} />
      </CardHeader>
      <CardBody>
        <AddSnapButton onConnectClick={() => {}} state={{ isFlask: true }} />
      </CardBody>
    </>
  );
};
