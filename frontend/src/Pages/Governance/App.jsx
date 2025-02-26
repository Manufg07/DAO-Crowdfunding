import { Routes, Route } from 'react-router-dom';
import GovernanceNavbar from '../../Component/Navbar2'
import Home from '../Governance/Home'
import Proposal from './Proposal';
import AddProposal from './AddProposal';
// import GovernanceTable from "./GovernanceTable";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { contracts } from "../../config/contractData";

const GovernanceApp = () => {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [crowdFund, setCrowdFund] = useState(null);
    const [governor, setGovernor] = useState(null);
    const [token, setToken] = useState(null);
    const [projects, setProjects] = useState([]);
    const [activeProposals, setActiveProposals] = useState([]);
    const [executedProposals, setExecutedProposals] = useState([]);
    const [tokenBalance, setTokenBalance] = useState("0");
    const [votingPower, setVotingPower] = useState("0");
    const [loading, setLoading] = useState(null);
  

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();

          setProvider(provider);
          setSigner(signer);

          const crowdFundContract = new ethers.Contract(
            contracts.crowdFund.address,
            contracts.crowdFund.abi,
            signer
          );
          const governorContract = new ethers.Contract(
            contracts.governor.address,
            contracts.governor.abi,
            signer
          );
          const tokenContract = new ethers.Contract(
            contracts.token.address,
            contracts.token.abi,
            signer
          );

          setCrowdFund(crowdFundContract);
          setGovernor(governorContract);
          setToken(tokenContract);
          fetchProjects();
          fetchTokenInfo();
        } catch (error) {
          console.error("Error connecting:", error);
        }
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!crowdFund) return;

    const handleProjectCreated = (pid, owner, goal, deadline) => {
      setProjects((prev) => [
        ...prev,
        {
          id: pid.toString(),
          owner,
          goal: ethers.formatEther(goal),
          raised: "0",
          deadline: new Date(Number(deadline) * 1000),
          completed: false,
          approved: true,
        },
      ]);
    };

    crowdFund.on("ProjectCreated", handleProjectCreated);
    return () => crowdFund.off("ProjectCreated", handleProjectCreated);
  }, [crowdFund]);

  const fetchProjects = async () => {
    if (!crowdFund) return;

    try {
      setLoading(true);
      const filter = crowdFund.filters.ProjectCreated();
      const events = await crowdFund.queryFilter(filter);

      const projectArray = await Promise.all(
        events.map(async (e) => {
          const project = await crowdFund.projects(e.args.pid);
          return {
            id: e.args.pid.toString(),
            owner: e.args.owner,
            goal: ethers.formatEther(e.args.goal),
            raised: ethers.formatEther(project.raised),
            deadline: new Date(Number(project.deadline) * 1000),
            completed: project.completed,
            approved: project.approved,
          };
        })
      );

      setProjects(projectArray);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

   const governanceState = {
     provider,
     signer,
     crowdFund,
     governor,
     token,
     projects,
     setProjects, // Expose setProjects
     fetchProjects, // Expose fetchProjects
   };

const fetchProposalState = async (id, autoRefresh = false) => {
  if (!governor || typeof id === "undefined") {
    console.error("Governor contract not initialized or invalid proposal ID:", id);
    return;
  }

  try {
    console.log(`Fetching state for proposal ID: ${id}`); // Debugging line
    const stateIndex = await governor.state(id);
    
    const states = ["Pending", "Active", "Canceled", "Defeated", "Succeeded", "Queued", "Expired", "Executed"];
    const currentState = states[stateIndex] || "Unknown";

    setActiveProposals((prev) =>
      prev.map((proposal) => 
        proposal.id === id ? { ...proposal, state: currentState } : proposal
      )
    );

    console.log(`Updated state for Proposal #${id}: ${currentState}`); // Debugging line

    if (autoRefresh && ["Pending", "Active", "Succeeded", "Queued"].includes(currentState)) {
      setTimeout(() => fetchProposalState(id, true), 3000);
    }
  } catch (error) {
    console.error("Error fetching proposal state:", error);
  }
};

  const fetchTokenInfo = async () => {
    if (!signer || !token) return;
    try {
      const address = await signer.getAddress();
      const balance = await token.balanceOf(address);
      const votes = await token.getVotes(address);
      setTokenBalance(ethers.formatEther(balance));
      setVotingPower(ethers.formatEther(votes));
    } catch (error) {
      console.error("Token info error:", error);
    }
  };


  return (
    <div className="w-screen h-screen">
      <GovernanceNavbar {...governanceState} />
      <div className="bg-gray-100 w-screen h-screen pt-[3%]">
        <Routes>
          <Route path="/" element={<Home {...governanceState} />} />
          <Route
            path="/proposals"
            element={
              <Proposal
                governor={governor}
                crowdFund={crowdFund}
                signer={signer}
                activeProposals={activeProposals}
                setActiveProposals={setActiveProposals}
                fetchProposalState={fetchProposalState}
                executedProposals={executedProposals}
                projects={projects}
                fetchProjects={fetchProjects}
              />
            }
          />
          <Route
            path="/addproposal"
            element={
              <AddProposal
                governor={governor}
                crowdFund={crowdFund}
                signer={signer}
                activeProposals={activeProposals}
                setActiveProposals={setActiveProposals}
                projects={projects}
                setProjects={setProjects}
              />
            }
          />
        </Routes>
      </div>
    </div>
  );
};

export default GovernanceApp;