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
    if(!friendsArray.includes(username1)){
      friendsArray.push(username1);
      awaitupdateDoc(userDocRef,{friends:arrayUnion(username1)});
    }
    if (leaderboardList) {
  
      displaySortedLeaderboard(friendsArray, leaderboardList);
    } else {
      console.error("No element with id 'leaderboardlist' found.");
    }
  } else {
    console.log(`User document for ${username1} does not exist.`);
  }

  async function displaySortedLeaderboard(friendsArray, leaderboardList, username1) {
  try {
    const userDataPromises = friendsArray.map(async (username) => {
      const response = await fetch(`https://leetcode-stats-api.herokuapp.com/${encodeURIComponent(username)}`);
      if (!response.ok) {
        throw new Error(`Network response was not ok for user ${username}`);
      }
      const data = await response.json();
      const points = 1 * data.easySolved + 3 * data.mediumSolved + 7 * data.hardSolved;
      return { username, points };
    });

    const usersWithPoints = await Promise.all(userDataPromises);
    usersWithPoints.sort((a, b) => b.points - a.points);
    leaderboardList.innerHTML = "";

    usersWithPoints.forEach(({ username, points }) => {
      const li = document.createElement("li");

      const nameSpan = document.createElement("span");
      nameSpan.className = "username";
      nameSpan.textContent = username;

      const pointsSpan = document.createElement("span");
      pointsSpan.className = "points";
      pointsSpan.textContent = points;

      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-btn";
      removeBtn.textContent = "−";
      removeBtn.title = `Remove ${username}`;

      removeBtn.addEventListener("click", async () => {
        const currentUser = await getLeetCodeUsername();
        const userDocRef = doc(db, "users", currentUser);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const currentFriends = docSnap.data().friends || [];
          const updatedFriends = currentFriends.filter((u) => u !== username);
          await setDoc(userDocRef, { friends: updatedFriends }, { merge: true });
          displaySortedLeaderboard(updatedFriends, leaderboardList, username1);
        }
      });

      // 🔥 Add special styling for the current user
      if (username === username1) {
        li.classList.add("current-user");
      }

      li.appendChild(nameSpan);
      li.appendChild(pointsSpan);
      li.appendChild(removeBtn);
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
        const updatedDocSnap = await getDoc(userDocRef);
        const updatedFriends = updatedDocSnap.data().friends || [];
        displaySortedLeaderboard(updatedFriends, leaderboardList);
      }else{
        console.log("Username does not exist");
        
      }
      document.getElementById("friendInput").value = "";
    }
  });
});