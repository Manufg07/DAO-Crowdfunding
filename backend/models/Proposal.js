const mongoose = require("mongoose");

const ProposalSchema = new mongoose.Schema({
  proposalId: { type: String, required: true, unique: true },
  campaignId: { type: Number, required: true },
  state: {
    type: String,
    enum: [
      "Pending",
      "Active",
      "Canceled",
      "Defeated",
      "Succeeded",
      "Queued",
      "Expired",
      "Executed",
    ],
    default: "Pending",
  },
  startBlock: { type: Number },
  endBlock: { type: Number },
  votes: {
    for: { type: Number, default: 0 },
    against: { type: Number, default: 0 },
    abstain: { type: Number, default: 0 },
  },
  voters: [
    {
      voter: { type: String },
      votes: { type: Number },
      choice: { type: String, enum: ["For", "Against", "Abstain"] },
    },
  ],
});

module.exports = mongoose.model("Proposal", ProposalSchema);
