// SiteRating.tsx
import { VStack, useToast, Text, useDisclosure } from "@chakra-ui/react";
import { useWeb3AuthContext } from "../contexts/Web3AuthContext";
import { useSiteRatings } from "../contexts/SiteRatingsContext";
import { SiteRatingButtons } from "./SiteRatingButtons";
import { useState } from "react";
import { ConfirmationDialog } from "./ConfirmationDialog";

function SiteRating() {
  const { ethAddress } = useWeb3AuthContext();
  const { currentUrl, userRating, siteRatings, rateSite } = useSiteRatings();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [pendingRating, setPendingRating] = useState<boolean | null>(null);
  const toast = useToast();

  const handleRateSite = async (isSafe: boolean) => {
    if (!ethAddress || !currentUrl) {
      toast({
        title: "Error",
        description: "Cannot rate site: missing data or invalid URL",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (userRating !== null && userRating !== isSafe) {
      setPendingRating(isSafe);
      onOpen();
    } else {
      await submitRating(isSafe);
    }
  };

  const submitRating = async (isSafe: boolean) => {
    try {
      await rateSite(isSafe);
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

  return (
    <VStack spacing={2} align='stretch'>
      <SiteRatingButtons
        userRating={userRating}
        handleRateSite={handleRateSite}
      />
      {siteRatings && (
        <VStack>
          <Text>Safe Ratings: {siteRatings.safeCount}</Text>
          <Text>Unsafe Ratings: {siteRatings.unsafeCount}</Text>
          <Text>Total Ratings: {siteRatings.totalRatings}</Text>
        </VStack>
      )}
      <ConfirmationDialog
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={() => {
          onClose();
          submitRating(pendingRating!);
        }}
        title='Change Rating'
        message='Are you sure you want to change your rating for this site?'
      />
    </VStack>
  );
}

export default SiteRating;
