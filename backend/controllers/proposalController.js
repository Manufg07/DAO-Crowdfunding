const Proposal = require("../models/Proposal");

// Get all proposals for a campaign
const getProposals = async (req, res) => {
  const { campaignId } = req.params;
  try {
    const proposals = await Proposal.find({ campaignId });
    res.json(proposals);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch proposals" });
  }
};

// Get a single proposal by ID
const getProposalById = async (req, res) => {
  const { id } = req.params;
  try {
    const proposal = await Proposal.findOne({ proposalId: id });
    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }
    res.json(proposal);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch proposal" });
  }
};

module.exports = { getProposals, getProposalById };
