import { useState } from "react";
import "./App.css";
import { useWeb3Auth } from "./hooks/useWeb3Auth";
import { useUrl } from "./hooks/useUrl";
import { useFlaggedSites } from "./hooks/useFlaggedSites";

function App() {
  const {
    loggedIn,
    userData,
    error: authError,
    login,
    logout,
    ethAddress,
    isInitialized,
  } = useWeb3Auth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  console.log("ethAddress", ethAddress);
  const { currentUrl, isValidUrl, flagCount, setFlagCount } = useUrl();
  const {
    error: flagError,
    message,
    handleFlagSite,
    handleUnflagSite,
  } = useFlaggedSites();

  const onFlagSite = async () => {
    if (ethAddress) {
      const newCount = await handleFlagSite(currentUrl, ethAddress);
      if (newCount !== null) setFlagCount(newCount);
    }
  };

  const onUnflagSite = async () => {
    if (ethAddress) {
      const newCount = await handleUnflagSite(currentUrl, ethAddress);
      if (newCount !== null) setFlagCount(newCount);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await login();
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!isInitialized) {
    return <div>Initializing Web3Auth...</div>;
  }

  return (
    <div className='App'>
      <h1>Crypto Scam Tracker</h1>
      {(authError || flagError) && (
        <p style={{ color: "red" }}>{authError || flagError}</p>
      )}
      {message && <p style={{ color: "green" }}>{message}</p>}
      {loggedIn ? (
        <>
          <p>Logged in as: {userData?.email || ethAddress}</p>
          <p>Ethereum Address: {ethAddress}</p>
          <p>Current URL: {currentUrl}</p>
          <p>Flag Count: {flagCount}</p>
          {isValidUrl ? (
            <>
              <button onClick={onFlagSite}>Flag Current Site</button>
              <button onClick={onUnflagSite}>Unflag Current Site</button>
            </>
          ) : (
            <p>Cannot flag this type of URL</p>
          )}
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={handleLogin} disabled={isLoggingIn}>
          {isLoggingIn ? "Logging in..." : "Login with Web3Auth"}
        </button>
      )}
    </div>
  );
}

export default App;
