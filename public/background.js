// Listen for messages from the popup script
chrome.runtime.onMessage.addListener(function(message) {
  if (message.action === 'captureScreenshot') {
    captureAndDownloadScreenshot();
  }
});

function captureAndDownloadScreenshot() {
  // Capture the full-size screenshot of the webpage.
    chrome.tabs.captureVisibleTab(null, { format: "png" }, function(dataUrl) {
      // Inject script to get scroll height (targeting active tab)
      chrome.scripting.executeScript({
        targets: [{ tabId: chrome.tabs.query({ active: true }, function(tabs) { return tabs[0].id; })[0] }],
        files: ["getScrollHeight.js"]
      }, function(scrollHeight) {
      if (chrome.runtime.lastError) {
        console.error("Failed to inject script:", chrome.runtime.lastError);
        return;
      }
      
      // Error handling and setting canvas height
      if (scrollHeight && scrollHeight.length > 0) {
        var canvasHeight = scrollHeight[0];
      } else {
        console.error("Failed to retrieve scroll height");
        // Handle the error (e.g., set a default height)
        canvasHeight = window.innerHeight; // Use window height as fallback
      }

      // Rest of your code to create canvas, draw screenshots, etc.
      var canvas = document.createElement("canvas");
      canvas.width = window.innerWidth;
      canvas.height = canvasHeight;
      var ctx = canvas.getContext("2d");

      // Draw the first part of the screenshot directly from dataUrl.
      ctx.drawImage(dataUrl, 0, 0, window.innerWidth, canvasHeight);

      // Scroll to the bottom of the page.
      chrome.scripting.executeScript(null, { code: "window.scrollTo(0, document.body.scrollHeight)" }, function() {
        // Wait for scrolling to complete before capturing the rest of the page.
        setTimeout(function() {
          // Capture the remaining content.
          chrome.tabs.captureVisibleTab(null, { format: "png" }, function(dataUrl) {
            // Create image element for the second part of the screenshot.
            var img2 = new Image();
            img2.src = dataUrl;
            img2.onload = function() {
              // Draw the second part of the screenshot below the first part.
              ctx.drawImage(dataUrl, 0, canvasHeight); // Start drawing below previous content

              // Convert the canvas to a data URL.
              var finalDataUrl = canvas.toDataURL("image/png");

              // Initiate the download of the final screenshot.
              chrome.downloads.download({
                url: finalDataUrl,
                filename: 'screenshot.png',
                saveAs: true
              });
            };
          });
        }, 500); // Adjust the delay as needed
      });
    });
  });
  }
