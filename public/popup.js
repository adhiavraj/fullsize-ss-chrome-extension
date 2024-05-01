document.addEventListener('DOMContentLoaded', function() {
  var captureBtn = document.getElementById('captureBtn');
  captureBtn.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'captureAndDownloadScreenshot' });
  });
});
