const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy GovToken
  const GovToken = await ethers.deployContract("GovToken");
  await GovToken.waitForDeployment();
  console.log("GovToken deployed to:", GovToken.target);

  // Deploy TimeLock
  const TimeLock = await ethers.deployContract("TimeLock", [
    0, // Min delay
    [deployer.address], // Proposers
    [deployer.address], // Executors
    deployer.address, // Admin
  ]);
  await TimeLock.waitForDeployment();
  console.log("TimeLock deployed to:", TimeLock.target);

  // Deploy Crowdfund
  const Crowdfund = await ethers.deployContract("Crowdfund", [
    deployer.address,
  ]);
  await Crowdfund.waitForDeployment();
  console.log("Crowdfund deployed to:", Crowdfund.target);

  // Deploy CrowdfundGovernor
  const CrowdfundGovernor = await ethers.deployContract("CrowdfundGovernor", [
    GovToken.target,
    TimeLock.target,
  ]);
  await CrowdfundGovernor.waitForDeployment();
  console.log("CrowdfundGovernor deployed to:", CrowdfundGovernor.target);

  // Assign roles to Governor
  const PROPOSER_ROLE = await TimeLock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await TimeLock.EXECUTOR_ROLE();

  await TimeLock.grantRole(PROPOSER_ROLE, CrowdfundGovernor.target);
  await TimeLock.grantRole(EXECUTOR_ROLE, CrowdfundGovernor.target);

  console.log("Roles assigned to CrowdfundGovernor");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
