const { ethers } = require("ethers");
const CampaignABI = require("../abis/Crowdfund.json");
const GovABI = require("../abis/CrowdfundGovernor.json");
const TokenABI = require("../abis/GovToken.json");
require("dotenv").config();

class BlockchainService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    this.campaignContract = new ethers.Contract(
      process.env.CROWDFUND_ADDRESS,
      CampaignABI.abi,
      this.provider
    );
    this.govContract = new ethers.Contract(
      process.env.GOVERNOR_ADDRESS,
      GovABI.abi,
      this.provider
    );
    this.tokenContract = new ethers.Contract(
      process.env.TOKEN_ADDRESS,
      TokenABI.abi,
      this.provider
    );
  }

  async getCampaignDetails(campaignId) {
    return this.campaignContract.campaigns(campaignId);
  }

  async getProposalState(proposalId) {
    return this.govContract.state(proposalId);
  }

  async getVotingPower(address) {
    return this.tokenContract.getVotes(address);
  }
}

// export default new BlockchainService();
module.exports = { BlockchainService };