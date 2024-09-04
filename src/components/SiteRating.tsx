import React, { useState } from "react";
import { VStack, Checkbox, useToast } from "@chakra-ui/react";
import { useWeb3Auth } from "../hooks/useWeb3Auth";
import { useSiteRatings } from "../hooks/useSiteRatings";
import { useAttestations } from "../hooks/useAttestations";
import { SiteRatingButtons } from "./SiteRatingButtons";
import { createOrUpdateUser, rateSite } from "../supabaseClient";

function SiteRating() {
  const { ethAddress, userData } = useWeb3Auth();
  const {
    currentUrl,
    userRating,
    setUserRating,
    loadFlaggedSites,
    loadSiteRatings,
  } = useSiteRatings(ethAddress);
  const { createAttestation } = useAttestations();
  const toast = useToast();
  const [shouldCreateAttestation, setShouldCreateAttestation] = useState(false);

  const SAFETY_RATING_SCHEMA_ID = import.meta.env
    .VITE_ATTESTATION_SAFETY_RATING_ID;

  const handleRateSite = async (isSafe: boolean) => {
    if (!ethAddress || !currentUrl || !userData?.email) {
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

      if (shouldCreateAttestation) {
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

  return (
    <VStack spacing={2} align='stretch'>
      <SiteRatingButtons
        userRating={userRating}
        handleRateSite={handleRateSite}
      />
      <Checkbox
        isChecked={shouldCreateAttestation}
        onChange={(e) => setShouldCreateAttestation(e.target.checked)}
      >
        Create attestation on blockchain
      </Checkbox>
    </VStack>
  );
}

export default SiteRating;
