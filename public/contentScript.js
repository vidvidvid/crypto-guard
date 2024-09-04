// This script runs on every webpage
console.log("CryptoGuard is active");

// Send the current URL to the extension
chrome.runtime.sendMessage({ action: "checkURL", url: window.location.href });
