import crowdFund from "../contract-data/CrowdFund.json";
import token from "../contract-data/GovToken.json";
import governor from "../contract-data/Governor.json";

export const contracts = {
  crowdFund: {
    address: "0x89217fe9A4d7b3cD147FCd59bf8d3f1D5B2fF08B",
    abi: crowdFund.abi,
  },
  token: {
    address: "0x5c2E3C79Be13e93a71b3776eCC4271e447a93c4f",
    abi: token.abi,
  },
  governor: {
    address: "0x55E472E8833BDdE9cAB00a5BF1d0750A9226E55f",
    abi: governor.abi,
  },
};
