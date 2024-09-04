import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import { Web3AuthProvider } from "./contexts/Web3AuthContext";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider>
      <Web3AuthProvider>
        <App />
      </Web3AuthProvider>
    </ChakraProvider>
  </React.StrictMode>
);
