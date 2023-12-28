import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "@openzeppelin/hardhat-upgrades";

import dotenv from "dotenv";

const cfg = dotenv.config().parsed!;

let polygonscanKey = !cfg.POLYGONSCAN_KEY ? "" : cfg.POLYGONSCAN_KEY;
let mnemonic = !cfg.MNEMONIC ? "" : cfg.MNEMONIC;
let rpcURL = !cfg.RPC_URL ? "" : cfg.RPC_URL;

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  defaultNetwork: "mumbai",

  etherscan: {
    apiKey: polygonscanKey
  },

  networks: {
    hardhat: {
      chainId: 1337,
    },
    mumbai: {
      chainId: 80001,
      accounts: {
        mnemonic: mnemonic,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20
      },
      url: rpcURL,
    }
  }
};


export default config;
