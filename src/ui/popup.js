import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


document.addEventListener("DOMContentLoaded", async () => {
    
    const hintSection = document.getElementById("hintSection");
    const notProblemSection = document.getElementById("notProblemSection");
    const hintButton = document.getElementById("hintButton");
    const hintContainer = document.getElementById("hintContainer");
    const usernameInput = document.getElementById("leetcodeUsernameInput");
    const saveBtn = document.getElementById("saveLeetCodeUsernameBtn");
    const profileBtn = document.getElementById("profileButton");
    const profileContainer = document.getElementById("profileContainer");
    const profileDetails = document.getElementById("profileDetails");
    const usernameSection = document.getElementById("leetcodeUsernameSection");
    const codeSection = document.getElementById("codeSection");

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const docRef = await addDoc(collection(db, "test"), { msg: "Hello from extension!" });    
    const isLeetCodeProblem = tab.url.startsWith("https://leetcode.com/problems/");

    chrome.storage.sync.get(["leetcodeUsername"], (data) => {
        if (data.leetcodeUsername) {
            // Hide input, show profile
            usernameSection.style.display = "none";
            profileContainer.style.display = "block";
        }
    });
    const leetInput = document.getElementById("leetcodeUsernameInput");

    leetInput.addEventListener("focus", () => {
        leetInput.style.border = "1px solid #ffcc70";
        leetInput.style.boxShadow = "0 0 0 2px rgba(255, 204, 112, 0.2)";
    });

    leetInput.addEventListener("blur", () => {
        leetInput.style.border = "1px solid #444";
        leetInput.style.boxShadow = "none";
    });

    // On Save button click
    saveBtn.addEventListener("click", () => {
        const username = usernameInput.value.trim();
        console.log("LeetCode Username saved:", username); // ✅ Console log here
        if (username.length > 0) {
        chrome.storage.sync.set({ leetcodeUsername: username }, () => {
            usernameSection.style.display = "none";
            profileContainer.style.display = "block";
            profileDetails.innerHTML = ""; // clear previous data
        });
        }
    });

    // On Profile button click
    profileBtn.addEventListener("click", async () => {
        chrome.storage.sync.get("leetcodeUsername", async (data) => {
        const username = data.leetcodeUsername;
        if (!username) return;

        profileDetails.innerHTML = "⏳ Fetching profile...";
        try {
            const res = await fetch(
          `https://leetcode-stats-api.herokuapp.com/${username}`
            );
            const info = await res.json();

            if (info.status === "error") {
            profileDetails.innerHTML = "❌ Could not fetch profile.";
            } else {
            profileDetails.innerHTML = `
            👤 <strong>${info.username}</strong><br/>
            🧩 Problems Solved: ${info.totalSolved}/${info.totalQuestions}<br/>
            🏆 Ranking: #${info.ranking}<br/>
            🌟 Easy: ${info.easySolved}, Medium: ${info.mediumSolved}, Hard: ${info.hardSolved}
            `;
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
            profileDetails.innerHTML = "❌ Error loading profile.";
        }
        });
    });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    chrome.storage.sync.remove("leetcodeUsername", () => {
      // Reset UI
      usernameInput.value = "";
      usernameSection.style.display = "block";
      profileContainer.style.display = "none";
      profileDetails.innerHTML = "";
    });
  });

  

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
    hintSection.style.display = "none";
    usernameSection.style.display = "none";
    codeSection.style.display = "none";
    profileContainer.style.display = "none";
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

