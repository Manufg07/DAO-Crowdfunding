require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "sepolia",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    hardhat: {
      // See its defaults
    },
    sepolia: {
      url: "https://sepolia.infura.io/v3/aa5dac7082944ce89be0e5b4e458b14c",
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200, // Adjust runs for better optimization
      },
    },
  },
};
