import { initializeApp } from "firebase/app";
import { doc, getDoc,setDoc } from "firebase/firestore";
import { getFirestore, collection, addDoc, updateDoc, arrayUnion } from "firebase/firestore";

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

  function getLeetCodeUsername() {
    return new Promise((resolve) => {
          chrome.storage.sync.get("leetcodeUsername", (result) => {
          resolve(result.leetcodeUsername);
        });
    });
  }

  const username1 = await getLeetCodeUsername();

  const userDocRef = doc(db, "users", username1);
  const docSnap = await getDoc(userDocRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    const friendsArray = data.friends || [];  // Default to empty array if no friends field
    const leaderboardList = document.getElementById("leaderboardList");
    if (leaderboardList) {
  
      displaySortedLeaderboard(friendsArray, leaderboardList);
    } else {
      console.error("No element with id 'leaderboardlist' found.");
    }
  } else {
    console.log(`User document for ${username1} does not exist.`);
  }

  async function displaySortedLeaderboard(friendsArray, leaderboardList) {
  try {
    // Map to array of promises fetching each user's data
      const userDataPromises = friendsArray.map(async (username) => {
      const response = await fetch(`https://leetcode-stats-api.herokuapp.com/${encodeURIComponent(username)}`);
      if (!response.ok) {
        throw new Error(`Network response was not ok for user ${username}`);
      }
      const data = await response.json();
      const points = 1 * data.easySolved + 3 * data.mediumSolved + 7 * data.hardSolved;
      return { username, points };
    });

    // Wait for all fetches to resolve
    const usersWithPoints = await Promise.all(userDataPromises);

    // Sort descending by points
    usersWithPoints.sort((a, b) => b.points - a.points);

    // Clear existing list
    leaderboardList.innerHTML = "";

    // Append sorted users to the list
    usersWithPoints.forEach(({ username, points }) => {
      const li = document.createElement("li");
      li.textContent = `${username} ${points}`;
      leaderboardList.appendChild(li);
    });
  } catch (error) {
    console.error("Error building leaderboard:", error);
    leaderboardList.innerHTML = "<li>Error loading leaderboard.</li>";
  }
}



  document.getElementById("backButton").addEventListener("click", () => {
    window.location.href = "popup.html";
  });

  const leaderboardBtn = document.getElementById("leaderboardBtn");
  if (leaderboardBtn) {
    leaderboardBtn.addEventListener("click", () => {
      window.location.href = "leaderboard.html";
    });
  }

  document.getElementById("addFriendBtn").addEventListener("click", async () => {
    const friendName = document.getElementById("friendInput").value.trim();
    if (friendName) {
      
      const username = await getLeetCodeUsername();
      if(!username){
        return;
      }
      const userDocRef = doc(db, "users", username);
      const docSnap = await getDoc(userDocRef);
      if(docSnap.exists()){
        await updateDoc(userDocRef, {
        friends: arrayUnion(friendName)
      });
      }else{
        console.log("Username does not exist");
        
      }
      
      
      
      document.getElementById("friendInput").value = "";
    }
  });
});