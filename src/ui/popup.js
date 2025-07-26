document.addEventListener("DOMContentLoaded", async () => {
  const hintSection = document.getElementById("hintSection");
  const notProblemSection = document.getElementById("notProblemSection");
  const hintButton = document.getElementById("hintButton");
  const hintContainer = document.getElementById("hintContainer");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const isLeetCodeProblem = tab.url.startsWith("https://leetcode.com/problems/");

  if (isLeetCodeProblem) {
    hintSection.style.display = "block";

    hintButton.addEventListener("click", () => {
      hintContainer.innerHTML = `<p class="info">⏳ Generating hints, please wait...</p>`;

      chrome.tabs.sendMessage(
        tab.id,
        { type: "SCRAPE_QUESTION" },
        (response) => {
          if (chrome.runtime.lastError) {
            hintContainer.innerHTML = `<p class="info">❌ Error: ${chrome.runtime.lastError.message}</p>`;
            return;
          }

          if (response && response.hints) {
            const hints = parseHintsByMarkers(response.hints);
            renderHints(hints);
          } else {
            hintContainer.innerHTML = `<p class="info">⚠️ No hints found.</p>`;
          }
        }
      );
    });

    

  } else {
    notProblemSection.style.display = "block";
  }
  function parseHintsByMarkers(text) {
    const parts = text
      .split(/##\s*Hint\s*\d\s*##/i)
      .map((p) => p.trim())
      .filter((p) => p);
    return parts.slice(0, 3); // Ensure max 3
  }

  function renderHints(hints) {
    hintContainer.innerHTML = ""; // Clear loading
    hints.forEach((hint, index) => {
      const details = document.createElement("details");
      const summary = document.createElement("summary");
      summary.textContent = `Hint ${index + 1}`;
      const content = document.createElement("div");
      content.textContent = hint;
      details.appendChild(summary);
      details.appendChild(content);
      hintContainer.appendChild(details);
    });
  }
});

