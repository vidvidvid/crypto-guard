import React from "react";
import { Container, VStack, Heading } from "@chakra-ui/react";
import { useWeb3AuthContext } from "./contexts/Web3AuthContext";

import Loader from "./components/Loader";
import LoginButton from "./components/LoginButton";
import MainContent from "./components/MainContent";
import { SiteRatingsProvider } from "./contexts/SiteRatingsContext";

function App() {
  const { loggedIn, isInitialized } = useWeb3AuthContext();

  if (!isInitialized) {
    return <Loader />;
  }

  return (
    <Container maxW='container.sm' py={4}>
      <VStack spacing={4} align='stretch'>
        <Heading as='h1' size='xl' textAlign='center'>
          CryptoGuard
        </Heading>
        {loggedIn ? (
          <SiteRatingsProvider>
            <MainContent />
          </SiteRatingsProvider>
        ) : (
          <LoginButton />
        )}
      </VStack>
    </Container>
  );
}

export default App;
