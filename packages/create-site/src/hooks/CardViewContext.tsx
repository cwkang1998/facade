import { useState } from 'react';
import {
  createContext,
  Dispatch,
  PropsWithChildren,
  useContext,
} from 'react';

enum CardViewState {
  INITIAL,
  CREATING,
  CREATE_SUCCESS,
}

const CardViewContext = createContext<
  [CardViewState, Dispatch<React.SetStateAction<CardViewState>>]
>([CardViewState.INITIAL, () => {}]);

export const useCardViewContext = () => {
  return useContext(CardViewContext);
};

export const CardViewProvider = ({ children }: PropsWithChildren<{}>) => {
  const [currentView, setCurrentView] = useState<CardViewState>(
    CardViewState.INITIAL,
  );

  return (
    <CardViewContext.Provider value={[currentView, setCurrentView]}>
      {children}
    </CardViewContext.Provider>
  );
};
