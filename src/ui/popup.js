document.addEventListener("DOMContentLoaded", async () => {
  const hintSection = document.getElementById("hintSection");
  const notProblemSection = document.getElementById("notProblemSection");
  const hintBox = document.getElementById("hintBox");
  const hintButton = document.getElementById("hintButton");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const isLeetCodeProblem = tab.url.startsWith(
    "https://leetcode.com/problems/"
  );

  if (isLeetCodeProblem) {
    hintSection.style.display = "block";

    hintButton.addEventListener("click", () => {
      hintBox.textContent = "⏳ Generating hints, please wait...";
      chrome.tabs.sendMessage(
        tab.id,
        { type: "SCRAPE_QUESTION" },
        (response) => {
          if (chrome.runtime.lastError) {
            hintBox.textContent =
              "❌ Error: " + chrome.runtime.lastError.message;
            return;
          }

          if (response && response.hints) {
            hintBox.textContent = response.hints;
          } else {
            hintBox.textContent = "⚠️ No hints found for this problem.";
          }
        }
      );
    });
  } else {
    notProblemSection.style.display = "block";
  }
});

chrome.tabs.sendMessage(tab.id, { type: "SCRAPE_QUESTION" }, (response) => {
  if (chrome.runtime.lastError) {
    hintBox.textContent = "❌ Error: " + chrome.runtime.lastError.message;
    return;
  }

  if (response && response.hints) {
    hintBox.textContent = response.hints;
  } else {
    hintBox.textContent = "⚠️ No hints found for this problem.";
  }
});
