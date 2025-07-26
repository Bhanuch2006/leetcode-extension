
chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  if (request.type === 'SCRAPE_QUESTION') {
    const slug = getQuestionSlugFromURL();    
    const question = await fetchLeetCodeProblem(slug);  
    const prompt = `Give a 3 hints point wise for this LeetCode problem:\nTitle: ${question.title}\nDescription: ${question.content}. The first hint should be a bit subtle. Second hint should tell a bit more and third hint should almost give way. The hint should be of two lines maximum`;
    const completion = await getGeminiCompletion(prompt);
    console.log(completion);
    
  }
});



function getQuestionSlugFromURL() {
  const url = window.location.href; 
  const match = url.match(/leetcode\.com\/problems\/([^\/]+)/);
  if (match && match[1]) {
    return match[1];  
  }
  return null;
}

//Using api to fetch question data

async function fetchLeetCodeProblem(titleSlug) {
  const query = `
    query getQuestionDetail($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        title
        content
        difficulty
        sampleTestCase
        codeSnippets { lang code }
        topicTags { name }
      }
    }
  `;
  const variables = { titleSlug };
  const response = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  const data = await response.json();
  return data.data.question;
}

//gemini
async function getGeminiCompletion(prompt) {
  const apiKey = ""; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }]
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  // Extract response text
  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    "No response from Gemini API"
  );
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === "SCRAPE_QUESTION") {
    (async () => {
      try {
        const slug = getQuestionSlugFromURL();
        const question = await fetchLeetCodeProblem(slug);

        const prompt = `Give 3 hints point wise for this LeetCode problem:\nTitle: ${question.title}\nDescription: ${question.content}. The first hint should be a bit subtle. Second hint should tell a bit more and third hint should almost give way. Each hint should be a maximum of two lines.`;

        const completion = await getGeminiCompletion(prompt);

        sendResponse({ hints: completion }); // ✅ Send response back to popup.js
      } catch (error) {
        sendResponse({ hints: "❌ Error generating hints." });
      }
    })();

    return true; // ✅ Keep port open for async sendResponse
  }
});

