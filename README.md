# Crowdfunding DAO

## Overview
This smart contract implements a decentralized crowdfunding platform where users can create campaigns, fund them, and receive funds upon reaching the goal. The contract owner has the authority to approve campaigns and release funds.


## Installation & Deployment
### Prerequisites
- Node.js & npm
- Hardhat or Truffle
- Solidity `^0.8.20`

### Steps
1. Clone the repository:
   ```sh
   git clone https://github.com/Manufg07/DAO-Crowdfunding.git
   cd hardhat
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Compile the contract:
   ```sh
   npx hardhat compile
   ```
4. Deploy the contract:
   ```sh
   npx hardhat run scripts/deploy.js --network <network>
   ```
