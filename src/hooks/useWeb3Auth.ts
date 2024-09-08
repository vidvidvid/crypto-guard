import { useState, useEffect } from "react";
import { Web3Auth } from "@web3auth/modal";
import {
  CHAIN_NAMESPACES,
  IProvider,
  WEB3AUTH_NETWORK,
  UserInfo,
} from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";

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
  const [ethAddress, setEthAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    if (isLoading || loggedIn) return;

    setIsLoading(true);
    try {
      const web3authProvider = await web3auth.connect();
      if (web3authProvider) {
        await handleLoginSuccess(web3auth, web3authProvider);
      }
    } catch (error) {
      console.error("Automatic login failed:", error);
      // Don't set an error state here, as this is an automatic attempt
    } finally {
      setIsLoading(false);
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

    setLoggedIn(true);
    setError(null);

    // Any additional actions after successful login can be added here
  };

  const login = async () => {
    if (!web3auth || isLoading || loggedIn) {
      return;
    }
    setIsLoading(true);
    try {
      const web3authProvider = await web3auth.connect();
      if (web3authProvider) {
        await handleLoginSuccess(web3auth, web3authProvider);
      }
    } catch (error) {
      console.error("Error logging in:", error);
      setError("Failed to login: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!web3auth || isLoading) {
      return;
    }
    setIsLoading(true);
    try {
      await web3auth.logout();
      setProvider(null);
      setLoggedIn(false);
      setUserData(null);
      setEthAddress(null);
      setError(null);
    } catch (error) {
      console.error("Error logging out:", error);
      setError("Failed to logout: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
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
    isLoading,
  };
}
