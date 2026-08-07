// ============================================================
// 反馈 UI 注入器 — 给任意 CAPTCHA 页添加反馈区 + 重做按钮
// 用法: 页面底部加 <script src="../../js/feedback-ui.js"></script>
// 页面需提供 DataCollector 和 resultShown(trials,totalScore,passed) 回调
// ============================================================
(function() {
  // 等 DOM 就绪后查找结果框，注入反馈 UI
  function inject() {
    var resultBox = document.querySelector('.result-box');
    var optionsRow = document.querySelector('.options');
    if (!resultBox || !optionsRow) { setTimeout(inject, 200); return; }

    if (document.getElementById('fb-injected')) return;
    var fb = document.createElement('div');
    fb.id = 'fb-injected';
    fb.innerHTML = `
      <div class="retake-row" id="retake-row"></div>
      <div class="feedback-section" id="fb-section" style="display:none">
        <h4>📝 反馈 (全部选填)</h4>
        <div class="fb-item"><div class="feedback-row"><label>🖼️ 图案:</label>
        ${[1,2,3,4,5].map(v=>'<label class="radio-label"><input type="radio" name="fb-img" value="'+v+'">'+v+'</label>').join('')}
        <span class="radio-hint">1=看不出 5=极明显</span></div>
        <textarea class="feedback-text" placeholder="图案效果建议…"></textarea></div>
        <div class="fb-item"><div class="feedback-row"><label>🔘 选项:</label>
        ${[1,2,3,4,5].map(v=>'<label class="radio-label"><input type="radio" name="fb-opt" value="'+v+'">'+v+'</label>').join('')}
        <span class="radio-hint">1=不合理 5=合理</span></div>
        <textarea class="feedback-text" placeholder="选项设计建议…"></textarea></div>
        <div class="fb-item"><div class="feedback-row"><label>📏 标准:</label>
        ${[1,2,3,4,5].map(v=>'<label class="radio-label"><input type="radio" name="fb-score" value="'+v+'">'+v+'</label>').join('')}
        <span class="radio-hint">1=不合理 5=合理</span></div>
        <textarea class="feedback-text" placeholder="评分标准建议…"></textarea></div>
        <div class="fb-item"><div class="feedback-row"><label>🤖 AI:</label>
        ${[1,2,3,4,5].map(v=>'<label class="radio-label"><input type="radio" name="fb-ai" value="'+v+'">'+v+'</label>').join('')}
        <span class="radio-hint">1=易攻破 5=极难</span></div>
        <textarea class="feedback-text" placeholder="AI攻破分析…"></textarea></div>
        <button class="submit-btn" id="fb-submit">提交反馈</button><span class="thanks" id="fb-thx">✓ 感谢!</span>
      </div>`;

    // 注入 CSS
    if (!document.getElementById('fb-css')) {
      var css = document.createElement('style'); css.id = 'fb-css';
      css.textContent = `
        .retake-row{display:flex;gap:6px;justify-content:center;margin-top:10px;flex-wrap:wrap}
        .retake-btn{padding:5px 12px;border:1px solid #475569;border-radius:5px;background:#0f172a;color:#94a3b8;cursor:pointer;font-size:11px}
        .retake-btn:hover{border-color:#60a5fa;color:#e2e8f0}
        .feedback-section{margin-top:18px;padding:14px;background:#0f172a;border-radius:10px}
        .feedback-section h4{font-size:13px;margin-bottom:8px}
        .fb-item{margin-bottom:10px;padding:8px;background:#1a2230;border-radius:6px}
        .feedback-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:4px;align-items:center}
        .feedback-row label{font-size:11px;color:#94a3b8;white-space:nowrap;min-width:40px}
        .radio-label{font-size:10px;color:#64748b;cursor:pointer;display:inline-flex;align-items:center;gap:1px}
        .radio-label input{accent-color:#60a5fa;cursor:pointer;margin:0}
        .radio-hint{font-size:9px;color:#475569;margin-left:2px}
        .feedback-text{width:100%;padding:5px 7px;background:#0f172a;border:1px solid #334155;border-radius:5px;color:#94a3b8;font-size:10px;resize:vertical;min-height:28px;font-family:inherit}
        .submit-btn{padding:7px 18px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:11px;margin-top:6px}
        .submit-btn:hover{background:#1d4ed8}.thanks{color:#4ade80;font-size:11px;margin-left:8px;display:none}`;
      document.head.appendChild(css);
    }

    resultBox.parentNode.insertBefore(fb, resultBox.nextSibling);

    // 提交反馈
    document.getElementById('fb-submit').onclick = function() {
      var getRadio = function(name) {
        var r = document.querySelector('input[name="'+name+'"]:checked');
        return r ? parseInt(r.value) : 0;
      };
      var texts = document.querySelectorAll('#fb-section .feedback-text');
      var fbData = {
        img:  {rating: getRadio('fb-img'),  comment: texts[0]?.value||''},
        opt:  {rating: getRadio('fb-opt'),  comment: texts[1]?.value||''},
        score:{rating: getRadio('fb-score'),comment: texts[2]?.value||''},
        ai:   {rating: getRadio('fb-ai'),   comment: texts[3]?.value||''}
      };
      if (typeof DataCollector !== 'undefined') {
        DataCollector.submitFeedback(window._captchaPage||'unknown', fbData);
      }
      texts.forEach(function(t){t.value='';});
      document.querySelectorAll('#fb-section input[type=radio]').forEach(function(r){r.checked=false;});
      document.getElementById('fb-thx').style.display='inline';
      setTimeout(function(){document.getElementById('fb-thx').style.display='none';},3000);
    };

    // 暴露重做和显示反馈的 API
    window._captchaShowFeedback = function() {
      document.getElementById('fb-section').style.display='block';
    };
    window._captchaSetRetake = function(count, retryFn) {
      var row = document.getElementById('retake-row');
      row.innerHTML = '';
      for (var i = 0; i < count; i++) {
        (function(idx) {
          var btn = document.createElement('button');
          btn.className = 'retake-btn';
          btn.textContent = '第'+(idx+1)+'题';
          btn.onclick = function() { retryFn(idx); };
          row.appendChild(btn);
        })(i);
      }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
})();
