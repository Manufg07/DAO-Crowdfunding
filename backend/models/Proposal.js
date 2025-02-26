// models/Proposal.js
const mongoose = require("mongoose");

const proposalHistorySchema = new mongoose.Schema({
  state: String,
  timestamp: { type: Date, default: Date.now },
  txHash: String,
});

const proposalSchema = new mongoose.Schema({
  proposalId: { type: Number, required: true, unique: true },
  description: String,
  creator: String,
  targets: [String],
  values: [Number],
  calldatas: [String],
  currentState: String,
  history: [proposalHistorySchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Proposal", proposalSchema);
