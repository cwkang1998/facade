import {
  Box,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Link,
  Progress,
  Select,
  VStack,
} from '@chakra-ui/react';
import { useState } from 'react';
import { AddSnapButton } from '../components/AddSnapButton';
import { CardViewState, useCardViewContext } from '../hooks/CardViewContext';

enum CreationStep {
  NETWORK_SELECT,
  OWNER_DETAILS,
  FINAL_REVIEW,
}

export type WalletCreationDetail = {
  name: string;
  network: 'goerli' | 'scroll' | 'mumbai';
  ownerHashes: string[];
};

const NetworkSelection = () => {
  return (
    <Flex direction="row" justifyContent="space-evenly">
      <FormControl>
        <FormLabel>Wallet name</FormLabel>
        <Input type="text" />
      </FormControl>
      <FormControl>
        <FormLabel>Network</FormLabel>
        <Select placeholder="Select network">
          <option value="goerli">Goerli</option>
          <option value="scroll">Scroll</option>
          <option value="mumbai">Polygon Mumbai</option>
        </Select>
      </FormControl>
    </Flex>
  );
};

const OwnerForm = () => {
  return <Flex direction="row" justifyContent="space-evenly"></Flex>;
};

const ReviewForm = () => {
  return <Flex direction="row" justifyContent="space-evenly"></Flex>;
};

export const CreationProcess = () => {
  const [currentView, setCurrentView] = useCardViewContext();
  const [currentStep, setCurrentStep] = useState<CreationStep>(
    CreationStep.NETWORK_SELECT,
  );
  const [progress, setProgress] = useState(25);

  let currentStepView = <NetworkSelection />;
  if (currentStep === CreationStep.OWNER_DETAILS) {
    currentStepView = <OwnerForm />;
  } else if (currentStep === CreationStep.FINAL_REVIEW) {
    currentStepView = <ReviewForm />;
  }

  const handleBack = () => {
    if (currentStep === CreationStep.NETWORK_SELECT) {
      setCurrentView(CardViewState.INITIAL);
    } else if (currentStep === CreationStep.OWNER_DETAILS) {
      setCurrentStep(CreationStep.NETWORK_SELECT);
    } else if (currentStep === CreationStep.FINAL_REVIEW) {
      setCurrentStep(CreationStep.OWNER_DETAILS);
    }
  };

  return (
    <Card width="50em">
      <CardHeader>
        <VStack>
          <Box width="100%">
            <Link onClick={handleBack}>{'< Back'}</Link>
          </Box>
          <Box width="100%" paddingTop="3" paddingBottom="3">
            <Progress value={progress} />
          </Box>
        </VStack>
      </CardHeader>
      <CardBody>{currentStepView}</CardBody>
      <CardFooter>
        <AddSnapButton onConnectClick={() => {}} state={{ isFlask: true }} />
      </CardFooter>
    </Card>
  );
};
