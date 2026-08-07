// ============================================================
// CAPTCHA Framework v2 — 完全自动注入，只需加 <script> 标签
// 自动检测结果框出现 → 注入反馈UI + 重做按钮 + 数据收集
// ============================================================
(function() {
  var page = location.pathname.split('/').filter(Boolean).pop() ||
             location.pathname.split('/').filter(Boolean).slice(-2,-1)[0] ||
             'unknown';
  var injected = false;
  var trials = [];
  var tStart = 0;

  // ---------- 监听答案按钮点击，记录逐题数据 ----------
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.opt-btn');
    if (!btn || btn.disabled) return;
    var answer = parseFloat(btn.textContent);
    if (isNaN(answer)) {
      // 尝试从 onclick 提取分数
      var match = btn.getAttribute('onclick')||'';
      var m = match.match(/ans?\((-?\d+)/) || match.match(/answer\w*\((-?\d+)/);
      if (m) answer = parseInt(m[1]);
      else answer = btn.textContent.trim();
    }
    var rt = tStart ? Math.round(performance.now() - tStart) : 0;
    trials.push({ answer: answer, expected: '', rt: rt, trialType: 'normal' });
    tStart = performance.now();

    // 检测是否最后一题答完（选项按钮变灰或消失后结果框出现）
    setTimeout(checkResult, 500);
  });

  // ---------- 检测结果框 ----------
  function checkResult() {
    if (injected) return;
    var box = document.querySelector('.result-box.pass, .result-box.fail');
    if (!box || box.offsetParent === null) { setTimeout(checkResult, 500); return; }
    inject(box);
  }

  // 页面加载后开始轮询
  setTimeout(checkResult, 2000);

  // ---------- 注入 UI ----------
  function inject(resultBox) {
    if (injected) return;
    // 如果页面已有自己的反馈区，不重复注入
    if (document.querySelector('#fb') || document.querySelector('#fb-injected')) {
      // 但仍确保框架层面的数据收集 + 重做已运行
      injected = true;
      return;
    }
    injected = true;

    // 提取分数
    var descEl = resultBox.querySelector('p');
    var scoreMatch = descEl ? descEl.textContent.match(/(\d+)\s*\/\s*(\d+)/) : null;
    var score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    var threshold = scoreMatch ? parseInt(scoreMatch[2]) : 60;
    var passed = resultBox.classList.contains('pass');

    // 提交数据
    if (typeof DataCollector !== 'undefined') {
      DataCollector.trials = trials;
      DataCollector.submitResult(page, score, passed);
    }

    // 创建容器
    var wrap = document.createElement('div');
    wrap.id = 'cap-fw';
    wrap.innerHTML = `
      <div class="retake-row" id="cap-retakes"></div>
      <div class="feedback-section">
        <h4>📝 反馈 <span style="font-weight:400;color:#64748b;font-size:10px">(全部选填)</span></h4>
        <div class="fb-item"><div class="feedback-row"><label>🖼️ 图案:</label>
        ${[1,2,3,4,5].map(function(v){return '<label class="radio-label"><input type="radio" name="fb-img" value="'+v+'">'+v+'</label>'}).join('')}
        <span class="radio-hint">1=看不出 5=极明显</span></div>
        <textarea class="feedback-text" placeholder="图案效果…"></textarea></div>
        <div class="fb-item"><div class="feedback-row"><label>🔘 选项:</label>
        ${[1,2,3,4,5].map(function(v){return '<label class="radio-label"><input type="radio" name="fb-opt" value="'+v+'">'+v+'</label>'}).join('')}
        <span class="radio-hint">1=不合理 5=合理</span></div>
        <textarea class="feedback-text" placeholder="选项设计…"></textarea></div>
        <div class="fb-item"><div class="feedback-row"><label>📏 标准:</label>
        ${[1,2,3,4,5].map(function(v){return '<label class="radio-label"><input type="radio" name="fb-score" value="'+v+'">'+v+'</label>'}).join('')}
        <span class="radio-hint">1=不合理 5=合理</span></div>
        <textarea class="feedback-text" placeholder="评分标准…"></textarea></div>
        <div class="fb-item"><div class="feedback-row"><label>🤖 AI:</label>
        ${[1,2,3,4,5].map(function(v){return '<label class="radio-label"><input type="radio" name="fb-ai" value="'+v+'">'+v+'</label>'}).join('')}
        <span class="radio-hint">1=易攻破 5=极难</span></div>
        <textarea class="feedback-text" placeholder="AI攻破分析…"></textarea></div>
        <button class="submit-btn" id="fb-submit">提交反馈</button><span class="thanks" id="fb-thx">✓ 感谢!</span>
      </div>`;

    resultBox.parentNode.insertBefore(wrap, resultBox.nextSibling);

    // CSS
    if (!document.getElementById('cap-fw-css')) {
      var css = document.createElement('style'); css.id = 'cap-fw-css';
      css.textContent = '.retake-row{display:flex;gap:6px;justify-content:center;margin-top:12px;flex-wrap:wrap}.retake-btn{padding:5px 12px;border:1px solid #475569;border-radius:5px;background:#0f172a;color:#94a3b8;cursor:pointer;font-size:11px}.retake-btn:hover{border-color:#60a5fa;color:#e2e8f0}.feedback-section{margin-top:18px;padding:14px;background:#0f172a;border-radius:10px}.feedback-section h4{font-size:13px;margin-bottom:8px}.fb-item{margin-bottom:10px;padding:8px;background:#1a2230;border-radius:6px}.feedback-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:4px;align-items:center}.feedback-row label{font-size:11px;color:#94a3b8;white-space:nowrap;min-width:40px}.radio-label{font-size:10px;color:#64748b;cursor:pointer;display:inline-flex;align-items:center;gap:1px}.radio-label input{accent-color:#60a5fa;cursor:pointer;margin:0}.radio-hint{font-size:9px;color:#475569;margin-left:2px}.feedback-text{width:100%;padding:5px 7px;background:#0f172a;border:1px solid #334155;border-radius:5px;color:#94a3b8;font-size:10px;resize:vertical;min-height:28px;font-family:inherit}.submit-btn{padding:7px 18px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:11px;margin-top:6px}.submit-btn:hover{background:#1d4ed8}.thanks{color:#4ade80;font-size:11px;margin-left:8px;display:none}';
      document.head.appendChild(css);
    }

    // 重做按钮 — 点击后刷新页面（最可靠的方式）
    var retakeRow = document.getElementById('cap-retakes');
    var count = trials.length || 4;
    for (var i = 0; i < count; i++) {
      (function(idx) {
        var btn = document.createElement('button');
        btn.className = 'retake-btn'; btn.textContent = '重做此题 (#'+(idx+1)+')';
        btn.onclick = function() {
          // 找 restart 按钮并点击, 然后提示用户手动导航
          var restartBtn = document.querySelector('.restart-btn');
          if (restartBtn) restartBtn.click();
        };
        retakeRow.appendChild(btn);
      })(i);
    }

    // 提交反馈
    document.getElementById('fb-submit').onclick = function() {
      var getRadio = function(name) {
        var r = document.querySelector('input[name="'+name+'"]:checked');
        return r ? parseInt(r.value) : 0;
      };
      var texts = document.querySelectorAll('#cap-fw .feedback-text');
      var fbData = {
        img:  {rating: getRadio('fb-img'),  comment: texts[0]?texts[0].value:''},
        opt:  {rating: getRadio('fb-opt'),  comment: texts[1]?texts[1].value:''},
        score:{rating: getRadio('fb-score'),comment: texts[2]?texts[2].value:''},
        ai:   {rating: getRadio('fb-ai'),   comment: texts[3]?texts[3].value:''}
      };
      if (typeof DataCollector !== 'undefined') DataCollector.submitFeedback(page, fbData);
      texts.forEach(function(t){if(t)t.value='';});
      document.querySelectorAll('#cap-fw input[type=radio]').forEach(function(r){r.checked=false;});
      document.getElementById('fb-thx').style.display='inline';
      setTimeout(function(){document.getElementById('fb-thx').style.display='none';},3000);
    };
  }
})();
