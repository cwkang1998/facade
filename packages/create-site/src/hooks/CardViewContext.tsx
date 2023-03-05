import { useState } from 'react';
import { createContext, PropsWithChildren, useContext } from 'react';

export enum CardViewState {
  INITIAL,
  CREATING,
  CREATE_SUCCESS,
}

const CardViewContext = createContext<{
  currentView: CardViewState;
  setView: (nextView: CardViewState, data?: Record<string, any>) => void;
  data: Record<string, any>;
}>({ currentView: CardViewState.INITIAL, setView: () => {}, data: {} });

export const useCardViewContext = () => {
  return useContext(CardViewContext);
};

export const CardViewProvider = ({ children }: PropsWithChildren<{}>) => {
  const [currentView, setCurrentView] = useState<CardViewState>(
    CardViewState.INITIAL,
  );
  const [extraProp, setExtraProp] = useState<Record<string, any>>({});

  const setView = (nextView: CardViewState, data?: Record<string, any>) => {
    setCurrentView(nextView);
    if (data) {
      setExtraProp(data);
    }
  };

  return (
    <CardViewContext.Provider value={{ currentView, setView, data: extraProp }}>
      {children}
    </CardViewContext.Provider>
  );
};
