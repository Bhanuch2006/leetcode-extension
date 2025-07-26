document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("backButton").addEventListener("click", () => {
    window.location.href = "popup.html";
  });
});

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("backButton").addEventListener("click", () => {
    window.location.href = "popup.html";
  });

  const leaderboardBtn = document.getElementById("leaderboardBtn");
  if (leaderboardBtn) {
    leaderboardBtn.addEventListener("click", () => {
      window.location.href = "leaderboard.html";
    });
  }

  document.getElementById("addFriendBtn").addEventListener("click", () => {
    const friendName = document.getElementById("friendInput").value.trim();
    if (friendName) {
      console.log("Friend added:", friendName);
      alert(
        `Friend "${friendName}" added! (This is just a placeholder action.)`
      );
      document.getElementById("friendInput").value = "";
    }
  });
});