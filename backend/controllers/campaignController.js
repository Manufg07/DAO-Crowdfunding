const Campaign = require("../models/Campaign");
const { getCampaignDetails } = require("../services/blockchainService");

// Create a new campaign
const createCampaign = async (req, res) => {
  const { title, description, goal } = req.body;
  try {
    const campaign = new Campaign({ title, description, goal });
    await campaign.save();
    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ error: "Failed to create campaign" });
  }
};

// Get all campaigns
const getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().populate("proposals");
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
};

// Get a single campaign by ID
const getCampaignById = async (req, res) => {
  const { id } = req.params;
  try {
    const campaign = await Campaign.findOne({ campaignId: id }).populate(
      "proposals"
    );
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch campaign" });
  }
};

module.exports = { createCampaign, getCampaigns, getCampaignById };
