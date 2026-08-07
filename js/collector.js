// ============================================================
// CAPTCHA 数据收集器 — 同时支持本地服务器和 Google Apps Script
// ============================================================
// 优先 POST 到 GOOGLE_ENDPOINT，如果未配置则 POST 到 /feedback（本地 server.py）
// 都失败则 fallback 到 console.log
// ============================================================

// ============ 配置：改为你的 Google Apps Script Web App URL ============
var GOOGLE_ENDPOINT = "https://script.google.com/macros/s/AKfycbz79gawuSxZEplillsJlqmsBKb9G2Ka8-MAE0enCFnkvcb4naIb7HAhorBDTbnJ9W9I/exec";  // 例: "https://script.google.com/macros/s/xxxxx/exec"
// =====================================================================

var DataCollector = {
  // 缓存当前 CAPTCHA 的逐题数据（页面自己往里 push）
  trials: [],
  feedback: null,

  // 提交完整结果（在 showResult 里调用）
  submitResult: function(page, totalScore, passed) {
    var payload = {
      page: page,
      type: "result",
      totalScore: totalScore,
      passed: passed,
      trials: DataCollector.trials,
      feedback: DataCollector.feedback,
      userAgent: navigator.userAgent
    };
    DataCollector._send(payload);
  },

  // 提交反馈（在 submitFB 里调用，可以单独提交）
  submitFeedback: function(page, feedback) {
    DataCollector.feedback = feedback;
    var payload = {
      page: page,
      type: "feedback_only",
      feedback: feedback,
      trials: DataCollector.trials,
      userAgent: navigator.userAgent
    };
    DataCollector._send(payload);
  },

  // 内部发送逻辑
  _send: function(payload) {
    var body = JSON.stringify(payload);
    var urls = [];
    if (GOOGLE_ENDPOINT) urls.push(GOOGLE_ENDPOINT);
    urls.push("/feedback");  // 本地 server.py

    function tryNext(i) {
      if (i >= urls.length) {
        console.log("DataCollector (offline — copy this):", body);
        return;
      }
      fetch(urls[i], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body
      }).then(function(r) {
        if (r.ok) {
          console.log("DataCollector: saved to " + urls[i]);
        } else {
          tryNext(i + 1);
        }
      }).catch(function() {
        tryNext(i + 1);
      });
    }
    tryNext(0);
  }
};
