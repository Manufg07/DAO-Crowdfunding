// server.js
const express = require("express");
const mongoose = require("mongoose");
const { ethers } = require("ethers");
const Proposal = require("./models/Proposal");
const contracts = require("./config/contractData");

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Blockchain listener service
const initBlockchainListener = async () => {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const governor = new ethers.Contract(
    contracts.governor.address,
    contracts.governor.abi,
    provider
  );

  // Listen for state changes
  governor.on("ProposalStateChanged", async (proposalId, state, tx) => {
    const proposal = await Proposal.findOne({
      proposalId: proposalId.toString(),
    });
    if (proposal) {
      proposal.history.push({
        state: getStateName(state),
        txHash: tx.transactionHash,
      });
      proposal.currentState = getStateName(state);
      await proposal.save();
    }
  });
};

function getStateName(stateIndex) {
  const states = [
    "Pending",
    "Active",
    "Canceled",
    "Defeated",
    "Succeeded",
    "Queued",
    "Expired",
    "Executed",
  ];
  return states[stateIndex] || "Unknown";
}

// API Endpoints
app.post("/api/proposals", async (req, res) => {
  try {
    const newProposal = new Proposal(req.body);
    await newProposal.save();
    res.status(201).json(newProposal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/proposals/:id/history", async (req, res) => {
  try {
    const proposal = await Proposal.findOne({ proposalId: req.params.id });
    res.json(proposal.history);
  } catch (error) {
    res.status(404).json({ error: "Proposal not found" });
  }
});

// Start server
app.listen(3001, () => {
  console.log("Server running on port 3001");
  initBlockchainListener();
});
