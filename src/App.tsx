/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
import "./App.css";

import { useEffect, useState } from "react";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";

const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID || "";

// IMP END - Dashboard Registration

// IMP START - Chain Config
const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xaa36a7",
  rpcTarget: import.meta.env.VITE_RPC_TARGET,
  // Avoid using public rpcTarget in production.
  // Use services like Infura, Quicknode etc
  displayName: "Ethereum Sepolia Testnet",
  blockExplorerUrl: "https://sepolia.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};
// IMP END - Chain Config

// IMP START - SDK Initialization
const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

const web3auth = new Web3Auth({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET, // Change this to match your dashboard
  privateKeyProvider,
});

function App() {
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await web3auth.initModal();
        setProvider(web3auth.provider);

        if (web3auth.connected) {
          setLoggedIn(true);
        }

        // Get the current tab's URL
        if (chrome.tabs) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url) {
              setCurrentUrl(tabs[0].url);
            }
          });
        }
      } catch (error) {
        console.error("Initialization error:", error);
        setError("Failed to initialize Web3Auth. Check console for details.");
      }
    };

    init();
  }, []);

  const login = async () => {
    try {
      const web3authProvider = await web3auth.connect();
      setProvider(web3authProvider);
      if (web3auth.connected) {
        setLoggedIn(true);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Failed to login. Check console for details.");
    }
  };

  const logout = async () => {
    try {
      await web3auth.logout();
      setProvider(null);
      setLoggedIn(false);
    } catch (error) {
      console.error("Logout error:", error);
      setError("Failed to logout. Check console for details.");
    }
  };

  const checkWebsite = async () => {
    if (currentUrl) {
      // Implement your website checking logic here
      console.log(`Checking website: ${currentUrl}`);
    }
  };

  const flagWebsite = async () => {
    if (currentUrl) {
      // Implement your website flagging logic here
      console.log(`Flagging website: ${currentUrl}`);
    }
  };

  return (
    <div className='App'>
      <h1>Crypto Scam Tracker</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {loggedIn ? (
        <>
          <p>Current URL: {currentUrl}</p>
          <button onClick={checkWebsite}>Check Website</button>
          <button onClick={flagWebsite}>Flag Website</button>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={login}>Login</button>
      )}
    </div>
  );
}

export default App;
