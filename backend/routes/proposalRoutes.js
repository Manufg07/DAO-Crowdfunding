const express = require("express");
const {
  getProposals,
  getProposalById,
} = require("../controllers/proposalController");

const router = express.Router();

router.get("/:campaignId", getProposals);
router.get("/:id", getProposalById);

module.exports = router;
