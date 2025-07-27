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
  leaderboardList.innerHTML = "<li>Fetching leaderboard...</li>";
  const friendSection = document.querySelector('.friend-section');
  if (friendSection) {
    friendSection.style.display = 'none';  // hide it while loading leaderboard
  }

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
      await updateDoc(userDocRef,{friends:arrayUnion(username1)});
    }
    if (leaderboardList) {
      
      displaySortedLeaderboard(friendsArray, leaderboardList, username1);
    } else {
      console.error("No element with id 'leaderboardlist' found.");
    }
  } else {
    console.log(`User document for ${username1} does not exist.`);
  }

  async function displaySortedLeaderboard(friendsArray, leaderboardList, username1) {
    const friendSection = document.querySelector('.friend-section');
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

      // const nameSpan = document.createElement("span");
      // nameSpan.className = "username";
      // nameSpan.textContent = username;
      const anchor = document.createElement("a");
      anchor.className = "username";
      anchor.href = `https://leetcode.com/u/${encodeURIComponent(username)}`;
      anchor.textContent = username;
      anchor.target = "_blank"; // Open in new tab
      anchor.style.textDecoration = "none";
      anchor.style.color = "inherit";

      const pointsSpan = document.createElement("span");
      pointsSpan.className = "points";
      pointsSpan.textContent = points;

      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-btn";
      removeBtn.textContent = "−";
      removeBtn.title = `Remove ${username}`;

      removeBtn.addEventListener("click", async () => {
        const statusMsg = document.getElementById("removeFriendStatus");

        // Show removing message and disable remove button
        removeBtn.disabled = true;
        if (statusMsg) {
          statusMsg.innerHTML = `Removing user <b>${username}</b> ...`;
        }

        try {
          const currentUser = await getLeetCodeUsername();
          const userDocRef = doc(db, "users", currentUser);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            const currentFriends = docSnap.data().friends || [];
            const updatedFriends = currentFriends.filter((u) => u !== username);
            await setDoc(userDocRef, { friends: updatedFriends }, { merge: true });
            displaySortedLeaderboard(updatedFriends, leaderboardList, username1);
            if (statusMsg) statusMsg.innerHTML = `User <b>${username}</b> removed successfully!`;
          } else {
            if (statusMsg) statusMsg.textContent = "Current user document does not exist.";
          }
        } catch (error) {
          console.error(error);
          if (statusMsg) statusMsg.textContent = "Error removing user.";
        } finally {
          removeBtn.disabled = false;
          // Clear the status message after 3 seconds
          setTimeout(() => {
            if (statusMsg) statusMsg.textContent = "";
          }, 3000);
        }
      });

      if(username == username1){
        li.classList.add("current-user");
        
      }

      li.appendChild(anchor);
      li.appendChild(pointsSpan);
      if(username != username1){  
        li.appendChild(removeBtn);
      }
        
      leaderboardList.appendChild(li);
    });
    if (friendSection) {
      friendSection.style.display = 'block';
    }
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
    const addBtn = document.getElementById("addFriendBtn");
    const friendInput = document.getElementById("friendInput");
    const statusMsg = document.getElementById("addFriendStatus"); // Create this element in your HTML

    const friendName = friendInput.value.trim();
    if (friendName) {
      // Show adding user message and disable inputs
      addBtn.disabled = true;
      friendInput.disabled = true;
      if (statusMsg) {
        statusMsg.textContent = "Adding user...";
      }

      try {
        const username = await getLeetCodeUsername();
        if (!username) {
          if (statusMsg) statusMsg.textContent = "Current username not found.";
          return;
        }
        const userDocRef = doc(db, "users", username);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          await updateDoc(userDocRef, {
            friends: arrayUnion(friendName)
          });
          const updatedDocSnap = await getDoc(userDocRef);
          const updatedFriends = updatedDocSnap.data().friends || [];
          displaySortedLeaderboard(updatedFriends, leaderboardList, username);
          if (statusMsg) statusMsg.textContent = "User added successfully!";
        } else {
          if (statusMsg) statusMsg.textContent = "Username does not exist.";
        }
      } catch (err) {
        console.error(err);
        if (statusMsg) statusMsg.textContent = "Error adding user.";
      } finally {
        addBtn.disabled = false;
        friendInput.disabled = false;
        friendInput.value = "";
        // Optionally clear status message after some time
        setTimeout(() => {
          if (statusMsg) statusMsg.textContent = "";
        }, 3000);
      }
    }
  });
});