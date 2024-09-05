import { extractDomain } from "./utils/extractDomain";
import { getAttestations } from "./utils/attestationUtils";

console.log("Background script starting...");

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
  const domain = extractDomain(url);
  console.log(`Checking Domain: ${domain} for tab ${tabId}`);

  try {
    const attestations = await getAttestations(domain.toLowerCase());
    const unsafeCount = attestations.filter(
      (attestation: any) => !attestation.decodedData.isSafe
    ).length;
    const flagged = unsafeCount > 0;
    setIcon(tabId, flagged, unsafeCount);
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
