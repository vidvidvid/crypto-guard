import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAttestations } from "../hooks/useAttestations";
import { useWeb3AuthContext } from "./Web3AuthContext";
import { useToast } from "@chakra-ui/react";
import { isValidFlagUrl, getActiveTabUrl } from "../utils/helpers";

interface SiteRatingsContextType {
  currentUrl: string;
  isValidUrl: boolean;
  siteRatings: {
    safeCount: number;
    unsafeCount: number;
    totalRatings: number;
  } | null;
  userRating: boolean | null;
  loadSiteRatings: (url: string) => Promise<void>;
  rateSite: (isSafe: boolean) => Promise<void>;
}

const SiteRatingsContext = createContext<SiteRatingsContextType | undefined>(
  undefined
);

export const useSiteRatings = () => {
  const context = useContext(SiteRatingsContext);
  if (!context) {
    throw new Error("useSiteRatings must be used within a SiteRatingsProvider");
  }
  return context;
};

export const SiteRatingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [siteRatings, setSiteRatings] = useState<{
    safeCount: number;
    unsafeCount: number;
    totalRatings: number;
  } | null>(null);
  const [userRating, setUserRating] = useState<boolean | null>(null);
  const { createAttestation, getAttestations } = useAttestations();
  const { userData, ethAddress } = useWeb3AuthContext();
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
        console.log("attestations", attestations);
        const safeCount = attestations.filter(
          (a: any) => a.decodedData.isSafe === true
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
      }
    },
    [SAFETY_RATING_SCHEMA_ID, ethAddress, getAttestations]
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

  const value: SiteRatingsContextType = {
    currentUrl,
    isValidUrl,
    siteRatings,
    userRating,
    loadSiteRatings,
    rateSite,
  };

  return (
    <SiteRatingsContext.Provider value={value}>
      {children}
    </SiteRatingsContext.Provider>
  );
};
