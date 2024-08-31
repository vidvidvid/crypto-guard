import { useState, useCallback } from "react";
import {
  getFlaggedSites,
  flagSite,
  unflagSite,
  getFlagCount,
} from "../supabaseClient";

export function useFlaggedSites() {
  const [flaggedSites, setFlaggedSites] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadFlaggedSites = useCallback(async () => {
    try {
      const sites = await getFlaggedSites();
      setFlaggedSites(sites);
    } catch (error) {
      console.error("Error loading flagged sites:", error);
      setError("Failed to load flagged sites");
    }
  }, []);

  const handleFlagSite = useCallback(
    async (currentUrl: string, userEmail: string) => {
      setError(null);
      setMessage(null);

      try {
        await flagSite(currentUrl, userEmail);
        const newCount = await getFlagCount(currentUrl);
        console.log("New flag count:", newCount);
        setMessage(`Site flagged successfully! Total flags: ${newCount}`);
        await loadFlaggedSites();
        return newCount;
      } catch (error) {
        console.error("Error flagging site:", error);
        setError("Failed to flag site: " + (error as Error).message);
        return null;
      }
    },
    [loadFlaggedSites]
  );

  const handleUnflagSite = useCallback(
    async (currentUrl: string, userEmail: string) => {
      setError(null);
      setMessage(null);

      try {
        await unflagSite(currentUrl, userEmail);
        const newCount = await getFlagCount(currentUrl);
        setMessage(`Site unflagged successfully! Total flags: ${newCount}`);
        await loadFlaggedSites();
        return newCount;
      } catch (error) {
        console.error("Error unflagging site:", error);
        setError("Failed to unflag site: " + (error as Error).message);
        return null;
      }
    },
    [loadFlaggedSites]
  );

  return {
    flaggedSites,
    error,
    message,
    loadFlaggedSites,
    handleFlagSite,
    handleUnflagSite,
  };
}
