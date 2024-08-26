// public/background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkURL") {
    console.log("Checking URL:", request.url);
    // Implement your URL checking logic here
    sendResponse({ status: "URL received" });
  }
  return true; // Indicates we will send a response asynchronously
});
