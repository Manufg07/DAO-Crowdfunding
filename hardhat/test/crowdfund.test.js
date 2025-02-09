const { network, ethers } = require("hardhat");

async function moveBlocks(number) {
  for (let index = 0; index < number; index++) {
    await network.provider.request({
      method: "evm_mine",
      params: [],
    });
  }
  console.log(`Moved ${number} blocks`);
}

async function moveTime(number) {
  await network.provider.send("evm_increaseTime", [number]);
  console.log(`Moved forward in time ${number} seconds`);
}

describe("Crowdfunding Platform Testing Flow", function () {
  it("Proposal to Executed Flow", async function () {
    /* ------------ Get Deployer's Address/Identity -------------*/
    const [deployer, backer1, backer2] = await ethers.getSigners();

    /* ------------ Deployment -------------*/
    // Deploy GovToken (no arguments)
    const GovToken = await ethers.deployContract("GovToken");

    // Deploy TimeLock
    const TimeLock = await ethers.deployContract("TimeLock", [
      0, // Min delay
      [deployer.address], // Proposers
      [deployer.address], // Executors
      deployer.address, // Admin
    ]);

    // Deploy Crowdfund (with initialOwner argument)
    const Crowdfund = await ethers.deployContract("Crowdfund", [
      deployer.address,
    ]);

    // Transfer Crowdfund ownership to TimeLock
    await Crowdfund.connect(deployer).transferOwnership(TimeLock.target);

    // Deploy CrowdfundGovernor
    const CrowdfundGovernor = await ethers.deployContract("CrowdfundGovernor", [
      GovToken.target,
      TimeLock.target,
    ]);

    console.log("TimeLock: ", TimeLock.target);
    console.log("Crowdfund: ", Crowdfund.target);
    console.log("CrowdfundGovernor: ", CrowdfundGovernor.target);
    console.log("GovToken: ", GovToken.target);

    /* ------------ Balance and Voting Power -------------*/
    // Mint tokens to deployer and backers
    await GovToken.mint(deployer.address, ethers.parseEther("1000"));
    await GovToken.mint(backer1.address, ethers.parseEther("100"));
    await GovToken.mint(backer2.address, ethers.parseEther("100"));

    // Delegate voting power
    await GovToken.connect(deployer).delegate(deployer.address);
    await GovToken.connect(backer1).delegate(backer1.address);
    await GovToken.connect(backer2).delegate(backer2.address);

    let votes = await GovToken.getVotes(deployer.address);
    console.log(`Votes for deployer: ${votes}`);

    /* ------------ Assign Roles to Governor Contract -------------*/
    const PROPOSER_ROLE = await TimeLock.PROPOSER_ROLE();
    const EXECUTOR_ROLE = await TimeLock.EXECUTOR_ROLE();

    await TimeLock.connect(deployer).grantRole(
      PROPOSER_ROLE,
      CrowdfundGovernor.target
    );
    await TimeLock.connect(deployer).grantRole(
      EXECUTOR_ROLE,
      CrowdfundGovernor.target
    );

    /* ------------ Create a Campaign -------------*/
    await Crowdfund.connect(deployer).createCampaign(
      "Decentralized Social Media",
      "A new social media platform built on blockchain.",
      ethers.parseEther("10") // Goal: 10 ETH
    );

    const campaignId = 1; // First campaign has ID 1
    console.log(`Campaign ID: ${campaignId}`);

    /* ------------ Proposal to Approve Campaign -------------*/
    const approveCalldata = Crowdfund.interface.encodeFunctionData(
      "approveCampaign",
      [campaignId]
    );

    const proposeTx = await CrowdfundGovernor.propose(
      [Crowdfund.target], // Targets
      [0], // Values
      [approveCalldata], // Calldata
      "Proposal #1: Approve Campaign #1"
    );
    await proposeTx.wait();

    const filter = CrowdfundGovernor.filters.ProposalCreated();
    const events = await CrowdfundGovernor.queryFilter(
      filter,
      proposeTx.blockNumber,
      proposeTx.blockNumber
    );
    const proposalId = events[0].args.proposalId;

    console.log(`Proposal ID Generated: ${proposalId}`);

    /* ------------ #0 Pending -------------*/
    let proposalState = await CrowdfundGovernor.state(proposalId);
    console.log(`Current Proposal State: ${proposalState}`);

    await moveBlocks(1); // Move past voting delay

    /* ------------ #1 Active = Voting -------------*/
    proposalState = await CrowdfundGovernor.state(proposalId);
    console.log(`Current Proposal State: ${proposalState}`);

    // Deployer votes FOR the proposal
    const voteTx = await CrowdfundGovernor.castVoteWithReason(
      proposalId,
      1,
      "I support this campaign"
    );
    await voteTx.wait(1);

    const proposalVotes = await CrowdfundGovernor.proposalVotes(proposalId);
    console.log("Against Votes:", proposalVotes.againstVotes.toString());
    console.log("For Votes:", proposalVotes.forVotes.toString());
    console.log("Abstain Votes:", proposalVotes.abstainVotes.toString());

    await moveBlocks(100); // Move past voting period

    /* ------------ #4 Succeeded -------------*/
    proposalState = await CrowdfundGovernor.state(proposalId);
    console.log(`Current Proposal State: ${proposalState}`);

    /* ------------ #5 Queued -------------*/
    const descriptionHash = ethers.id("Proposal #1: Approve Campaign #1");

    const queueTx = await CrowdfundGovernor.queue(
      [Crowdfund.target],
      [0],
      [approveCalldata],
      descriptionHash
    );
    await queueTx.wait(1);

    proposalState = await CrowdfundGovernor.state(proposalId);
    console.log(`Current Proposal State: ${proposalState}`);

    await moveTime(40); // Move past timelock delay
    await moveBlocks(1);

    /* ------------ #7 Execute -------------*/
    const executeTx = await CrowdfundGovernor.execute(
      [Crowdfund.target],
      [0],
      [approveCalldata],
      descriptionHash
    );
    await executeTx.wait(1);

    proposalState = await CrowdfundGovernor.state(proposalId);
    console.log(`Current Proposal State: ${proposalState}`);

    /* ------------ Verify Campaign Approval -------------*/
    const campaign = await Crowdfund.campaigns(campaignId);
    console.log("Campaign Approved:", campaign.isApproved);
  });
});
