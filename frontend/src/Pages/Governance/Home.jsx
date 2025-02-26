import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { contracts } from "../../config/contractData";
import ProjectCard from "../../Pages/Governance/ProjectCard";
import { toast } from "react-toastify";

const Home = ({ signer, projects = [], fetchProjects }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setupEventListener = async () => {
      if (!signer) return;

      try {
        const crowdFund = new ethers.Contract(
          contracts.crowdFund.address,
          contracts.crowdFund.abi,
          signer
        );

        // Load initial projects
        await fetchProjects();
        setLoading(false);

        // Add real-time listener for new projects
        const handler = () => {
          fetchProjects();
          toast.info("New project detected! Updating list...");
        };

        crowdFund.on("ProjectCreated", handler);

        // Cleanup
        return () => {
          crowdFund.off("ProjectCreated", handler);
        };
      } catch (error) {
        console.error("Initialization error:", error);
        setLoading(false);
      }
    };

    setupEventListener();
  }, [signer, fetchProjects]);

  return (
    <div className="text-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-green-700">Active Projects</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="text-center p-4 text-red-500">Loading projects...</div>
        ) : projects.length > 0 ? (
          projects.map((project) => (
            <ProjectCard key={project.id} project={project} signer={signer} />
          ))
        ) : (
          <div className="text-center p-4">No active projects found</div>
        )}
      </div>
    </div>
  );
};

export default Home;
