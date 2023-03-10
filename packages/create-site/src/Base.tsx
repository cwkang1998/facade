import { Container, Flex } from '@chakra-ui/react';
import { Navbar } from './components/Navbar';
import { useCardViewContext } from './hooks/CardViewContext';
import { CreationProcess } from './views/CreationProcess';
import { CreationSuccessful } from './views/CreationSuccessful';
import { Initial } from './views/Initial';

enum CardViewState {
  INITIAL,
  CREATING,
  CREATE_SUCCESS,
}

export const Base = () => {
  const { currentView } = useCardViewContext();

  let CurrentViewComponent = Initial;
  if (currentView === CardViewState.CREATING) {
    CurrentViewComponent = CreationProcess;
  } else if (currentView === CardViewState.CREATE_SUCCESS) {
    CurrentViewComponent = CreationSuccessful;
  }

  return (
    <Flex height="100vh" direction="column">
      <Navbar />
      <Flex direction="column" margin="auto">
        <CurrentViewComponent />
      </Flex>
    </Flex>
  );
};
