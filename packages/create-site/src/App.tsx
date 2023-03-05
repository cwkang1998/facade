import { ChakraProvider, useColorMode } from '@chakra-ui/react';
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultWallets,
  RainbowKitProvider,
  lightTheme,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { configureChains, createClient, WagmiConfig } from 'wagmi';
import {
  goerli,
  zkSyncTestnet,
  metisGoerli,
  polygonZkEvmTestnet,
  mainnet,
  polygon,
  optimism,
  arbitrum,
} from 'wagmi/chains';
import { infuraProvider } from 'wagmi/providers/infura';
import { publicProvider } from 'wagmi/providers/public';
import { Base } from './Base';
import { CardViewProvider } from './hooks/CardViewContext';
import theme from './theme';

const { chains, provider } = configureChains(
  [
    goerli,
    zkSyncTestnet,
    metisGoerli,
    polygonZkEvmTestnet,
    mainnet,
    polygon,
    optimism,
    arbitrum,
  ],
  [
    publicProvider(),
    infuraProvider({ apiKey: process.env.REACT_APP_INFURA || '' }),
  ],
);

const { connectors } = getDefaultWallets({
  appName: 'Facade',
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

const InnerApp = () => {
  const { colorMode } = useColorMode();
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider
        chains={chains}
        theme={colorMode === 'light' ? lightTheme() : darkTheme()}
      >
        <CardViewProvider>
          <Base />
        </CardViewProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
};

const App = () => {
  return (
    <ChakraProvider theme={theme}>
      <InnerApp />
    </ChakraProvider>
  );
};

export default App;
