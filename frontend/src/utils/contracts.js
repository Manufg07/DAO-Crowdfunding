import { ethers } from "ethers";
import GovernorABI from "../abis/Governor.json";
import CrowdFundABI from "../abis/CrowdFund.json";
import GovTokenABI from "../abis/GovToken.json";
import TimeLockABI from "../abis/TimeLock.json";

// Environment variables
export const CONTRACT_ADDRESSES = {
  governor: import.meta.env.VITE_GOVERNOR_ADDRESS,
  crowdFund: import.meta.env.VITE_CROWDFUND_ADDRESS,
  govToken: import.meta.env.VITE_GOVTOKEN_ADDRESS,
  timelock: import.meta.env.VITE_TIMELOCK_ADDRESS,
};

// ABIs
export const CONTRACT_ABIS = {
  governor: GovernorABI.abi,
  crowdFund: CrowdFundABI.abi,
  govToken: GovTokenABI.abi,
  timelock: TimeLockABI.abi,
};

// Initialize contracts
export const initContracts = (provider) => {
  if (!provider) {
    throw new Error("Provider is required to initialize contracts");
  }

  return {
    governor: new ethers.Contract(
      CONTRACT_ADDRESSES.governor,
      CONTRACT_ABIS.governor,
      provider
    ),
    crowdFund: new ethers.Contract(
      CONTRACT_ADDRESSES.crowdFund,
      CONTRACT_ABIS.crowdFund,
      provider
    ),
    govToken: new ethers.Contract(
      CONTRACT_ADDRESSES.govToken,
      CONTRACT_ABIS.govToken,
      provider
    ),
    timelock: new ethers.Contract(
      CONTRACT_ADDRESSES.timelock,
      CONTRACT_ABIS.timelock,
      provider
    ),
  };
};
