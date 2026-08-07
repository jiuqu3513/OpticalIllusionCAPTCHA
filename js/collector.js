// CAPTCHA 数据收集器
var GOOGLE_ENDPOINT = "https://script.google.com/macros/s/AKfycbwgklUgIi53s1qm3AGaf6DFonrVDahi07SBsW6qSuyWNqOfgwbphpZ_6A6Amk6Sea1G/exec";

var DataCollector = {
  trials: [],
  feedback: null,

  submitResult: function(page, totalScore, passed) {
    DataCollector._send({
      page: page, type: "result",
      totalScore: totalScore, passed: passed,
      trials: DataCollector.trials,
      feedback: DataCollector.feedback,
      userAgent: navigator.userAgent
    });
  },

  submitFeedback: function(page, feedback) {
    DataCollector.feedback = feedback;
    DataCollector._send({
      page: page, type: "feedback_only",
      feedback: feedback, trials: DataCollector.trials,
      userAgent: navigator.userAgent
    });
  },

  _send: function(payload) {
    var body = JSON.stringify(payload);

    function post(url) {
      return fetch(url, {
        method: "POST",
        redirect: "follow",  // Google Apps Script 会 302 重定向，必须 follow 并重发 POST
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: body
      });
    }

    if (GOOGLE_ENDPOINT) {
      post(GOOGLE_ENDPOINT).then(function(r) {
        console.log("DataCollector: Google " + (r.ok ? "✓ HTTP " + r.status : "✗ HTTP " + r.status));
      }).catch(function(e) {
        console.warn("DataCollector: Google failed — " + e.message);
      });
    }

    // 本地服务器（如果有）
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      post("/feedback").then(function(r) {
        console.log("DataCollector: local " + (r.ok ? "✓" : "✗"));
      }).catch(function() {});
    }
  }
};
