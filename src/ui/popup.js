document.addEventListener("DOMContentLoaded", async () => {
  const hintSection = document.getElementById("hintSection");
  const notProblemSection = document.getElementById("notProblemSection");
  const hintButton = document.getElementById("hintButton");
  const hintContainer = document.getElementById("hintContainer");
  const signInBtn = document.getElementById("signInBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const userWelcome = document.getElementById("userWelcome");
  const userNameSpan = document.getElementById("userName");

  const savedUser = JSON.parse(localStorage.getItem("debugmateUser"));
  if (savedUser) {
    userNameSpan.textContent = savedUser.name;
    userWelcome.style.display = "block";
    signInBtn.style.display = "none";
    logoutBtn.style.display = "inline-block"; // ✅ Show logout if user found
  }

  // Sign-In Handler
  signInBtn.addEventListener("click", () => {
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
      if (chrome.runtime.lastError || !token) {
        
        console.log("chrome.runtime.lastError");
        
        alert("Sign-in failed");
        return;
      }

      fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: "Bearer " + token },
      })
        .then((res) => res.json())
        .then((user) => {
          console.log("✅ Signed in user:", user);
          userNameSpan.textContent = user.name;
          userWelcome.style.display = "block";
          signInBtn.style.display = "none";
          logoutBtn.style.display = "inline-block"; // ✅ Show logout

          localStorage.setItem("debugmateUser", JSON.stringify(user));
        });
    });
  });

  // 🚪 Logout Handler
  logoutBtn.addEventListener("click", () => {
    chrome.identity.getAuthToken({ interactive: false }, function (token) {
      if (token) {
        chrome.identity.removeCachedAuthToken({ token }, () => {
          localStorage.removeItem("debugmateUser");
          resetUI();
          //alert("Logged out successfully.");
        });
      } else {
        localStorage.removeItem("debugmateUser");
        resetUI();
      }
    });
  });

  // Helper to reset UI on logout
  function resetUI() {
    signInBtn.style.display = "inline-block";
    userWelcome.style.display = "none";
    logoutBtn.style.display = "none";
    userNameSpan.textContent = "";
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const isLeetCodeProblem = tab.url.startsWith("https://leetcode.com/problems/");

  if (isLeetCodeProblem) {
    hintSection.style.display = "block";
    chrome.storage.sync.get(["lastHints", "lastUrl"], (data) => {
      if (data.lastHints && data.lastUrl === tab.url) {
        const hints = parseHintsByMarkers(data.lastHints);
        renderHints(hints);
      }
    });

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
          // Parse and display
          const hints = parseHintsByMarkers(response.hints);
          renderHints(hints);

          // Save to chrome.storage.sync
          chrome.storage.sync.set({
            lastHints: response.hints,
            lastUpdated: new Date().toISOString(),
            lastUrl: tab.url
          }, () => {
            console.log("Hints saved to storage.");
          });
        } else {
          hintContainer.innerHTML = `<p class="info">⚠️ No hints found.</p>`;
        }
      }
    );

    });

    document.getElementById('errorButton').addEventListener("click", () => {
        const errorContainer = document.getElementById("errorContainer");
        errorContainer.innerHTML = '<p class="info">Generating Error :)</p>';

        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            chrome.tabs.sendMessage(tab.id, { type: "GET_LEETCODE_CODE" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Message send error:", chrome.runtime.lastError);
                errorContainer.innerHTML = `<p class="error">Error: ${chrome.runtime.lastError.message}</p>`;
                return;
            }
            console.log("[Popup] LeetCode code:", response.code);
            errorContainer.innerHTML = `<p class="info">Errors: ${response.code} </p>` ;
            });
        });
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

