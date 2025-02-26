import React, { useState } from "react";
// import { Button } from "../../components/ui/moving-border";
// import { Magnetic } from "../../components/ui/magnetic-button";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";

const AddProposal = ({ governor,crowdFund,signer,activeProposals,setActiveProposals,projects,setProjects,}) => {
  const [loading, setLoading] = useState(false);
  const [voteOption, setVoteOption] = useState("1");
  const [voteReason, setVoteReason] = useState("");
  const [proposalId, setProposalId] = useState(null);
  const [projectData, setProjectData] = useState({
    pid: "",
    goal: "",
    duration: "",
  });
  const navigate = useNavigate();
  const handleInputChange = (e) => {
    setProjectData({ ...projectData, [e.target.name]: e.target.value });
  };
  // Update the proposeProject function
  const proposeProject = async () => {
    if (!projectData.pid || !projectData.goal || !projectData.duration) {
      return toast.error("Please fill all fields");
    }

    try {
      setLoading(true);
      const calldata = crowdFund.interface.encodeFunctionData("createProject", [
        Number(projectData.pid),
        await signer.getAddress(),
        ethers.parseEther(projectData.goal),
        Number(projectData.duration) * 86400,
      ]);

      const description = `Fund Project #${projectData.pid}: ${projectData.goal} ETH Target`;
      const tx = await governor.propose(
        [crowdFund.target],
        [0],
        [calldata],
        description
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (l) => l.fragment.name === "ProposalCreated"
      );

      if (event) {
        const newProposalId = event.args.proposalId;
        setActiveProposals((prev) => [
          ...prev,
          {
            id: newProposalId,
            state: "Pending",
            description,
            calldata, // Store calldata with proposal
          },
        ]);
        // fetchProposalState(newProposalId, true);
        toast.success(`Proposal ${newProposalId} created!`);
        navigate("/governance/proposals");
      }
    } catch (error) {
      toast.error("Proposal failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-[10%] mt-[3%]">
      <div className="flex items-center justify-center gap-[5%]">
        <div className="w-[40%] space-y-3">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Propose Project
          </h2>
          <input
            name="pid"
            placeholder="Project ID"
            onChange={handleInputChange}
            className="w-full text-gray-800 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            name="goal"
            placeholder="Goal (ETH)"
            step="0.01"
            onChange={handleInputChange}
            className="w-full text-gray-800 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            name="duration"
            placeholder="Duration (Days)"
            onChange={handleInputChange}
            className="w-full text-gray-800 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <button
            className="w-full bg-blue-500 text-white font-medium py-2 rounded-md hover:bg-blue-600 transition"
            onClick={proposeProject}
            disabled={loading}
          >
            {loading ? "Creating..." : "Submit Proposal"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProposal;
