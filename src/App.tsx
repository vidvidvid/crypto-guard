import React, { useEffect, useState, useCallback } from "react";
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
  Checkbox,
  Textarea,
} from "@chakra-ui/react";
import Loader from "./components/Loader";
import { useWeb3Auth } from "./hooks/useWeb3Auth";
import { useSiteRatings } from "./hooks/useSiteRatings";
import { useAttestations } from "./hooks/useAttestations";
import { SiteRatingButtons } from "./components/SiteRatingButtons";
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
    isValidUrl,
    siteRatings,
    userRating,
    setUserRating,
    loadFlaggedSites,
    loadSiteRatings,
  } = useSiteRatings(ethAddress);

  const {
    createAttestation,
    getAttestations,
    loading,
    error: attestationError,
  } = useAttestations();

  const toast = useToast();
  const [newComment, setNewComment] = useState("");
  const [shouldCreateAttestation, setShouldCreateAttestation] = useState(false);

  const safetyRatingId = import.meta.env.VITE_ATTESTATION_SAFETY_RATING_ID;
  console.log("safetyRatingId", safetyRatingId);

  const [comments, setComments] = useState<any[]>([]);

  const SAFETY_RATING_SCHEMA_ID = import.meta.env
    .VITE_ATTESTATION_SAFETY_RATING_ID;
  const COMMENT_SCHEMA_ID = import.meta.env.VITE_ATTESTATION_COMMENT_ID;

  const loadComments = useCallback(async () => {
    if (!COMMENT_SCHEMA_ID || !currentUrl) return;
    try {
      console.log("Loading comments for:", { COMMENT_SCHEMA_ID, currentUrl });
      const attestations = await getAttestations(COMMENT_SCHEMA_ID, currentUrl);
      console.log("Fetched comment attestations:", attestations);
      setComments(attestations || []);
    } catch (error) {
      console.error("Error loading comments:", error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [COMMENT_SCHEMA_ID, currentUrl, getAttestations, toast]);

  useEffect(() => {
    if (currentUrl && COMMENT_SCHEMA_ID) {
      loadComments();
    }
  }, [currentUrl, COMMENT_SCHEMA_ID, loadComments]);

  const handleAddComment = async () => {
    if (!ethAddress || !currentUrl || !newComment || !COMMENT_SCHEMA_ID) {
      toast({
        title: "Error",
        description: "Missing required information to add comment",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await createAttestation(COMMENT_SCHEMA_ID, currentUrl, {
        comment: newComment,
      });
      setNewComment("");
      await loadComments();
      toast({
        title: "Success",
        description: "Comment added successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: `Failed to add comment: ${(error as Error).message}`,
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
      await createOrUpdateUser(ethAddress, userData.email);
      const updatedRating = await rateSite(
        currentUrl,
        ethAddress.toLowerCase(),
        isSafe
      );
      setUserRating(updatedRating.is_safe);

      if (createAttestation) {
        await createAttestation(SAFETY_RATING_SCHEMA_ID, currentUrl, {
          isSafe,
        });
      }

      toast({
        title: "Success",
        description: `Site rated as ${isSafe ? "safe" : "unsafe"} successfully${
          shouldCreateAttestation ? " and attestation created" : ""
        }!`,
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
        description: `Failed to rate site: ${(error as Error).message}`,
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
              <>
                <SiteRatingButtons
                  userRating={userRating}
                  handleRateSite={handleRateSite}
                />
                <Checkbox
                  mt={2}
                  isChecked={shouldCreateAttestation}
                  onChange={(e) => setShouldCreateAttestation(e.target.checked)}
                >
                  Create attestation on blockchain
                </Checkbox>
              </>
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
            {/* <FlaggedSitesList flaggedSites={flaggedSites} /> */}
          </>
        ) : (
          <Button colorScheme='blue' onClick={login}>
            Login
          </Button>
        )}
        {loading && <Text>Loading comments...</Text>}
        {attestationError && <Text color='red.500'>{attestationError}</Text>}
        {comments.length > 0 ? (
          <VStack align='stretch' spacing={2}>
            {comments.map((comment, index) => (
              <Box key={index} p={2} borderWidth={1} borderRadius='md'>
                <Text>{comment.data.comment}</Text>
                <Text fontSize='sm' color='gray.500'>
                  By: {comment.attester.slice(0, 6)}...
                  {comment.attester.slice(-4)}
                </Text>
              </Box>
            ))}
          </VStack>
        ) : (
          <Text>No comments yet.</Text>
        )}
        {isValidUrl && (
          <Box mt={4}>
            <Textarea
              mt={2}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder='Add a comment...'
            />
            <Button mt={2} onClick={handleAddComment}>
              Add Comment
            </Button>
          </Box>
        )}
      </VStack>
    </Container>
  );
}

export default App;
