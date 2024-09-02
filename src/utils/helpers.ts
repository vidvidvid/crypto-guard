export const isValidFlagUrl = (url: string): boolean => {
  return url.startsWith("http://") || url.startsWith("https://");
};

export const getActiveTabUrl = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    if (chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
          resolve(tabs[0].url);
        } else {
          resolve(null);
        }
      });
    } else {
      resolve(null);
    }
  });
};
