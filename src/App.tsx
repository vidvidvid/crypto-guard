import { Box, VStack, Flex } from "@chakra-ui/react";
import { useWeb3AuthContext } from "./contexts/Web3AuthContext";
import { SiteRatingsProvider } from "./contexts/SiteRatingsContext";
import Loader from "./components/Loader";
import LoginButton from "./components/LoginButton";
import Header from "./components/Header";
import RatingSummary from "./components/RatingSummary";
import CommentsSection from "./components/CommentsSection";

function App() {
  const { loggedIn, isInitialized, userData } = useWeb3AuthContext();

  if (!isInitialized) {
    return <Loader />;
  }

  return (
    <Box>
      {loggedIn ? (
        <SiteRatingsProvider>
          <VStack height='100%' spacing={0}>
            <Header />
            <RatingSummary />
            <Box flex={1} width='100%' overflowY='auto' p={4}>
              <CommentsSection />
            </Box>
          </VStack>
        </SiteRatingsProvider>
      ) : (
        <Flex height='100%' alignItems='center' justifyContent='center'>
          <LoginButton />
        </Flex>
      )}
    </Box>
  );
}

export default App;
