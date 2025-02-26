// App.jsx
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { contracts } from "./config/contractData";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import ExecutedProposals from "./components/ExecutedProposals";

const App = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [crowdFund, setCrowdFund] = useState(null);
  const [governor, setGovernor] = useState(null);
  const [token, setToken] = useState(null);
  const [projects, setProjects] = useState([]);
  const [proposalId, setProposalId] = useState(null);
  const [activeProposals, setActiveProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [executedProposals, setExecutedProposals] = useState([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);
  const [projectData, setProjectData] = useState({
    pid: "",
    goal: "",
    duration: "",
  });
  const [voteOption, setVoteOption] = useState("1");
  const [voteReason, setVoteReason] = useState("");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [votingPower, setVotingPower] = useState("0");

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

          setupEventListeners(crowdFundContract);
          fetchProjects();
          fetchTokenInfo();
        } catch (error) {
          toast.error("Error connecting: " + error.message);
        }
      } else {
        toast.error("Please install MetaMask!");
      }
    };
    init();
    // Cleanup event listeners on unmount
    return () => {
      if (crowdFund) {
        events.forEach((eventName) => {
          crowdFund.off(crowdFund.filters[eventName](), () => {});
        });
      }
    };
  }, []);

  // Add governor event listener
  useEffect(() => {
    if (!governor) return;

    const handleProposalExecuted = (proposalId) => {
      setActiveProposals((prev) =>
        prev.filter((p) => p.id.toString() !== proposalId.toString())
      );
      fetchProjects();
    };

    governor.on(governor.filters.ProposalExecuted(), handleProposalExecuted);

    return () => {
      governor.off(governor.filters.ProposalExecuted(), handleProposalExecuted);
    };
  }, [governor]);

  const setupEventListeners = (crowdFund) => {
    if (!crowdFund) return;

    const events = ["ProjectCreated", "Contributed", "Withdrawn", "Refunded"];

    const listener = () => {
      fetchProjects();
      fetchTokenInfo();
    };

    events.forEach((eventName) => {
      crowdFund.on(crowdFund.filters[eventName](), listener);
    });

    return () => {
      events.forEach((eventName) => {
        crowdFund.off(crowdFund.filters[eventName](), listener);
      });
    };
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

  const fetchProjects = async () => {
    if (!crowdFund) return;
    try {
      setIsProjectsLoading(true);
      const count = await crowdFund.projectCount();
      const projectPromises = [];

      for (let i = 1; i <= count; i++) {
        projectPromises.push(crowdFund.projects(i).catch(() => null));
      }

      const projectResults = await Promise.all(projectPromises);
      const validProjects = projectResults
        .map((project, index) =>
          project?.goal > 0
            ? {
                id: index + 1,
                owner: project.owner,
                goal: ethers.formatEther(project.goal),
                raised: ethers.formatEther(project.raised),
                deadline: new Date(Number(project.deadline) * 1000),
                completed: project.completed,
                approved: project.approved,
              }
            : null
        )
        .filter(Boolean);

      setProjects(validProjects);
    } catch (error) {
      toast.error("Error fetching projects: " + error.message);
    } finally {
      setIsProjectsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setProjectData({ ...projectData, [e.target.name]: e.target.value });
  };

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
        setProposalId(newProposalId);
        setActiveProposals((prev) => [
          ...prev,
          {
            id: newProposalId,
            state: "Pending",
            description: description,
          },
        ]);
        fetchProposalState(newProposalId, true);
        toast.success(`Proposal ${newProposalId} created!`);
      }
    } catch (error) {
      toast.error("Proposal failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProposalState = async (id, autoRefresh = false) => {
    try {
      const state = await governor.state(id);
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
      const currentState = states[state];

      setActiveProposals((prev) =>
        prev.map((proposal) =>
          proposal.id === id ? { ...proposal, state: currentState } : proposal
        )
      );

      if (
        autoRefresh &&
        ["Pending", "Active", "Succeeded", "Queued"].includes(currentState)
      ) {
        setTimeout(() => fetchProposalState(id, true), 3000);
      }
    } catch (error) {
      console.error("Proposal state error:", error);
    }
  };

  const handleVote = async () => {
    try {
      setLoading(true);
      const tx = await governor.castVoteWithReason(
        proposalId,
        voteOption,
        voteReason
      );
      await tx.wait();
      toast.success("Vote submitted!");
      fetchProposalState(proposalId);
    } catch (error) {
      toast.error("Voting failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const queueProposal = async () => {
    try {
      setLoading(true);
      const descriptionHash = ethers.keccak256(
        ethers.toUtf8Bytes(
          `Fund Project #${projectData.pid}: ${projectData.goal} ETH Target`
        )
      );
      const tx = await governor.queue(
        [crowdFund.target],
        [0],
        [
          crowdFund.interface.encodeFunctionData("createProject", [
            Number(projectData.pid),
            await signer.getAddress(),
            ethers.parseEther(projectData.goal),
            Number(projectData.duration) * 86400,
          ]),
        ],
        descriptionHash
      );
      await tx.wait();
      toast.success("Proposal queued!");
      fetchProposalState(proposalId);
    } catch (error) {
      toast.error("Queue failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

const executeProposal = async () => {
  try {
    setLoading(true);
    const descriptionHash = ethers.keccak256(
      ethers.toUtf8Bytes(
        `Fund Project #${projectData.pid}: ${projectData.goal} ETH Target`
      )
    );

    const tx = await governor.execute(
      [crowdFund.target],
      [0],
      [
        crowdFund.interface.encodeFunctionData("createProject", [
          Number(projectData.pid),
          await signer.getAddress(),
          ethers.parseEther(projectData.goal),
          Number(projectData.duration) * 86400,
        ]),
      ],
      descriptionHash
    );

    const receipt = await tx.wait();

    // Store execution details
    const executedProposal = {
      id: proposalId,
      description: `Fund Project #${projectData.pid}: ${projectData.goal} ETH Target`,
      executionHash: receipt.hash,
      executionTime: new Date().toISOString(),
      projectId: projectData.pid,
    };

    setExecutedProposals((prev) => [...prev, executedProposal]);

    // Verify project creation
    let retries = 0;
    const maxRetries = 5;
    const checkProject = async () => {
      await fetchProjects();
      const project = projects.find((p) => p.id === Number(projectData.pid));

      if (project) {
        toast.success("Project deployed successfully!");
        return;
      }

      if (retries < maxRetries) {
        retries++;
        setTimeout(checkProject, 2000); // Retry every 2 seconds
      } else {
        toast.error("Project deployment verification failed.");
      }
    };

    await checkProject();
  } catch (error) {
    toast.error("Execution failed: " + error.message);
  } finally {
    setLoading(false);
  }
};
  
  // Add project status badge component
  const ProjectStatusBadge = ({ project }) => {
    if (!project.approved)
      return <span className="badge bg-warning">Pending Approval</span>;
    if (project.completed)
      return <span className="badge bg-success">Completed</span>;
    if (Date.now() > project.deadline)
      return <span className="badge bg-danger">Expired</span>;
    return <span className="badge bg-primary">Active</span>;
  };

  // Add proposal cleanup effect
  useEffect(() => {
    const interval = setInterval(async () => {
      const updatedProposals = await Promise.all(
        activeProposals.map(async (proposal) => {
          try {
            const state = await governor.state(proposal.id);
            return { ...proposal, state: states[state] };
          } catch {
            return null;
          }
        })
      );
      setActiveProposals(updatedProposals.filter((p) => p !== null));
    }, 10000);

    return () => clearInterval(interval);
  }, [activeProposals, governor]);

  const handleContribute = async (projectId, amount) => {
    try {
      const tx = await crowdFund.contribute(projectId, {
        value: ethers.parseEther(amount.toString()),
      });
      await tx.wait();
      toast.success("Contribution successful!");
      fetchProjects();
    } catch (error) {
      toast.error("Contribution failed: " + error.message);
    }
  };

  const handleWithdraw = async (projectId) => {
    try {
      const tx = await crowdFund.withdraw(projectId);
      await tx.wait();
      toast.success("Funds withdrawn!");
      fetchProjects();
    } catch (error) {
      toast.error("Withdrawal failed: " + error.message);
    }
  };

  const handleRefund = async (projectId) => {
    try {
      const tx = await crowdFund.claimRefund(projectId);
      await tx.wait();
      toast.success("Refund processed!");
      fetchProjects();
    } catch (error) {
      toast.error("Refund failed: " + error.message);
    }
  };

  const getStateBadge = (state) => {
    switch (state) {
      case "Active":
        return "bg-primary";
      case "Succeeded":
        return "bg-success";
      case "Queued":
        return "bg-warning text-dark";
      case "Executed":
        return "bg-success";
      default:
        return "bg-secondary";
    }
  };

  return (
    <div className="container mt-4">
      <ToastContainer />
      <h1 className="text-center mb-4">DAO Crowdfunding Platform</h1>

      <div className="row">
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-body">
              <h3>Propose Project</h3>
              <input
                name="pid"
                className="form-control mb-2"
                placeholder="Project ID"
                onChange={handleInputChange}
              />
              <input
                name="goal"
                className="form-control mb-2"
                placeholder="Goal (ETH)"
                step="0.01"
                onChange={handleInputChange}
              />
              <input
                name="duration"
                className="form-control mb-2"
                placeholder="Duration (Days)"
                onChange={handleInputChange}
              />
              <button
                className="btn btn-primary w-100"
                onClick={proposeProject}
                disabled={loading}
              >
                {loading ? "Creating..." : "Submit Proposal"}
              </button>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-body">
              <h4>Voting Management</h4>
              <div className="mb-3">
                <select
                  className="form-select"
                  value={voteOption}
                  onChange={(e) => setVoteOption(e.target.value)}
                >
                  <option value="1">For</option>
                  <option value="0">Against</option>
                  <option value="2">Abstain</option>
                </select>
              </div>
              <input
                className="form-control mb-2"
                placeholder="Voting Reason"
                value={voteReason}
                onChange={(e) => setVoteReason(e.target.value)}
              />
              <div className="d-grid gap-2">
                <button
                  className="btn btn-success"
                  onClick={handleVote}
                  disabled={!proposalId || loading}
                >
                  {loading ? "Voting..." : "Cast Vote"}
                </button>
                <button
                  className="btn btn-warning"
                  onClick={queueProposal}
                  disabled={!proposalId || loading}
                >
                  {loading ? "Queueing..." : "Queue Proposal"}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={executeProposal}
                  disabled={!proposalId || loading}
                >
                  {loading ? "Executing..." : "Execute Proposal"}
                </button>
              </div>

              <div className="mt-4">
                <h5>Active Proposals</h5>
                {activeProposals.length === 0 ? (
                  <p>No active proposals</p>
                ) : (
                  activeProposals.map((proposal) => (
                    <div
                      key={proposal.id.toString()}
                      className="mb-2 p-2 border rounded"
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <small className="text-muted">
                            Proposal #{proposal.id.toString()}
                          </small>
                          <div className="fw-bold">{proposal.description}</div>
                        </div>
                        <span
                          className={`badge ${getStateBadge(proposal.state)}`}
                        >
                          {proposal.state}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <ExecutedProposals
            executedProposals={executedProposals}
            projects={projects}
          />
          <div className="card">
            <div className="card-body">
              <h4>Token Management</h4>
              <p>Balance: {tokenBalance} GT</p>
              <p>Voting Power: {votingPower} GT</p>
              <button
                className="btn btn-secondary mb-2"
                onClick={async () => {
                  try {
                    await token.faucet();
                    fetchTokenInfo();
                  } catch (error) {
                    toast.error("Faucet error: " + error.message);
                  }
                }}
              >
                Get Test Tokens
              </button>
              <button
                className="btn btn-info"
                onClick={async () => {
                  try {
                    await token.delegate(await signer.getAddress());
                    fetchTokenInfo();
                  } catch (error) {
                    toast.error("Delegation error: " + error.message);
                  }
                }}
              >
                Delegate Votes
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h3>Active Projects</h3>
              {projects.length === 0 ? (
                <p>
                  {isProjectsLoading
                    ? "Loading projects..."
                    : "No active projects"}
                </p>
              ) : (
                projects.map((project) => (
                  <div key={project.id} className="mb-3 p-3 border rounded">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h5>Project #{project.id}</h5>
                        <ProjectStatusBadge project={project} />
                      </div>
                      <small className="text-muted">
                        {project.approved
                          ? `By ${project.owner.slice(
                              0,
                              6
                            )}...${project.owner.slice(-4)}`
                          : "Pending DAO approval"}
                      </small>{" "}
                    </div>
                    <p>Goal: {project.goal} ETH</p>
                    <p>Raised: {project.raised} ETH</p>
                    <p>Deadline: {project.deadline.toLocaleDateString()}</p>
                    {!project.completed ? (
                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control"
                          placeholder="ETH amount"
                          min="0.01"
                          step="0.01"
                          id={`contribute-${project.id}`}
                        />
                        <button
                          className="btn btn-success"
                          onClick={() =>
                            handleContribute(
                              project.id,
                              document.getElementById(
                                `contribute-${project.id}`
                              ).value
                            )
                          }
                        >
                          Fund
                        </button>
                      </div>
                    ) : (
                      <div className="d-grid gap-2">
                        {project.raised >= project.goal ? (
                          <button
                            className="btn btn-primary"
                            onClick={() => handleWithdraw(project.id)}
                          >
                            Withdraw Funds
                          </button>
                        ) : (
                          <button
                            className="btn btn-warning"
                            onClick={() => handleRefund(project.id)}
                          >
                            Claim Refund
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
