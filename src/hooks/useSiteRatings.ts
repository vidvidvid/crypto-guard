import { useState, useEffect, useCallback } from "react";
import { useAttestations } from "./useAttestations";
import { useWeb3AuthContext } from "../contexts/Web3AuthContext";
import { useToast } from "@chakra-ui/react";
import { isValidFlagUrl, getActiveTabUrl } from "../utils/helpers";

export function useSiteRatings(ethAddress: string | null) {
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [siteRatings, setSiteRatings] = useState<{
    safeCount: number;
    unsafeCount: number;
    totalRatings: number;
  } | null>(null);
  const [userRating, setUserRating] = useState<boolean | null>(null);
  const { createAttestation, getAttestations } = useAttestations();
  const { userData } = useWeb3AuthContext();
  const toast = useToast();

  const SAFETY_RATING_SCHEMA_ID = import.meta.env
    .VITE_ATTESTATION_SAFETY_RATING_ID;

  const loadSiteRatings = useCallback(
    async (url: string) => {
      if (!SAFETY_RATING_SCHEMA_ID || !url) return;
      try {
        const attestations = await getAttestations(
          SAFETY_RATING_SCHEMA_ID,
          url
        );
        const safeCount = attestations.filter(
          (a: any) => a.decodedData.isSafe
        ).length;
        const unsafeCount = attestations.length - safeCount;

        setSiteRatings({
          safeCount,
          unsafeCount,
          totalRatings: attestations.length,
        });

        if (ethAddress) {
          const userAttestation = attestations.find(
            (a: any) =>
              a.decodedData.ethAddress.toLowerCase() ===
              ethAddress.toLowerCase()
          );
          setUserRating(
            userAttestation ? userAttestation.decodedData.isSafe : null
          );
        }
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
    },
    [SAFETY_RATING_SCHEMA_ID, ethAddress, getAttestations, toast]
  );

  useEffect(() => {
    const initialize = async () => {
      const url = await getActiveTabUrl();
      if (url) {
        const domain = new URL(url).hostname;
        setCurrentUrl(domain);
        setIsValidUrl(isValidFlagUrl(url));
        await loadSiteRatings(domain);
      }
    };

    initialize();
  }, [ethAddress, loadSiteRatings]);

  const rateSite = async (isSafe: boolean) => {
    if (
      !SAFETY_RATING_SCHEMA_ID ||
      !currentUrl ||
      !ethAddress ||
      !userData?.email
    ) {
      throw new Error("Missing required information to rate site");
    }

    try {
      await createAttestation(SAFETY_RATING_SCHEMA_ID, currentUrl, {
        url: currentUrl,
        isSafe,
        ethAddress,
      });
      await loadSiteRatings(currentUrl);
      setUserRating(isSafe);

      toast({
        title: "Success",
        description: `Site rated as ${
          isSafe ? "safe" : "unsafe"
        } successfully!`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error rating site:", error);
      toast({
        title: "Error",
        description: `Failed to rate site: ${(error as Error).message}`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      throw error;
    }
  };

  return {
    currentUrl,
    isValidUrl,
    siteRatings,
    userRating,
    setUserRating,
    loadSiteRatings,
    rateSite,
  };
}
