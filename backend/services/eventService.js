const { ethers } = require("ethers");
const CampaignABI = require("../abis/Crowdfund.json");
const GovABI = require("../abis/CrowdfundGovernor.json");
const TokenABI = require("../abis/GovToken.json");
const Campaign = require("../models/Campaign");
const Proposal = require("../models/Proposal");
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
require("dotenv").config();

const campaignContract = new ethers.Contract(
  process.env.CROWDFUND_ADDRESS,
  CampaignABI.abi,
  provider
);
const govContract = new ethers.Contract(
  process.env.GOVERNOR_ADDRESS,
  GovABI.abi,
  provider
);

const setupEventListeners = async () => {
  // Campaign Created
  campaignContract.on("CampaignCreated", async (id, creator, title, goal) => {
    const campaign = new Campaign({
      campaignId: id,
      creator,
      title,
      goal: ethers.formatEther(goal),
      raised: "0",
    });
    await campaign.save();
  });

  // Proposal Created
  govContract.on(
    "ProposalCreated",
    async (proposalId, proposer, targets, values, description) => {
      const campaign = await Campaign.findOne({ campaignId: targets[0] });
      if (campaign) {
        const proposal = new Proposal({
          proposalId,
          campaignId: targets[0],
          state: "Pending",
        });
        await proposal.save();
        campaign.proposals.push(proposal);
        await campaign.save();
      }
    }
  );

  // Vote Cast
  govContract.on(
    "VoteCast",
    async (voter, proposalId, support, votes, reason) => {
      const proposal = await Proposal.findOne({ proposalId });
      if (proposal) {
        proposal.voters.push({
          voter,
          votes: votes.toString(),
          choice: support === 1 ? "For" : support === 0 ? "Against" : "Abstain",
        });
        await proposal.save();
      }
    }
  );
};

module.exports = { setupEventListeners };
