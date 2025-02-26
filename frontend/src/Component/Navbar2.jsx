import React from "react";
import { Link } from "react-router-dom";

const GovernanceNavbar = () => {

  return (
    <nav className="w-full h-20 bg-white shadow-md text-black border-b border-gray-300">
      <div className="flex justify-between mx-[10%] py-5 items-center">
        <Link to="/" className="flex items-center">
          <button className="border-gray-200 rounded-md border p-1 text-md px-5 font-bold hover:border-gray-800 cursor-pointer">
            Dao
          </button>
        </Link>

        <div className="flex gap-[5%] items-center">
          <Link to="/governance/">
            <button className="px-3 text-sm font-semibold border border-gray-200 hover:border-gray-800 rounded-md p-1 transition-colors">
              Home
            </button>
          </Link>
          <Link to="/governance/proposals">
            <button className="px-3 text-sm font-semibold border border-gray-200 hover:border-gray-800 rounded-md p-1 transition-colors">
              Proposals
            </button>
          </Link>
          <button className="px-3 text-sm bg-gray-800 font-semibold border border-gray-200 hover:border-gray-800 rounded-md p-2 transition-colors text-white">
            Connect<span>wallet</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default GovernanceNavbar;
