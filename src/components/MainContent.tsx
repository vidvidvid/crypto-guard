import React from "react";
import { VStack, Text, Button } from "@chakra-ui/react";
import { useWeb3Auth } from "../hooks/useWeb3Auth";
import { useSiteRatings } from "../hooks/useSiteRatings";
import SiteRating from "./SiteRating";
import SiteStats from "./SiteStats";
import CommentsSection from "./CommentsSection";

function MainContent() {
  const { userData, ethAddress, logout } = useWeb3Auth();
  const { currentUrl, isValidUrl } = useSiteRatings(ethAddress);

  return (
    <VStack spacing={4} align='stretch'>
      <Text>Logged in as: {userData?.email || ethAddress}</Text>
      <Text>Current URL: {currentUrl}</Text>
      {isValidUrl ? (
        <>
          <SiteRating />
          <SiteStats />
          <CommentsSection />
        </>
      ) : (
        <Text>Cannot rate this type of URL</Text>
      )}
      <Button onClick={logout}>Logout</Button>
    </VStack>
  );
}

export default MainContent;
