// ============================================================
// Google Apps Script — CAPTCHA 数据收集后端
// 使用方法见下方注释
// ============================================================
// 1. 打开 https://sheets.google.com 创建新表格
// 2. 记录 Sheet 名称（默认 Sheet1）和浏览器 URL 中的 spreadsheetId
// 3. 扩展程序 → Apps Script，粘贴此代码
// 4. 部署 → 新部署 → Web 应用 → 任何人可访问 → 部署
// 5. 复制生成的 URL，填入 ../js/collector.js 的 ENDPOINT
// ============================================================

var SHEET_NAME = "Sheet1"; // 修改为你的表格名称

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    // 自动创建表头（如果表格为空）
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "时间", "页面", "类型", "得分", "通过",
        "第1题_答案", "第1题_预期", "第1题_用时ms", "第1题_类型",
        "第2题_答案", "第2题_预期", "第2题_用时ms", "第2题_类型",
        "第3题_答案", "第3题_预期", "第3题_用时ms", "第3题_类型",
        "第4题_答案", "第4题_预期", "第4题_用时ms", "第4题_类型",
        "第5题_答案", "第5题_预期", "第5题_用时ms", "第5题_类型",
        "img_评分", "img_建议", "opt_评分", "opt_建议",
        "score_评分", "score_建议", "ai_评分", "ai_建议",
        "总用时ms", "userAgent"
      ]);
    }

    var row = [new Date(), data.page, data.type || "result", data.totalScore || "", data.passed || ""];

    // 逐题数据
    var trials = data.trials || [];
    for (var i = 0; i < 5; i++) {
      if (i < trials.length) {
        row.push(trials[i].answer, trials[i].expected, trials[i].rt, trials[i].trialType);
      } else {
        row.push("", "", "", "");
      }
    }

    // 反馈数据
    var fb = data.feedback || {};
    row.push(
      (fb.img || {}).rating || "", (fb.img || {}).comment || "",
      (fb.opt || {}).rating || "", (fb.opt || {}).comment || "",
      (fb.score || {}).rating || "", (fb.score || {}).comment || "",
      (fb.ai || {}).rating || "", (fb.ai || {}).comment || ""
    );

    // 总用时
    if (data.trials && data.trials.length) {
      var maxRt = Math.max.apply(null, data.trials.map(function(t) { return t.rt || 0; }));
      row.push(maxRt);
    } else {
      row.push("");
    }
    row.push(data.userAgent || "");

    sheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({status: "ok"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("CAPTCHA feedback collector is running. POST data to this URL.")
    .setMimeType(ContentService.MimeType.TEXT);
}
