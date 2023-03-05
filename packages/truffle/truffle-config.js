require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');
const privateKey = process.env.PRIVATE_KEY;

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  contracts_build_directory: './build',
  networks: {
    // Useful for testing. The `development` name is special - truffle uses it by default
    // if it's defined here and no other network is specified at the command line.
    // You should run a client (like ganache, geth, or parity) in a separate terminal
    // tab if you use this network and you must also set the `host`, `port` and `network_id`
    // options below to some value.
    //
    development: {
      host: "127.0.0.1", // Localhost (default: none)
      port: 8545, // Standard Ethereum port (default: none)
      network_id: '*', // Any network (default: none)
    },
    // Goerli
    goerli: {
      network_id: 5,
      provider: () => new HDWalletProvider(privateKey, "https://goerli.infura.io/v3/bd257f52f1334580bf8738ca575bedbc")
    },
    scroll: {
      network_id: 534353,
      provider: () => new HDWalletProvider(privateKey, "https://alpha-rpc.scroll.io/l2")
    },
    polygonZkEvm: {
      network_id: 1442,
      provider: () => new HDWalletProvider(privateKey, "https://rpc.public.zkevm-test.net")
    }
  },

  // Set default mocha options here, use special reporters, etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: '0.8.17', // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      // settings: {          // See the solidity docs for advice about optimization and evmVersion
      //  optimizer: {
      //    enabled: false,
      //    runs: 200
      //  },
      //  evmVersion: "byzantium"
      // }
    },
  },

  // Truffle DB is currently disabled by default; to enable it, change enabled:
  // false to enabled: true. The default storage location can also be
  // overridden by specifying the adapter settings, as shown in the commented code below.
  //
  // NOTE: It is not possible to migrate your contracts to truffle DB and you should
  // make a backup of your artifacts to a safe location before enabling this feature.
  //
  // After you backed up your artifacts you can utilize db by running migrate as follows:
  // $ truffle migrate --reset --compile-all
  //
  // db: {
  //   enabled: false,
  //   host: "127.0.0.1",
  //   adapter: {
  //     name: "sqlite",
  //     settings: {
  //       directory: ".db"
  //     }
  //   }
  // }
};
