const mongoose = require("mongoose");

const CampaignSchema = new mongoose.Schema({
  campaignId: { type: Number, required: true, unique: true },
  creator: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  goal: { type: String, required: true },
  raised: { type: String, default: "0" },
  isApproved: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },
  proposals: [{ type: mongoose.Schema.Types.ObjectId, ref: "Proposal" }],
  events: [
    {
      type: { type: String, required: true },
      blockNumber: { type: Number, required: true },
      timestamp: { type: Date, default: Date.now },
      data: { type: Object },
    },
  ],
});

module.exports = mongoose.model("Campaign", CampaignSchema);
