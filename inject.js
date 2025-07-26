console.log("inject.js running, trying to get code");

(function waitForMonacoAndExtract() {
  if (window.monaco && monaco.editor && monaco.editor.getModels().length > 0) {
    const code = monaco.editor.getModels()[0].getValue();
    window.postMessage({ type: "LEETCODE_CODE_EXTRACTED", code }, "*");
  } else {
    setTimeout(waitForMonacoAndExtract, 100); // retry after 100ms
  }
})();