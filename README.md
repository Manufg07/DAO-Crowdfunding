# Crowdfunding DAO

## Overview

Crowdfunding DAO is a decentralized platform that enables users to create, fund, and govern crowdfunding campaigns using smart contracts. It leverages blockchain technology to ensure transparency, security, and decentralization.

## Features

- **Campaign Creation**: Users can create crowdfunding campaigns with a title, description, and funding goal.
- **Campaign Approval**: Only approved campaigns can receive funding.
- **Fund Campaigns**: Supporters can contribute funds to approved campaigns.
- **Funds Release**: Once a campaign reaches its goal, funds are released to the campaign creator.
- **Governance**: A DAO structure allows token holders to participate in decision-making via voting mechanisms.
- **Tokenized Voting**: Uses governance tokens to enable decentralized decision-making.
- **Timelock Security**: Ensures that proposals are executed with a time delay to enhance security.

## Components

1. **Crowdfund Contract**: Handles campaign management, funding, and fund releases.
2. **Crowdfund Governor**: Manages the governance of the platform, allowing token holders to vote on proposals.
3. **Governance Token (GT)**: An ERC-20 token that provides voting power within the DAO.
4. **Timelock Contract**: Implements time-based restrictions for governance actions to enhance security.


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
