import { useState, useEffect } from "react";
import { ethers } from "ethers";

export const useBlockchain = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        setProvider(provider);
        setSigner(signer);
      }
    };
    init();
  }, []);

  return { provider, signer };
};
