import React, { useEffect, useState } from "react";
import { contracts } from "../config/contractData";
import MovingProposals from "@/Component/MovingProposals";

const Home = () => {

  return (
    <div>
      <div className="mt-[8%] text-center text-5xl font-bold text-white">
        <h1>
          <span className="text-[#9669ED] mr-2">$1,007,298,268</span>of
          borrowing backed by
        </h1>
        <h1 className="mt-[1%]">
          <span className="text-[#00D395] mr-2">$2580,017,760</span>of
          collateral across <span className="text-[#00D395] mr-1">17</span>{" "}
          markets
        </h1>
        <div className="mt-[8%] mx-[5%]">
          <MovingProposals />
        </div>
      </div>
    </div>
  );
};

export default Home;
