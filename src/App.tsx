import "./App.css";
import { useEffect, useState } from "react";
import { Web3Auth } from "@web3auth/modal";
import {
  CHAIN_NAMESPACES,
  IProvider,
  WEB3AUTH_NETWORK,
  UserInfo,
} from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import {
  getFlaggedSites,
  flagSite,
  unflagSite,
  createOrUpdateUser,
  getFlagCount,
} from "./supabaseClient";

const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID || "";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xaa36a7",
  rpcTarget: import.meta.env.VITE_RPC_TARGET,
  displayName: "Ethereum Sepolia Testnet",
  blockExplorerUrl: "https://sepolia.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

function App() {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserInfo | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [flaggedSites, setFlaggedSites] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [flagCount, setFlagCount] = useState<number>(0);

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

        if (web3auth.provider) {
          setProvider(web3auth.provider);
          const user = await web3auth.getUserInfo();
          setUserData(user as UserInfo);
          await createOrUpdateUser(user.email as string, user.email as string);
          setLoggedIn(true);
        }
      } catch (error) {
        console.error("Error during Web3Auth initialization:", error);
        setError("Failed to initialize Web3Auth");
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
          setCurrentUrl(tabs[0].url);
          setIsValidUrl(isValidFlagUrl(tabs[0].url));
        }
      });
    }

    loadFlaggedSites();
  }, []);

  const isValidFlagUrl = (url: string) => {
    return url.startsWith("http://") || url.startsWith("https://");
  };

  const loadFlaggedSites = async () => {
    try {
      const sites = await getFlaggedSites();
      setFlaggedSites(sites);
    } catch (error) {
      console.error("Error loading flagged sites:", error);
      setError("Failed to load flagged sites");
    }
  };

  const login = async () => {
    if (!web3auth) {
      setError("Web3Auth not initialized yet");
      return;
    }
    try {
      const web3authProvider = await web3auth.connect();
      setProvider(web3authProvider);
      const user = await web3auth.getUserInfo();
      setUserData(user as UserInfo);

      if (!user.email) {
        throw new Error("User email not available");
      }

      await createOrUpdateUser(user.email, user.email);
      setLoggedIn(true);
      setError(null);
    } catch (error) {
      console.error("Login error:", error);
      setError("Failed to login: " + (error as Error).message);
    }
  };

  const logout = async () => {
    if (!web3auth) {
      setError("Web3Auth not initialized yet");
      return;
    }
    try {
      await web3auth.logout();
      setProvider(null);
      setLoggedIn(false);
      setUserData(null);
      setError(null);
    } catch (error) {
      console.error("Logout error:", error);
      setError("Failed to logout");
    }
  };

  const handleFlagSite = async () => {
    setError(null);
    setMessage(null);

    if (!userData?.email || !currentUrl || !isValidUrl) {
      setError("Cannot flag site: missing data or invalid URL");
      return;
    }

    try {
      await flagSite(currentUrl, userData.email);
      const newCount = await getFlagCount(currentUrl);
      setFlagCount(newCount);
      setMessage(`Site flagged successfully! Total flags: ${newCount}`);
      await loadFlaggedSites();
    } catch (error) {
      console.error("Error flagging site:", error);
      setError("Failed to flag site: " + (error as Error).message);
    }
  };

  const handleUnflagSite = async () => {
    setError(null);
    setMessage(null);

    if (!userData?.email || !currentUrl || !isValidUrl) {
      setError("Cannot unflag site: missing data or invalid URL");
      return;
    }

    try {
      await unflagSite(currentUrl, userData.email);
      const newCount = await getFlagCount(currentUrl);
      setFlagCount(newCount);
      setMessage(`Site unflagged successfully! Total flags: ${newCount}`);
      await loadFlaggedSites();
    } catch (error) {
      console.error("Error unflagging site:", error);
      setError("Failed to unflag site: " + (error as Error).message);
    }
  };

  return (
    <div className='App'>
      <h1>Crypto Scam Tracker</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}
      {loggedIn ? (
        <>
          <p>Logged in as: {userData?.email}</p>
          <p>Current URL: {currentUrl}</p>
          <p>Flag Count: {flagCount}</p>
          {isValidUrl ? (
            <>
              <button onClick={handleFlagSite}>Flag Current Site</button>
              <button onClick={handleUnflagSite}>Unflag Current Site</button>
            </>
          ) : (
            <p>Cannot flag this type of URL</p>
          )}
          <button onClick={logout}>Logout</button>
          <h2>Flagged Sites:</h2>
          <ul>
            {flaggedSites.map((site, index) => (
              <li key={index}>
                {site.url} (flagged by: {site.flagged_by})
              </li>
            ))}
          </ul>
        </>
      ) : (
        <button onClick={login}>Login</button>
      )}
    </div>
  );
}

export default App;
