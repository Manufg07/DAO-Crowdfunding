import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import { toast } from "react-toastify";

const GovernanceTable = ({
  governor,
  crowdFund,
  signer,
  activeProposals,
  setActiveProposals,
  fetchProposalState,
  fetchProjects,
}) => {
  const [loading, setLoading] = useState(false);
  const [voteOption, setVoteOption] = useState("1");
  const [voteReason, setVoteReason] = useState("");
  const [selectedProposalId, setSelectedProposalId] = useState("");

  useEffect(() => {
    if (activeProposals.length > 0 && governor) {
      const interval = setInterval(() => {
        activeProposals.forEach((proposal) => {
          fetchProposalState(proposal.id, true);
        });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeProposals, governor, fetchProposalState]);

  const handleVote = async () => {
    if (!selectedProposalId) {
      toast.error("Please select a proposal to vote on.");
      return;
    }

    try {
      setLoading(true);

      // Convert to appropriate types for contract call
      const proposalId = ethers.toBigInt(selectedProposalId);
      const voteOptionNumber = parseInt(voteOption, 10);

      const tx = await governor.castVoteWithReason(
        proposalId,
        voteOptionNumber, // Must be number, not string
        voteReason
      );

      await tx.wait();
      toast.success(`Vote cast for Proposal #${selectedProposalId}`);
      fetchProposalState(selectedProposalId);
      setVoteReason("");
      setSelectedProposalId("");
    } catch (error) {
      console.error("Voting error:", error);
      toast.error("Voting failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const queueProposal = async (proposal) => {
    try {
      setLoading(true);
      const descriptionHash = ethers.keccak256(
        ethers.toUtf8Bytes(proposal.description)
      );
      const tx = await governor.queue(
        [crowdFund.target],
        [0],
        [proposal.calldata],
        descriptionHash
      );
      await tx.wait();
      toast.success(`Proposal #${proposal.id} queued!`);
      fetchProposalState(proposal.id);
    } catch (error) {
      toast.error("Queueing failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const executeProposal = async (proposal) => {
    try {
      setLoading(true);
      const descriptionHash = ethers.keccak256(
        ethers.toUtf8Bytes(proposal.description)
      );
      const tx = await governor.execute(
        [crowdFund.target],
        [0],
        [proposal.calldata],
        descriptionHash
      );
      await tx.wait();
      toast.success(`Proposal #${proposal.id} executed!`);
      fetchProposalState(proposal.id);
      await fetchProjects();
    } catch (error) {
      toast.error("Execution failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mx-[8%] border border-gray-200">
      <div className="flex justify-between items-center mb-4 border-b border-gray-400 pb-3">
        <h2 className="text-lg font-semibold text-purple-600">All Proposals</h2>
        <Link to="/governance/addproposal">
          <button className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
            + New Proposal
          </button>
        </Link>
      </div>

      {/* Voting Section */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg space-y-3">
        <h3 className="text-md font-semibold text-gray-700">Voting Controls</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            className="col-span-2 p-2 border rounded-md bg-white text-black"
            onChange={(e) => setSelectedProposalId(e.target.value)}
            value={selectedProposalId}
          >
            <option value="">Select Proposal</option>
            {activeProposals
              .filter((p) => p.state === "Active")
              .map((proposal) => (
                <option
                  key={proposal.id.toString()}
                  value={proposal.id.toString()} // Explicit string conversion
                >
                  #{proposal.id.toString()} -{" "}
                  {proposal.description?.slice(0, 40)}...
                </option>
              ))}
          </select>
          <select
            className="p-2 border rounded-md bg-white text-black"
            value={voteOption}
            onChange={(e) => setVoteOption(e.target.value)}
          >
            <option value="1">For</option>
            <option value="0">Against</option>
            <option value="2">Abstain</option>
          </select>

          <button
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-400"
            onClick={handleVote}
            disabled={!selectedProposalId || loading}
          >
            {loading ? "Submitting..." : "Cast Vote"}
          </button>
        </div>
        <input
          className="w-full p-2 border rounded-md mt-2 text-black"
          placeholder="Enter voting reason..."
          value={voteReason}
          onChange={(e) => setVoteReason(e.target.value)}
        />
      </div>

      {/* Proposals Table */}
      <div className="rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Proposal
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activeProposals.length > 0 ? (
              activeProposals.map((proposal) => (
                <tr key={proposal.id.toString()}>
                  <td className="px-4 py-4 max-w-[300px]">
                    <div className="text-sm font-medium text-gray-900">
                      Proposal #{proposal.id.toString()}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {proposal.description}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span
                      className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${
                        proposal.state === "Active"
                          ? "bg-blue-100 text-blue-800"
                          : proposal.state === "Succeeded"
                          ? "bg-green-100 text-green-800"
                          : proposal.state === "Queued"
                          ? "bg-yellow-100 text-yellow-800"
                          : proposal.state === "Executed"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {proposal.state}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right space-x-2">
                    {proposal.state === "Succeeded" && (
                      <button
                        className="text-yellow-700 bg-yellow-100 px-3 py-1 rounded-md hover:bg-yellow-200"
                        onClick={() => queueProposal(proposal)}
                        disabled={loading}
                      >
                        Queue
                      </button>
                    )}
                    {proposal.state === "Queued" && (
                      <button
                        className="text-purple-700 bg-purple-100 px-3 py-1 rounded-md hover:bg-purple-200"
                        onClick={() => executeProposal(proposal)}
                        disabled={loading}
                      >
                        Execute
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="px-4 py-6 text-center text-gray-500">
                  No active proposals found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GovernanceTable;
