// ============================================================
// Google Apps Script — CAPTCHA 数据收集后端
// 部署后务必: 部署 → 新部署 → 网页应用 → 任何人可访问
// 每次修改代码后需要创建"新部署"（不是"保存"）
// 调试: 左侧菜单 → 执行 → 查看请求日志
// ============================================================

var SHEET_NAME = "Sheet1"; // ← 子 sheet（标签页）名称，不是文档标题

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    // 自动创建表头
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "时间", "页面", "类型", "得分", "通过",
        "第1题答案", "第1题预期", "第1题用时ms", "第1题类型",
        "第2题答案", "第2题预期", "第2题用时ms", "第2题类型",
        "第3题答案", "第3题预期", "第3题用时ms", "第3题类型",
        "第4题答案", "第4题预期", "第4题用时ms", "第4题类型",
        "第5题答案", "第5题预期", "第5题用时ms", "第5题类型",
        "img评分", "img建议", "opt评分", "opt建议",
        "score评分", "score建议", "ai评分", "ai建议",
        "总用时ms", "UserAgent"
      ]);
    }

    var trials = data.trials || [];
    var fb = data.feedback || {};

    var row = [
      new Date(), data.page, data.type || "result", data.totalScore || "", data.passed || ""
    ];

    for (var i = 0; i < 5; i++) {
      if (i < trials.length) {
        row.push(trials[i].answer, trials[i].expected, trials[i].rt, trials[i].trialType);
      } else {
        row.push("", "", "", "");
      }
    }

    row.push(
      (fb.img || {}).rating || "", (fb.img || {}).comment || "",
      (fb.opt || {}).rating || "", (fb.opt || {}).comment || "",
      (fb.score || {}).rating || "", (fb.score || {}).comment || "",
      (fb.ai || {}).rating || "", (fb.ai || {}).comment || ""
    );

    if (trials.length) {
      row.push(Math.max.apply(null, trials.map(function(t) { return t.rt || 0; })));
    } else { row.push(""); }
    row.push(data.userAgent || "");

    sheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({status:"ok"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    // 错误也返回 JSON，方便前端排查
    return ContentService.createTextOutput(JSON.stringify({status:"error",message:err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("CAPTCHA collector is running. POST data to this URL.")
    .setMimeType(ContentService.MimeType.TEXT);
}
