
chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  if (request.type === 'SCRAPE_QUESTION') {
    const slug = getQuestionSlugFromURL();    
    const question = await fetchLeetCodeProblem(slug);  
    console.log(question);
    
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

