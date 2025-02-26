import React, { useState } from "react";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { contracts } from "../../config/contractData";

const ProjectCard = ({ project, signer }) => {
  const [contributionAmount, setContributionAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // Modify the contribute function
const handleContribute = async () => {
  try {
    setLoading(true);
    const crowdFund = new ethers.Contract(
      contracts.crowdFund.address,
      contracts.crowdFund.abi,
      signer
    );

    // Convert project ID to BigInt
    const tx = await crowdFund.contribute(ethers.toBigInt(project.id), {
      value: ethers.parseEther(contributionAmount),
    });

    await tx.wait();
    toast.success(`Contributed ${contributionAmount} ETH!`);
    setContributionAmount("");
  } catch (error) {
    toast.error("Contribution failed: " + error.message);
  } finally {
    setLoading(false);
  }
};
    
const handleWithdraw = async () => {
  try {
    setLoading(true);
    const crowdFund = new ethers.Contract(
      contracts.crowdFund.address,
      contracts.crowdFund.abi,
      signer
    );

    // Convert ID to BigInt
    const tx = await crowdFund.withdraw(ethers.toBigInt(project.id));
    await tx.wait();
    toast.success("Funds withdrawn successfully!");
  } catch (error) {
    toast.error("Withdrawal failed: " + error.message);
  } finally {
    setLoading(false);
  }
};

const handleRefund = async () => {
  try {
    setLoading(true);
    const crowdFund = new ethers.Contract(
      contracts.crowdFund.address,
      contracts.crowdFund.abi,
      signer
    );

    // Convert ID to BigInt
    const tx = await crowdFund.claimRefund(ethers.toBigInt(project.id));
    await tx.wait();
    toast.success("Refund processed successfully!");
  } catch (error) {
    toast.error("Refund failed: " + error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4">Project #{project.id}</h3>
      <div className="space-y-2 mb-4">
        <p>Goal: {project.goal} ETH</p>
        <p>Raised: {project.raised} ETH</p>
        <p>Deadline: {project.deadline.toLocaleDateString()}</p>
        <p>
          Owner: {project.owner.slice(0, 6)}...{project.owner.slice(-4)}
        </p>
      </div>

      {!project.completed && (
        <div className="space-y-2">
          <input
            type="number"
            className="w-full p-2 text-black rounded"
            placeholder="ETH amount"
            value={contributionAmount}
            onChange={(e) => setContributionAmount(e.target.value)}
          />
          <button
            className="w-full bg-green-500 p-2 rounded disabled:bg-gray-500"
            onClick={handleContribute}
            disabled={loading}
          >
            {loading ? "Processing..." : "Contribute"}
          </button>
        </div>
      )}

      {project.completed ? (
        <div className="text-green-400">Project Completed</div>
      ) : (
        <div className="mt-4 space-y-2">
          {project.raised >= project.goal && new Date() > project.deadline && (
            <button
              className="w-full bg-blue-500 p-2 rounded disabled:bg-gray-500"
              onClick={handleWithdraw}
              disabled={loading || signer.address !== project.owner}
            >
              Withdraw Funds
            </button>
          )}

          {new Date() > project.deadline && project.raised < project.goal && (
            <button
              className="w-full bg-red-500 p-2 rounded disabled:bg-gray-500"
              onClick={handleRefund}
              disabled={loading}
            >
              Claim Refund
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectCard;
