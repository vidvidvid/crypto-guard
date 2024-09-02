import { createClient } from "@supabase/supabase-js";

console.log("Background script starting...");

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Anon Key:", supabaseAnonKey ? "Set" : "Not Set");

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function setIcon(tabId: number, flagged: boolean, count: number) {
  const iconPath = flagged ? "icon" : "icon";
  const iconSuffix = flagged ? "_flagged" : "";
  chrome.action.setIcon({
    tabId: tabId,
    path: {
      "16": `${iconPath}16${iconSuffix}.png`,
      "48": `${iconPath}48${iconSuffix}.png`,
      "128": `${iconPath}128${iconSuffix}.png`,
    },
  });
  chrome.action.setBadgeText({
    text: flagged ? count.toString() : "",
    tabId: tabId,
  });
  chrome.action.setBadgeBackgroundColor({ color: "#FF0000", tabId: tabId });
}

async function checkUrl(tabId: number, url: string) {
  console.log(`Checking URL: ${url} for tab ${tabId}`);
  try {
    const { data, error } = await supabase
      .from("flagged_sites")
      .select("url")
      .eq("url", url)
      .eq("is_safe", false); // Change this line to check for unsafe sites

    if (error) {
      console.error("Error checking flagged sites:", error);
      setIcon(tabId, false, 0);
      return;
    }

    const flagged = data && data.length > 0;
    setIcon(tabId, flagged, data ? data.length : 0);
  } catch (error) {
    console.error("Error in checkUrl:", error);
    setIcon(tabId, false, 0);
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    checkUrl(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      checkUrl(activeInfo.tabId, tab.url);
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkCurrentUrl") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        checkUrl(tabs[0].id!, tabs[0].url);
      }
    });
  }
});

console.log("Background script setup complete.");
