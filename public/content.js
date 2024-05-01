// Listen for message from the background script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log("Message received in content script:", message);
    if (message.action === 'captureAndDownloadScreenshot') {
        console.log("Capture and download screenshot message received in content script");

        // Capture and download the full-size screenshot
        captureAndDownloadFullPageScreenshot(function(success) {
            if (success) {
                console.log("Screenshot captured and downloaded successfully.");
                sendResponse({ success: true });
            } else {
                console.error("Failed to capture and download screenshot.");
                sendResponse({ success: false });
            }
        });

        // Return true to indicate that sendResponse will be called asynchronously
        return true;
    }
});

// Function to capture and download the full-size screenshot of the webpage
function captureAndDownloadFullPageScreenshot(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        var tab = tabs[0];
        var screenshotCanvas = document.createElement("canvas");
        var ctx = screenshotCanvas.getContext("2d");
        var viewportWidth = tab.width;
        var viewportHeight = tab.height;

        // Set canvas dimensions to match viewport
        screenshotCanvas.width = viewportWidth;
        screenshotCanvas.height = viewportHeight;

        // Capture initial screenshot
        captureViewportScreenshot(tab.id, function(dataUrl) {
            if (!dataUrl) {
                callback(false);
                return;
            }

            var baseImage = new Image();
            baseImage.src = dataUrl;
            baseImage.onload = function() {
                ctx.drawImage(baseImage, 0, 0);

                // Check if the entire page has been captured
                if (tab.height <= viewportHeight) {
                    // All content captured, download the screenshot
                    downloadScreenshot(screenshotCanvas.toDataURL("image/png"), function(success) {
                        callback(success);
                    });
                } else {
                    // Scroll the page and capture subsequent screenshots
                    captureNextScreenshot(0);
                }
            };
        });

        // Function to capture the screenshot of the current viewport
        function captureViewportScreenshot(tabId, captureCallback) {
            chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" }, function(dataUrl) {
                captureCallback(dataUrl);
            });
        }

        // Function to capture the next portion of the page
        function captureNextScreenshot(scrollOffset) {
            chrome.tabs.executeScript(tab.id, {
                code: 'window.scrollTo(0, ' + scrollOffset + ');'
            }, function() {
                setTimeout(function() {
                    captureViewportScreenshot(tab.id, function(dataUrl) {
                        if (!dataUrl) {
                            callback(false);
                            return;
                        }

                        var nextPageImage = new Image();
                        nextPageImage.src = dataUrl;
                        nextPageImage.onload = function() {
                            ctx.drawImage(nextPageImage, 0, scrollOffset);

                            // Check if there is more content to capture
                            if (scrollOffset + viewportHeight >= tab.height) {
                                // All content captured, download the screenshot
                                downloadScreenshot(screenshotCanvas.toDataURL("image/png"), function(success) {
                                    callback(success);
                                });
                            } else {
                                // Scroll further and capture next screenshot
                                scrollOffset += viewportHeight;
                                captureNextScreenshot(scrollOffset);
                            }
                        };
                    });
                }, 200); // Adjust delay as needed
            });
        }

        // Function to download the screenshot
        function downloadScreenshot(dataUrl, downloadCallback) {
            chrome.downloads.download({
                url: dataUrl,
                filename: 'screenshot.png',
                saveAs: true
            }, function(downloadId) {
                downloadCallback(downloadId !== undefined);
            });
        }
    });
}
