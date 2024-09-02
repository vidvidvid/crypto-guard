import { useState, useEffect } from "react";
import { Web3Auth } from "@web3auth/modal";
import {
  CHAIN_NAMESPACES,
  IProvider,
  WEB3AUTH_NETWORK,
  UserInfo,
} from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { createOrUpdateUser, supabase } from "../supabaseClient";

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

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

export function useWeb3Auth() {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserInfo | null>(null);
  console.log("userData", userData);
  const [ethAddress, setEthAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

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

        // Attempt automatic login
        await attemptAutomaticLogin(web3auth);
      } catch (error) {
        console.error("Error during Web3Auth initialization:", error);
        setError("Failed to initialize Web3Auth");
      }
    };

    init();
  }, []);

  const attemptAutomaticLogin = async (web3auth: Web3Auth) => {
    try {
      const web3authProvider = await web3auth.connect();
      if (web3authProvider) {
        await handleLoginSuccess(web3auth, web3authProvider);
      }
    } catch (error) {
      console.error("Automatic login failed:", error);
      // Don't set an error state here, as this is an automatic attempt
    }
  };

  const handleLoginSuccess = async (
    web3auth: Web3Auth,
    web3authProvider: IProvider
  ) => {
    setProvider(web3authProvider);
    const user = await web3auth.getUserInfo();
    setUserData(user as UserInfo);
    const address = await web3authProvider.request({
      method: "eth_accounts",
    });
    const ethAddress = Array.isArray(address) ? address[0] : address;
    setEthAddress(ethAddress);

    try {
      // Create or update user in Supabase
      await createOrUpdateUser(ethAddress, user.email);
      setLoggedIn(true);
      setError(null);
    } catch (error) {
      console.error("Error creating/updating user:", error);
      setError("Failed to create/update user: " + (error as Error).message);
    }
  };

  const login = async () => {
    if (!web3auth) {
      setError("Web3Auth not initialized yet");
      return;
    }
    try {
      const web3authProvider = await web3auth.connect();
      if (web3authProvider) {
        await handleLoginSuccess(web3auth, web3authProvider);
      }
    } catch (error) {
      console.error("Error logging in:", error);
      setError("Failed to login: " + (error as Error).message);
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
    login,
    logout,
    isInitialized,
  };
}
