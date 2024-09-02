import { useState, useEffect } from "react";
import {
  getFlaggedSites,
  getSiteRatings,
  getUserRating,
} from "../supabaseClient";
import { useToast } from "@chakra-ui/react";
import { isValidFlagUrl, getActiveTabUrl } from "../utils/helpers";

export function useSiteRatings(ethAddress: string | null) {
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
    const initialize = async () => {
      const url = await getActiveTabUrl();
      if (url) {
        const domain = new URL(url).hostname;
        setCurrentUrl(domain);
        setIsValidUrl(isValidFlagUrl(url));
        await loadSiteRatings(domain);
        if (ethAddress) {
          await loadUserRating(domain, ethAddress);
        }
      }
    };

    initialize();
    loadFlaggedSites();
  }, [ethAddress]);

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

  return {
    currentUrl,
    flaggedSites,
    isValidUrl,
    siteRatings,
    userRating,
    setUserRating,
    loadFlaggedSites,
    loadSiteRatings,
  };
}
