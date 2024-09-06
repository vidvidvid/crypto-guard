import React, { createContext, useContext, ReactNode } from "react";
import { useWeb3Auth } from "../hooks/useWeb3Auth";

interface Web3AuthContextType {
  loggedIn: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  ethAddress: string | null;
  userData: any; // Replace 'any' with a more specific type if possible
  provider: any; // Replace 'any' with a more specific type if possible
  web3auth: any; // Replace 'any' with a more specific type if possible
  error: string | null;
}

const Web3AuthContext = createContext<Web3AuthContextType | undefined>(
  undefined
);

export const Web3AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const web3AuthValues = useWeb3Auth();

  return (
    <Web3AuthContext.Provider value={web3AuthValues}>
      {children}
    </Web3AuthContext.Provider>
  );
};

export const useWeb3AuthContext = () => {
  const context = useContext(Web3AuthContext);
  if (context === undefined) {
    throw new Error(
      "useWeb3AuthContext must be used within a Web3AuthProvider"
    );
  }
  return context;
};
