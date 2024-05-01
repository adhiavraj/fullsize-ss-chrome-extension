// Listen for messages from the popup script
chrome.runtime.onMessage.addListener(function(message) {
  if (message.action === 'captureAndDownloadScreenshot') {
    console.log("Message received: captureAndDownloadScreenshot");
    captureAndDownloadScreenshot();
  }
});

function captureAndDownloadScreenshot() {
  // Capture the full-size screenshot of the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var tab = tabs[0];
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    }, function() {
      // Handle callback if needed
      if (chrome.runtime.lastError) {
        console.error("Failed to execute content script:", chrome.runtime.lastError);
        return;
      }
      // Execute the content script to capture and download the screenshot
      chrome.tabs.sendMessage(tab.id, { action: 'captureAndDownloadScreenshot' });
    });
  });
}
