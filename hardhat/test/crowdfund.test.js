const { network, ethers } = require("hardhat");
const { assert } = require("chai");

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

describe("Crowdfunding DAO Testing Flow", function () {
  it("Full Proposal to Execution Flow", async function () {
    const [deployer] = await ethers.getSigners();

    /* ------------ Deployment -------------*/
    const GovToken = await ethers.deployContract("GovToken", [deployer]);
    const TimeLock = await ethers.deployContract("TimeLock", [
      0,
      [deployer.address],
      [deployer.address],
      deployer.address,
    ]);
    const CrowdFund = await ethers.deployContract("CrowdFund", [
      TimeLock.target,
    ]);
    const MyGovernor = await ethers.deployContract("MyGovernor", [
      GovToken.target,
      TimeLock.target,
    ]);

    console.log("Contracts deployed:");
    console.log("TimeLock:", TimeLock.target);
    console.log("CrowdFund:", CrowdFund.target);
    console.log("MyGovernor:", MyGovernor.target);
    console.log("GovToken:", GovToken.target);

    /* ------------ Voting Power Setup -------------*/
    await GovToken.delegate(deployer.address);
    const votes = await GovToken.getVotes(deployer.address);
    console.log(`Delegated votes: ${votes}`);

    /* ------------ Role Assignment -------------*/
    const PROPOSER_ROLE = await TimeLock.PROPOSER_ROLE();
    const EXECUTOR_ROLE = await TimeLock.EXECUTOR_ROLE();
    await TimeLock.grantRole(PROPOSER_ROLE, MyGovernor.target);
    await TimeLock.grantRole(EXECUTOR_ROLE, MyGovernor.target);

    /* ------------ Create Project Proposal -------------*/
    const projectId = 1;
    const goal = ethers.parseEther("10"); // 10 ETH
    const durationDays = 30;

    const createProjectCalldata = CrowdFund.interface.encodeFunctionData(
      "createProject",
      [projectId, deployer.address, goal, durationDays]
    );

    const proposeTx = await MyGovernor.propose(
      [CrowdFund.target],
      [0],
      [createProjectCalldata],
      "Proposal #1: Create New Project"
    );
    const receipt = await proposeTx.wait();
    const event = receipt.logs.find(
      (x) => x.fragment.name === "ProposalCreated"
    );
    const proposalId = event.args.proposalId;
    console.log(`Proposal ID: ${proposalId}`);

    /* ------------ Voting Phase -------------*/
    // Move just past voting delay (10 blocks)
    await moveBlocks(10 + 1);

    let state = await MyGovernor.state(proposalId);
    console.log(`Proposal state after delay: ${state}`); // Should be Active (1)

    // Cast vote during active period
    const voteTx = await MyGovernor.castVoteWithReason(
      proposalId,
      1,
      "Approving project"
    );
    await voteTx.wait();

    // Move past voting period (10 blocks)
    await moveBlocks(10 + 1);

    state = await MyGovernor.state(proposalId);
    console.log(`Proposal state after voting: ${state}`); // Should be Succeeded (4)
    /* ------------ Queue & Execute -------------*/
    const descriptionHash = ethers.id("Proposal #1: Create New Project");

    // Queue
    const queueTx = await MyGovernor.queue(
      [CrowdFund.target],
      [0],
      [createProjectCalldata],
      descriptionHash
    );
    await queueTx.wait();

    await moveTime(86400); // 1 day delay
    await moveBlocks(1);

    // Execute
    const executeTx = await MyGovernor.execute(
      [CrowdFund.target],
      [0],
      [createProjectCalldata],
      descriptionHash
    );
    await executeTx.wait();

    /* ------------ Verification -------------*/
    const finalState = await MyGovernor.state(proposalId);
    console.log(`Final proposal state: ${finalState}`);

    // Check project creation
    const project = await CrowdFund.projects(projectId);
    console.log("Project details:", {
      owner: project.owner,
      goal: ethers.formatEther(project.goal), // Convert to readable ETH
      deadline: new Date(Number(project.deadline) * 1000), // Proper BigInt conversion
      approved: project.approved,
    });

    // Verify project was created correctly
    assert.equal(project.owner, deployer.address);
    assert.equal(project.goal.toString(), goal.toString()); // Compare string representations
    assert.isTrue(project.approved);
  });
});
