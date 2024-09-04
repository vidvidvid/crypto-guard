import React from "react";
import { Container, VStack, Heading } from "@chakra-ui/react";
import { useWeb3Auth } from "./hooks/useWeb3Auth";
import Loader from "./components/Loader";
import LoginButton from "./components/LoginButton";
import MainContent from "./components/MainContent";

function App() {
  const { loggedIn, isInitialized } = useWeb3Auth();

  if (!isInitialized) {
    return <Loader />;
  }

  return (
    <Container maxW='container.sm' py={4}>
      <VStack spacing={4} align='stretch'>
        <Heading as='h1' size='xl' textAlign='center'>
          Crypto Scam Tracker
        </Heading>
        {loggedIn ? <MainContent /> : <LoginButton />}
      </VStack>
    </Container>
  );
}

export default App;
