import { ComponentProps } from 'react';
import { MetamaskState } from '../hooks';
import { ReactComponent as FlaskFox } from '../assets/flask_fox.svg';
import { Button, Link, Text } from '@chakra-ui/react';
import { shouldDisplayReconnectButton } from '../utils';

export const InstallFlaskButton = () => (
  <Link href="https://metamask.io/flask/" target="_blank">
    <FlaskFox />
    <Button>Install MetaMask Flask</Button>
  </Link>
);

export const ConnectButton = (props: ComponentProps<typeof Button>) => {
  return (
    <Button {...props}>
      <FlaskFox />
      <Text> Connect</Text>
    </Button>
  );
};

export const ReconnectButton = (props: ComponentProps<typeof Button>) => {
  return (
    <Button {...props}>
      <FlaskFox />
      <Text>Reconnect</Text>
    </Button>
  );
};

export const ConnectedButton = (props: ComponentProps<typeof Button>) => {
  return (
    <Button {...props} disabled>
      <FlaskFox />
      <Text>Connected</Text>
    </Button>
  );
};

export const AddSnapButton = ({
  state,
  onConnectClick,
}: {
  state: MetamaskState;
  onConnectClick(): unknown;
}) => {
  if (!state.isFlask && !state.installedSnap) {
    return <InstallFlaskButton />;
  }

  if (!state.installedSnap) {
    return <ConnectButton onClick={onConnectClick} />;
  }

  if (shouldDisplayReconnectButton(state.installedSnap)) {
    return <ReconnectButton onClick={onConnectClick} />;
  }

  return <ConnectedButton />;
};
