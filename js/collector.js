// ============================================================
// CAPTCHA 数据收集器
// 优先 POST 到 GOOGLE_ENDPOINT，失败则 POST 到 /feedback（本地 server.py）
// 都失败则 console.log
// ============================================================

// ============ 配置：你的 Google Apps Script Web App URL ============
var GOOGLE_ENDPOINT = "https://script.google.com/macros/s/AKfycbwgklUgIi53s1qm3AGaf6DFonrVDahi07SBsW6qSuyWNqOfgwbphpZ_6A6Amk6Sea1G/exec";
// =====================================================================

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
    var urls = [];
    if (GOOGLE_ENDPOINT) urls.push(GOOGLE_ENDPOINT);
    urls.push("/feedback");

    function tryNext(i) {
      if (i >= urls.length) {
        console.warn("DataCollector: all endpoints failed. Data:", body);
        return;
      }
      var url = urls[i];
      console.log("DataCollector: sending to " + url + " ...");
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: body
      }).then(function(r) {
        return r.json().then(function(d) {
          if (d.status === "ok") {
            console.log("DataCollector: ✓ saved to " + url);
          } else {
            console.warn("DataCollector: server error from " + url, d);
            tryNext(i + 1);
          }
        });
      }).catch(function(e) {
        console.warn("DataCollector: failed to reach " + url + " — " + e.message);
        tryNext(i + 1);
      });
    }
    tryNext(0);
  }
};
