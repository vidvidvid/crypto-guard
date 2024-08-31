import { useState, useEffect } from "react";
import { getFlagCount } from "../supabaseClient";

export function useUrl() {
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [flagCount, setFlagCount] = useState<number>(0);

  useEffect(() => {
    if (chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
          setCurrentUrl(tabs[0].url);
          setIsValidUrl(isValidFlagUrl(tabs[0].url));
        }
      });
    }
  }, []);

  useEffect(() => {
    const fetchFlagCount = async () => {
      if (currentUrl && isValidUrl) {
        try {
          const count = await getFlagCount(currentUrl);
          setFlagCount(count);
        } catch (error) {
          console.error("Error fetching flag count:", error);
        }
      }
    };

    fetchFlagCount();
  }, [currentUrl, isValidUrl]);

  const isValidFlagUrl = (url: string) => {
    return url.startsWith("http://") || url.startsWith("https://");
  };

  return { currentUrl, isValidUrl, flagCount, setFlagCount };
}
