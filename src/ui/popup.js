import { getActiveTabURL } from "../utils/utils.js";

document.addEventListener("DOMContentLoaded", async () => {
    const activeTab = await getActiveTabURL();
    const container = document.getElementsByClassName("container")[0];
    if (activeTab.url.includes("leetcode.com/problems/")) {
        container.innerHTML = '<div class="title">Hello, This is your DebugMate.</div>'
        
        chrome.tabs.sendMessage(
            activeTab.id,
            {type: "SCRAPE_QUESTION"}
        );
    } else {
        container.innerHTML = '<div class="title">This is not a problem page.</div>';
    }
});

