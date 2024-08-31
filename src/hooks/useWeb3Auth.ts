import { useState, useEffect } from "react";
import { Web3Auth } from "@web3auth/modal";
import {
  CHAIN_NAMESPACES,
  IProvider,
  WEB3AUTH_NETWORK,
  UserInfo,
} from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { BrowserProvider, Signer } from "ethers";
import { createOrUpdateUser } from "../supabaseClient";

const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID || "";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xaa36a7", // Sepolia testnet
  rpcTarget: import.meta.env.VITE_RPC_TARGET,
  displayName: "Ethereum Sepolia Testnet",
  blockExplorerUrl: "https://sepolia.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
};

declare global {
  interface Window {
    ethereum?: any;
  }
}

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

export function useWeb3Auth() {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserInfo | null>(null);
  const [ethAddress, setEthAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const web3auth = new Web3Auth({
          clientId,
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
          chainConfig,
          privateKeyProvider,
        });

        setWeb3auth(web3auth);

        await web3auth.initModal();
        console.log("Web3Auth initialized");

        setIsInitialized(true);
      } catch (error) {
        console.error("Error during Web3Auth initialization:", error);
        setError("Failed to initialize Web3Auth");
      }
    };

    init();
    checkMetaMaskAvailability();
  }, []);

  const checkMetaMaskAvailability = async () => {
    // Method 1: Check for ethereum object
    if (typeof window.ethereum !== "undefined" && window.ethereum.isMetaMask) {
      setIsMetaMaskAvailable(true);
      return;
    }

    // Method 2: Try to use chrome.management API (may not work in all contexts)
    if (chrome.management) {
      try {
        const extensions = await chrome.management.getAll();
        console.log("extensions", extensions);
        const isMetaMaskInstalled = extensions.some(
          (ext) => ext.name === "MetaMask"
        );
        if (isMetaMaskInstalled) {
          setIsMetaMaskAvailable(true);
          return;
        }
      } catch (error) {
        console.error("Failed to check extensions:", error);
      }
    }

    // Method 3: Attempt to communicate with MetaMask
    try {
      await chrome.runtime.sendMessage("nkbihfbeogaeaoehlefnkodbefgpgknn", {
        method: "eth_requestAccounts",
      });
      setIsMetaMaskAvailable(true);
    } catch (error) {
      console.error("MetaMask communication failed:", error);
      setIsMetaMaskAvailable(false);
    }
  };

  const loginWithWeb3Auth = async () => {
    if (!web3auth || !isInitialized) {
      setError("Web3Auth not initialized yet. Please try again in a moment.");
      return;
    }
    try {
      const web3authProvider = await web3auth.connect();
      setProvider(web3authProvider);
      const user = await web3auth.getUserInfo();
      setUserData(user as UserInfo);
      const ethersProvider = new BrowserProvider(web3authProvider as any);
      const signer = await ethersProvider.getSigner();
      const address = await signer.getAddress();
      setEthAddress(address);
      await createOrUpdateUser(user.email || address, address);
      setLoggedIn(true);
      setError(null);
    } catch (error) {
      console.error("Web3Auth login error:", error);
      setError("Failed to login with Web3Auth: " + (error as Error).message);
    }
  };

  const loginWithMetamask = async () => {
    if (!isMetaMaskAvailable) {
      setError(
        "MetaMask is not available. Please install MetaMask and try again."
      );
      return;
    }

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setEthAddress(address);
      await createOrUpdateUser(address, address);
      setLoggedIn(true);
      setError(null);
    } catch (error) {
      console.error("MetaMask login error:", error);
      setError("Failed to login with MetaMask: " + (error as Error).message);
    }
  };

  const logout = async () => {
    if (web3auth) {
      await web3auth.logout();
    }
    setProvider(null);
    setLoggedIn(false);
    setUserData(null);
    setEthAddress(null);
    setError(null);
  };

  return {
    web3auth,
    provider,
    loggedIn,
    userData,
    ethAddress,
    error,
    loginWithWeb3Auth,
    loginWithMetamask,
    isInitialized,
    isMetaMaskAvailable,
    logout,
  };
}
