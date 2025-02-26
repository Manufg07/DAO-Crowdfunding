// components/ExecutionStatus.jsx
import React from 'react';

const ExecutedProposals = ({ executedProposals, projects }) => {
  return (
    <div className="card mb-4">
      <div className="card-body">
        <h5>Executed Proposals</h5>
        {executedProposals.length === 0 ? (
          <p>No executed proposals yet</p>
        ) : (
          executedProposals.map((proposal) => {
            const project = projects.find(
              (p) => p.id === Number(proposal.projectId)
            );

            return (
              <div key={proposal.id} className="mb-3 p-3 border rounded">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6>{proposal.description}</h6>
                    <p className="mb-0">
                      Status:{" "}
                      {project ? (
                        <span className="text-success">
                          Deployed Successfully
                        </span>
                      ) : (
                        <span className="text-warning">Pending Deployment</span>
                      )}
                    </p>
                    <small className="text-muted">
                      Executed at:{" "}
                      {new Date(proposal.executionTime).toLocaleString()}
                    </small>
                  </div>
                  <a
                    href={`https://etherscan.io/tx/${proposal.executionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-secondary"
                  >
                    View TX
                  </a>
                </div>
                {project && (
                  <div className="mt-2">
                    <p className="mb-1">Goal: {project.goal} ETH</p>
                    <p className="mb-1">Raised: {project.raised} ETH</p>
                    <p className="mb-1">
                      Deadline: {project.deadline.toLocaleDateString()}
                    </p>
                    <div className="progress" style={{ height: "5px" }}>
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{
                          width: `${(
                            (project.raised / project.goal) *
                            100
                          ).toFixed(2)}%`,
                          backgroundColor: project.completed
                            ? "#28a745"
                            : "#007bff",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ExecutedProposals;