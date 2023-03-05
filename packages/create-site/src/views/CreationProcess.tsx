import {
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Container,
  Divider,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  Link,
  ListItem,
  Progress,
  Select,
  Text,
  Textarea,
  UnorderedList,
  VStack,
} from '@chakra-ui/react';
import { useState } from 'react';
import { CardViewState, useCardViewContext } from '../hooks/CardViewContext';

enum CreationStep {
  NETWORK_SELECT,
  OWNER_DETAILS,
  FINAL_REVIEW,
}

export type WalletCreationDetail = {
  name?: string;
  network?: 'goerli' | 'scroll' | 'mumbai';
  ownerHashes?: string[];
  threshold?: number;
};

const NetworkSelection = ({
  fieldState,
  onFieldChange,
}: {
  fieldState?: WalletCreationDetail;
  onFieldChange: (fieldName: string) => (newVal: any) => void;
}) => {
  return (
    <Flex direction="row" justifyContent="space-evenly">
      <FormControl>
        <FormLabel>Wallet name</FormLabel>
        <Input
          type="text"
          required
          value={fieldState?.name}
          onChange={(e) => onFieldChange('name')(e.target.value)}
        />
      </FormControl>
      <FormControl>
        <FormLabel>Network</FormLabel>
        <Select
          placeholder="Select network"
          required
          value={fieldState?.network}
          onChange={(e) => {
            onFieldChange('network')(e.target.value);
          }}
        >
          <option value="goerli">Goerli</option>
          <option value="scroll">Scroll</option>
          <option value="mumbai">Polygon Mumbai</option>
        </Select>
      </FormControl>
    </Flex>
  );
};

const OwnerForm = ({
  fieldState,
  onFieldChange,
}: {
  fieldState?: WalletCreationDetail;
  onFieldChange: (fieldName: string) => (newVal: any) => void;
}) => {
  return (
    <Flex direction="column" justifyContent="space-evenly">
      <FormControl>
        <FormLabel>OwnerHashes</FormLabel>
        <Textarea
          defaultValue={fieldState?.ownerHashes?.join(',')}
          onChange={(e) => {
            const commaSeparatedText = e.target.value;
            const hashesArray = commaSeparatedText
              .split(',')
              .filter((h) => h && h.length > 0);
            onFieldChange('ownerHashes')(hashesArray);
          }}
        />
        <FormHelperText>
          Put in the hash of the owners public key here, separated by commas.
        </FormHelperText>
      </FormControl>
      <Divider marginTop={5} />
      <FormControl marginTop={5}>
        <FormLabel>Threshold</FormLabel>
        <Input
          type="number"
          required
          value={fieldState?.threshold}
          onChange={(e) => onFieldChange('threshold')(e.target.value)}
        />
      </FormControl>
    </Flex>
  );
};

const ReviewForm = ({ fieldState }: { fieldState: WalletCreationDetail }) => {
  return (
    <Container justifyContent="space-evenly">
      <Text fontSize={'3xl'}>Review</Text>
      <Flex direction="row" justifyContent="space-between" marginTop={5}>
        <Text>Wallet Name:</Text>
        <Text>{fieldState.name}</Text>
      </Flex>
      <Flex direction="row" justifyContent="space-between">
        <Text>Network:</Text>
        <Text>{fieldState.network}</Text>
      </Flex>
      <Flex direction="row" justifyContent="space-between">
        <Text>Owner Hashes:</Text>
        <UnorderedList>
          {fieldState.ownerHashes?.map((h) => (
            <ListItem>{`${h.slice(0, 4)}..${h.slice(h.length - 4)}`}</ListItem>
          ))}
        </UnorderedList>
      </Flex>
      <Flex direction="row" justifyContent="space-between">
        <Text>Threshold:</Text>
        <Text>{fieldState.threshold}</Text>
      </Flex>
    </Container>
  );
};

export const CreationProcess = () => {
  const [currentView, setCurrentView] = useCardViewContext();
  const [currentStep, setCurrentStep] = useState<CreationStep>(
    CreationStep.NETWORK_SELECT,
  );
  const [progress, setProgress] = useState(33);
  const [walletDetail, setWalletDetail] = useState<WalletCreationDetail>({
    name: '',
    network: 'goerli',
    ownerHashes: [],
    threshold: 0,
  });
  const [isCreationLoading, setIsCreationLoading] = useState(false);

  const handleBack = () => {
    if (currentStep === CreationStep.NETWORK_SELECT) {
      setProgress(0);
      setCurrentView(CardViewState.INITIAL);
    } else if (currentStep === CreationStep.OWNER_DETAILS) {
      setProgress(33);
      setCurrentStep(CreationStep.NETWORK_SELECT);
    } else if (currentStep === CreationStep.FINAL_REVIEW) {
      setProgress(67);
      setCurrentStep(CreationStep.OWNER_DETAILS);
    }
  };

  const onFieldChange = (fieldName: string) => {
    return (newVal: any) => {
      setWalletDetail((prev) => ({
        ...prev,
        [fieldName]: newVal,
      }));
    };
  };

  const handleNextButtonClick = () => {
    if (currentStep === CreationStep.NETWORK_SELECT) {
      if (walletDetail?.name && walletDetail?.network) {
        setCurrentStep(CreationStep.OWNER_DETAILS);
        setProgress(67);
      }
    } else if (currentStep === CreationStep.OWNER_DETAILS) {
      if (
        walletDetail?.ownerHashes &&
        walletDetail.ownerHashes.length > 0 &&
        walletDetail?.threshold &&
        walletDetail.threshold <= walletDetail.ownerHashes.length
      ) {
        setCurrentStep(CreationStep.FINAL_REVIEW);
        setProgress(100);
      }
    } else if (currentStep === CreationStep.FINAL_REVIEW) {
      setIsCreationLoading(true);
      // Should call creation here;
      setIsCreationLoading(false);
      setCurrentView(CardViewState.CREATE_SUCCESS);
    }
  };

  let currentStepView = (
    <NetworkSelection fieldState={walletDetail} onFieldChange={onFieldChange} />
  );
  if (currentStep === CreationStep.OWNER_DETAILS) {
    currentStepView = (
      <OwnerForm fieldState={walletDetail} onFieldChange={onFieldChange} />
    );
  } else if (currentStep === CreationStep.FINAL_REVIEW) {
    currentStepView = <ReviewForm fieldState={walletDetail} />;
  }

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
      <CardFooter justifyContent="right">
        <Button
          onClick={handleNextButtonClick}
          paddingTop={4}
          paddingBottom={4}
          paddingRight={7}
          paddingLeft={7}
          isLoading={isCreationLoading}
        >
          {currentStep !== CreationStep.FINAL_REVIEW ? 'Next' : 'Confirm'}
        </Button>
      </CardFooter>
    </Card>
  );
};
