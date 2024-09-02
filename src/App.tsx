import React from "react";
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
} from "@chakra-ui/react";
import Loader from "./components/Loader";
import { useWeb3Auth } from "./hooks/useWeb3Auth";
import { useSiteRatings } from "./hooks/useSiteRatings";
import { SiteRatingButtons } from "./components/SiteRatingButtons";
import { FlaggedSitesList } from "./components/FlaggedSitesList";
import { createOrUpdateUser, rateSite } from "./supabaseClient";

function App() {
  const {
    loggedIn,
    userData,
    ethAddress,
    error,
    login,
    logout,
    isInitialized,
  } = useWeb3Auth();

  const {
    currentUrl,
    flaggedSites,
    isValidUrl,
    siteRatings,
    userRating,
    setUserRating,
    loadFlaggedSites,
    loadSiteRatings,
  } = useSiteRatings(ethAddress);

  const toast = useToast();

  const handleRateSite = async (isSafe: boolean) => {
    if (!ethAddress || !currentUrl || !isValidUrl || !userData?.email) {
      toast({
        title: "Error",
        description: "Cannot rate site: missing data or invalid URL",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Ensure the user exists in the database
      await createOrUpdateUser(ethAddress, userData.email);

      // Rate the site
      const updatedRating = await rateSite(
        currentUrl,
        ethAddress.toLocaleLowerCase(),
        isSafe
      );
      setUserRating(updatedRating.is_safe);

      toast({
        title: "Success",
        description: `Site rated as ${
          isSafe ? "safe" : "unsafe"
        } successfully!`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      await loadFlaggedSites();
      await loadSiteRatings(currentUrl);
    } catch (error) {
      console.error("Error rating site:", error);
      toast({
        title: "Error",
        description: "Failed to rate site: " + (error as Error).message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (!isInitialized) {
    return <Loader />;
  }

  return (
    <Container maxW='container.sm' py={4}>
      <VStack spacing={4} align='stretch'>
        <Heading as='h1' size='xl' textAlign='center'>
          Crypto Scam Tracker
        </Heading>
        {error && <Text color='red.500'>{error}</Text>}
        {loggedIn ? (
          <>
            <Text>Logged in as: {userData?.email || ethAddress}</Text>
            <Text>Current URL: {currentUrl}</Text>
            {isValidUrl ? (
              <SiteRatingButtons
                userRating={userRating}
                handleRateSite={handleRateSite}
              />
            ) : (
              <Text>Cannot rate this type of URL</Text>
            )}
            {siteRatings && (
              <StatGroup>
                <Stat>
                  <StatLabel>Safe Ratings</StatLabel>
                  <StatNumber>{siteRatings.safeCount}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Unsafe Ratings</StatLabel>
                  <StatNumber>{siteRatings.unsafeCount}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Total Ratings</StatLabel>
                  <StatNumber>{siteRatings.totalRatings}</StatNumber>
                </Stat>
              </StatGroup>
            )}
            <Button onClick={logout}>Logout</Button>
            <FlaggedSitesList flaggedSites={flaggedSites} />
          </>
        ) : (
          <Button colorScheme='blue' onClick={login}>
            Login
          </Button>
        )}
      </VStack>
    </Container>
  );
}

export default App;
