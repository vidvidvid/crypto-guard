import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  List,
  ListItem,
  useToast,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
} from "@chakra-ui/react";
import { CheckIcon, CloseIcon } from "@chakra-ui/icons";
import { useWeb3Auth } from "./hooks/useWeb3Auth";
import {
  getFlaggedSites,
  rateSite,
  getSiteRatings,
  getUserRating,
  createOrUpdateUser,
} from "./supabaseClient";
import Loader from "./components/Loader";

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
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [flaggedSites, setFlaggedSites] = useState<any[]>([]);
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [siteRatings, setSiteRatings] = useState<{
    safeCount: number;
    unsafeCount: number;
    totalRatings: number;
  } | null>(null);
  const [userRating, setUserRating] = useState<boolean | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
          setCurrentUrl(tabs[0].url);
          setIsValidUrl(isValidFlagUrl(tabs[0].url));
          loadSiteRatings(tabs[0].url);
          if (ethAddress) {
            loadUserRating(tabs[0].url, ethAddress);
          }
        }
      });
    }

    loadFlaggedSites();
  }, [ethAddress]);

  const isValidFlagUrl = (url: string) => {
    return url.startsWith("http://") || url.startsWith("https://");
  };

  const loadFlaggedSites = async () => {
    try {
      const sites = await getFlaggedSites();
      setFlaggedSites(sites);
    } catch (error) {
      console.error("Error loading flagged sites:", error);
      toast({
        title: "Error",
        description: "Failed to load flagged sites",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const loadSiteRatings = async (url: string) => {
    try {
      const ratings = await getSiteRatings(url);
      setSiteRatings(ratings);
    } catch (error) {
      console.error("Error loading site ratings:", error);
      toast({
        title: "Error",
        description: "Failed to load site ratings",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const loadUserRating = async (url: string, userId: string) => {
    try {
      const rating = await getUserRating(url, userId);
      setUserRating(rating);
    } catch (error) {
      console.error("Error loading user rating:", error);
      toast({
        title: "Error",
        description: "Failed to load user rating",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

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
      const user = await createOrUpdateUser(ethAddress, userData.email);
      console.log("user", user);

      // Rate the site
      console.log("ethAddress", ethAddress);
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
              <HStack justify='center'>
                <Button
                  leftIcon={<CheckIcon />}
                  colorScheme={userRating === true ? "green" : "gray"}
                  onClick={() => handleRateSite(true)}
                >
                  Safe
                </Button>
                <Button
                  leftIcon={<CloseIcon />}
                  colorScheme={userRating === false ? "red" : "gray"}
                  onClick={() => handleRateSite(false)}
                >
                  Unsafe
                </Button>
              </HStack>
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
            <Box>
              <Heading as='h2' size='md'>
                Recently Rated Sites:
              </Heading>
              <List spacing={2}>
                {flaggedSites.map((site, index) => (
                  <ListItem key={index}>
                    {site.url} (rated{" "}
                    {site.is_safe === true
                      ? "safe"
                      : site.is_safe === false
                      ? "unsafe"
                      : "unrated"}{" "}
                    by: {site.flagged_by})
                  </ListItem>
                ))}
              </List>
            </Box>
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
