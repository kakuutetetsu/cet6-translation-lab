'use strict';

(() => {
  const questions = window.TRANSLATION_QUESTIONS;
  const core = window.TranslationCore;
  const byId = Object.fromEntries(questions.map(q => [q.id, q]));
  const KEY = 'cet6-translation-lab-v1';
  const main = document.querySelector('#main');
  const titles = {typing:'中文翻译', puzzle:'词块拼句', challenge:'按套题闯关', review:'错题重练'};
  const sets = window.TRANSLATION_SETS;
  const setByKey = Object.fromEntries(sets.map(s => [s.key, s]));
  const setLabel = key => { const s = setByKey[key]; return s.year + '年' + s.month + '月 · 第' + s.examSet + '套'; };
  const hints = {
    '3-1':['the living environment', '主语 Chinese cities；完成时 have developed / has improved。'],
    '3-2':['high-quality urban development', '用 suited to 表达“适合”；将城市功能与治理水平拆成一句。'],
    '3-3':['restore urban ecosystems / municipal facilities', '可拆为四句，依次描述修复、改造、基础设施和最终目标；用 At the same time 衔接。'],
    '2-1':["people’s living standards / quality of life", '用 As 引出背景，urban residents 作主句主语。'],
    '2-2':['pay greater attention to / public facilities', '用 in order to 引出目的；construction and improvement 表达建设与改进。'],
    '2-3':['recreation and social activities', '用 By + 动名词引出方式；主句使用 have provided。'],
    '2-4':['government-funded fitness equipment', '可拆为两句，先用 can be seen 描述现象，再说明改善与美化效果。'],
    '1-1':['the global market / overseas consumers', '用 have entered 和 become 连接两个结果，increasingly 表达“日益”。'],
    '1-2':['cultural product exports / international influence', '用 As 引出背景，has ranked 描述持续排名，另起一句描述企业、产品和品牌。'],
    '1-3':['overseas sales / year after year', '用 Data show that 引出宾语从句；have increased 表达持续增长。'],
    '1-4':['overseas market share / global influence', '用 to encourage and support 表达目的，enter、expand、enhance 构成并列动作。']
  };
  let state = {theme:'dark', page:'home', records:{}, drafts:{}, run:null, hideEnglish:true, favoritesOnly:false};
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && typeof saved === 'object') {
      state = {...state, ...saved};
      if (!state.records || typeof state.records !== 'object') state.records = {};
      if (!state.drafts || typeof state.drafts !== 'object') state.drafts = {};
      if (state.run && (!Array.isArray(state.run.ids) || !state.run.ids.length || !state.run.ids.every(id => byId[id]) || !Number.isInteger(state.run.pos) || !byId[state.run.ids[state.run.pos]] || !titles[state.run.mode])) state.run = null;
    }
  } catch { /* A missing or invalid save starts a fresh session. */ }

  const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const record = id => state.records[id] ||= {attempts:0, practiced:false, mastered:false, review:false, favorite:false};
  const current = () => byId[state.run.ids[state.run.pos]];
  const isPuzzle = () => state.run.mode === 'puzzle';
  const draftKey = () => `${current().id}:${isPuzzle() ? state.run.split : state.run.mode}`;
  function freshDraft() {
    return {text:'', selected:[], order:[], hint:0, assisted:false, checked:false, eligible:false, counted:false, reference:false, feedback:'', done:false};
  }
  function draft() {
    const value = state.drafts[draftKey()] ||= freshDraft();
    return value;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch { document.querySelector('#storage-warning').hidden = false; }
  }
  function theme() {
    document.body.classList.toggle('light', state.theme === 'light');
    document.querySelector('#theme').textContent = state.theme === 'light' ? '☾ 深色' : '☼ 浅色';
  }
  function show(page) {
    state.page = page;
    render();
    save();
    window.scrollTo(0, 0);
    main.focus({preventScroll:true});
  }
  function start(mode, ids = questions.map(q => q.id)) {
    const suffix = mode === 'puzzle' ? 'phrase' : mode;
    for (const id of ids) {
      const key = `${id}:${suffix}`;
      if (state.drafts[key]?.done) state.drafts[key] = freshDraft();
    }
    state.run = {mode, ids, pos:0, split:'phrase', completed:[]};
    show('practice');
  }
  function stats() {
    const records = questions.map(q => record(q.id));
    return {practiced:records.filter(r => r.practiced).length, mastered:records.filter(r => r.mastered).length, review:records.filter(r => r.review).length};
  }
  function renderHome() {
    const count = stats();
    const entries = [
      ['typing','01','中文翻译','从中文出发，独立写出英文表达'],
      ['puzzle','02','词块拼句','短语与单词两种模式，重建句子'],
      ['choose','03','按套题闯关','按顺序完成一整套翻译'],
      ['overview','04','翻译总览','中英对照，回顾与收藏'],
      ['review','05','错题重练',`${count.review} 道待复习，巩固尚未熟悉的表达`],
      ['analysis','06','逐句拆解','直接阅读句子主干、词汇与翻译思路']
    ];
    main.innerHTML = `<div class="hero"><div><p class="eyebrow">RECALL. TRANSLATE. REMEMBER.</p><h1>让理解，成为<br>自己的英文表达。</h1><p class="muted">2023—2026 翻译题库 · ${sets.length} 套翻译 · ${questions.length} 道练习</p></div><aside class="card"><div class="stats-title"><b>学习进度</b><span>${count.practiced} / ${questions.length} 已练习</span></div><div class="stats"><div><strong>${count.mastered}</strong><small>已掌握</small></div><div><strong>${count.review}</strong><small>待复习</small></div><div><strong>${Math.round(count.practiced / questions.length * 100)}<small>%</small></strong><small>练习覆盖率</small></div></div><progress aria-label="学习进度" max="${questions.length}" value="${count.practiced}"></progress></aside></div><div class="menu">${entries.map(([action, n, title, subtitle]) => `<button data-action="${action}" class="${n === '01' ? 'featured' : ''}"><span class="number">${n}</span><span><b>${title}</b><small>${subtitle}</small></span><span class="arrow">↗</span></button>`).join('')}</div>${state.run ? `<button class="resume quiet" data-action="resume">继续上次练习 → ${titles[state.run.mode]} · 第 ${state.run.pos + 1} / ${state.run.ids.length} 题</button>` : ''}<details class="source-note"><summary>参考译文说明</summary><p>新增材料来自《精翻 - 副本.docx》：适度精准翻译版，保留基础表达，不刻意追求复杂句式。参考译文并非官方标准答案。</p><p>在简易版基础上补足关键信息，优先使用常见词汇和清晰句式；中文长句可以适当拆分，必要时使用更准确的主题词。</p></details><p class="section-label">全部套题</p><div class="sets">${setCards()}</div>`;
  }
  function setCards() {
    return sets.map(s => `<button data-set="${s.key}"><small>${setLabel(s.key)}</small><b>${s.topic}</b><small>${questions.filter(q => q.set === s.key).length} 道练习　→</small></button>`).join('');
  }
  function renderTiles() {
    const d = draft();
    const chunks = core.chunks(current().english, state.run.split);
    if (d.order.length !== chunks.length) d.order = core.shuffle(chunks.length);
    const tile = (id, selected) => `<button class="tile" lang="en" data-tile="${id}" data-selected="${selected}" aria-label="${selected ? '撤回' : '选择'} ${escape(chunks[id])}" ${!selected && d.selected.includes(id) ? 'disabled' : ''}>${escape(chunks[id])}</button>`;
    return `<div class="row"><label for="split">拼句模式</label><select id="split"><option value="phrase" ${state.run.split === 'phrase' ? 'selected' : ''}>短语拼句</option><option value="word" ${state.run.split === 'word' ? 'selected' : ''}>单词拼句</option></select></div><div class="answer tiles" aria-label="已选词块">${d.selected.length ? d.selected.map(id => tile(id, true)).join('') : '<span class="muted">点击下方词块组成句子，点击已选词块可撤回。</span>'}</div><p class="muted">待选词块 · 已选 ${d.selected.length} / ${chunks.length}</p><div class="tiles" aria-label="待选词块">${d.order.map(id => tile(id, false)).join('')}</div>`;
  }
  function difference() {
    const d = draft();
    if (!d.checked || d.match) return '';
    const diff = core.diff(d.submitted, current().english);
    const line = (words, matched) => words.map((word, i) => matched.has(i) ? escape(word) : `<mark>${escape(word)}</mark>`).join(' ');
    return `<p class="muted">高亮表示与参考表达的用词或顺序差异，请结合语义自行判断。</p><small>你的表达</small><p class="diff" lang="en">${line(diff.left, diff.matchedLeft)}</p><small>参考表达中的差异</small><p class="diff" lang="en">${line(diff.right, diff.matchedRight)}</p>`;
  }
  function renderPractice() {
    const q = current();
    const d = draft();
    const r = record(q.id);
    const run = state.run;
    const completed = run.completed || [];
    const questionHints = hints[`${q.set}-${q.number}`] || [q.analysis[0].vocabulary[0][0], q.analysis[0].backbone[0]];
    const hintText = [`英文首词　${q.english.split(' ')[0]}`, `关键短语　${questionHints[0]}`, questionHints[1]];
    main.innerHTML = `<div class="row practice-header"><h1>${titles[run.mode]}</h1><button data-action="favorite" aria-pressed="${r.favorite}">${r.favorite ? '★ 已收藏' : '☆ 收藏'}</button></div>${run.mode !== 'review' ? `<div class="row practice-scope"><label for="practice-set">练习范围</label><select id="practice-set"><option value="">全部套题</option>${sets.map(s => `<option value="${s.key}" ${run.ids.every(id => byId[id].set === s.key) ? 'selected' : ''}>${setLabel(s.key)} · ${s.topic}</option>`).join('')}</select></div>` : ''}<div class="row progress-meta"><span>${setLabel(q.set)} · 原题第${q.number}题</span><span>第 ${run.pos + 1} / ${run.ids.length} 题 · 本轮已完成 ${completed.length}</span></div><progress aria-label="本轮完成进度" max="${run.ids.length}" value="${completed.length}"></progress><article class="card prompt"><small>中文原文</small><h2>${escape(q.chinese)}</h2></article>${isPuzzle() ? renderTiles() : `<label for="typing">你的英文翻译</label><textarea id="typing" lang="en" spellcheck="false" autocomplete="off" maxlength="12000" placeholder="试着用自己的英文，完整表达这段中文……">${escape(d.text)}</textarea><small>忽略大小写、空格及标点差异。其他表达可对照参考译文自评。</small>`}<div class="actions"><button data-action="hint" ${d.hint >= 3 ? 'disabled' : ''}>提示 ${Math.min(d.hint + 1, 3)}</button><button data-action="reset">重置本题</button><button data-action="reference">查看参考答案</button><button data-action="check" class="primary">检查答案</button></div>${d.hint ? `<div class="hint">${hintText.slice(0, d.hint).map(text => `<div>${escape(text)}</div>`).join('')}</div>` : ''}<div role="status" aria-live="polite">${d.feedback ? `<p class="feedback">${escape(d.feedback)}</p>` : ''}</div>${d.checked || d.reference ? analysisMarkup(q, !!d.analysisOpen) : '<p class="muted">检查答案或查看参考答案后，可展开逐句拆解。</p>'}${d.reference ? `<section class="card reference"><small>英文参考译文</small><p lang="en">${escape(q.english)}</p>${difference()}</section>` : ''}<div class="status-actions"><button data-action="mastered" aria-pressed="${r.mastered}" ${!d.eligible && !r.mastered ? 'disabled' : ''}>${r.mastered ? '✓ 已掌握' : '自评已掌握'}</button><button data-action="review-mark" aria-pressed="${r.review}">${r.review ? '↻ 已加入复习' : '需要复习'}</button><span class="muted">练习 ${r.attempts} 次${d.assisted ? ' · 本次已参考提示或译文' : ''}</span></div><p><small>${d.eligible ? '请自行判断语义与语法，确认后可标记掌握。' : '独立作答并检查后，可自评掌握；参考提示或译文后，请重置再试。'}</small></p><div class="row navigation"><button data-action="prev" ${run.pos === 0 ? 'disabled' : ''}>← 上一题</button><button data-action="next" ${run.mode === 'challenge' && !d.done ? 'disabled' : ''}>${run.pos === run.ids.length - 1 ? '完成本轮' : '下一题 →'}</button></div>`;
  }
  function analysisMarkup(q, expanded = false) {
    const list = items => `<ul>${items.map(text => `<li>${escape(text)}</li>`).join('')}</ul>`;
    return `<section class="analysis-wrap"><button data-analysis="${q.id}" aria-expanded="${expanded}" aria-controls="analysis-${q.id}">${expanded ? '收起逐句拆解' : '逐句拆解'}</button><div id="analysis-${q.id}" class="analysis" ${expanded ? '' : 'hidden'}>${q.analysis.map((sentence, index) => `<article class="card analysis-sentence"><h2>第 ${index + 1} 句</h2><p class="analysis-original" lang="en">${escape(sentence.english)}</p><h3>句子主干分析</h3>${list(sentence.backbone)}<h3>从句与修饰成分</h3>${list(sentence.modifiers)}<h3>重点词汇与固定搭配</h3><table><thead><tr><th scope="col">英文表达</th><th scope="col">中文意思与用法</th></tr></thead><tbody>${sentence.vocabulary.map(([en, cn]) => `<tr><td lang="en">${escape(en)}</td><td>${escape(cn)}</td></tr>`).join('')}</tbody></table><h3>逐段翻译与语序分析</h3><ul class="segments">${sentence.segments.map(([en, cn]) => `<li><strong lang="en">${escape(en)}</strong><span>${escape(cn)}</span></li>`).join('')}</ul><p><b>翻译思路</b></p><p>${escape(sentence.order)}</p><h3>为什么这样翻译？</h3>${list(sentence.why)}</article>`).join('')}</div></section>`;
  }
  function renderOverview() {
    const items = questions.filter(q => (!state.favoritesOnly || record(q.id).favorite) && (!state.overviewSet || q.set === Number(state.overviewSet)));
    main.innerHTML = `<div class="row"><h1>翻译总览</h1><button data-action="toggle-english">${state.hideEnglish ? '显示全部英文' : '隐藏全部英文'}</button></div><div class="row"><label for="overview-set">按套题筛选</label><select id="overview-set"><option value="">全部 ${sets.length} 套</option>${sets.map(s => `<option value="${s.key}" ${Number(state.overviewSet) === s.key ? 'selected' : ''}>${setLabel(s.key)} · ${s.topic}</option>`).join('')}</select></div><label><input id="favorites-only" type="checkbox" ${state.favoritesOnly ? 'checked' : ''}> 只看收藏</label>${items.map(q => `<article class="card overview-card"><div class="row"><small>${setLabel(q.set)} · 第${q.number}题</small><button data-favorite="${q.id}" aria-pressed="${record(q.id).favorite}">${record(q.id).favorite ? '★ 已收藏' : '☆ 收藏'}</button></div><p>${escape(q.chinese)}</p><p class="english" lang="en" id="en-${q.id}" ${state.hideEnglish ? 'hidden' : ''}>${escape(q.english)}</p><div class="row"><button data-toggle="${q.id}">${state.hideEnglish ? '显示英文' : '隐藏英文'}</button><button data-practice="${q.id}">练习这题 →</button></div>${analysisMarkup(q)}</article>`).join('') || '<p class="empty muted">还没有收藏的题目。</p>'}`;
  }
  function render() {
    theme();
    if (state.page === 'practice' && state.run) renderPractice();
    else if (state.page === 'choose') main.innerHTML = `<p class="eyebrow">TRANSLATION CHALLENGE</p><h1>选择一套，完整练习。</h1><p class="muted">依次作答并检查，再对照译文继续下一题。</p><div class="sets">${setCards()}</div>`;
    else if (state.page === 'overview') renderOverview();
    else if (state.page === 'empty') main.innerHTML = '<div class="empty"><h1>当前没有待复习题目</h1><p class="muted">使用提示、查看答案或检查有差异的表达后，题目会加入复习。</p><button data-action="typing" class="primary">开始中文翻译</button></div>';
    else if (state.page === 'finished') main.innerHTML = `<div class="empty"><p class="eyebrow">SESSION COMPLETE</p><h1>这一轮，练习完成。</h1><p class="muted">已检查 ${state.lastCompleted || 0} 道题 · 累计掌握 ${stats().mastered} / ${questions.length} 道</p><div class="actions"><button data-action="home">返回首页</button><button data-action="review" class="primary">复习待巩固的表达</button></div></div>`;
    else renderHome();
  }
  function changed(d) {
    d.analysisOpen = false;
    d.checked = false;
    d.eligible = false;
    d.reference = false;
    d.feedback = '';
    d.done = false;
    state.run.completed = (state.run.completed || []).filter(id => id !== current().id);
  }
  function assist() {
    const d = draft();
    d.assisted = true;
    d.eligible = false;
    record(current().id).review = true;
    record(current().id).mastered = false;
  }
  function check() {
    const d = draft();
    const q = current();
    const r = record(q.id);
    const chunks = core.chunks(q.english, state.run.split);
    const text = isPuzzle() ? d.selected.map(i => chunks[i]).join(' ') : d.text;
    if (!core.normalize(text)) { d.feedback = '请先写出翻译或选择词块。'; return; }
    if (d.checked) return;
    if (!d.counted) { r.attempts++; d.counted = true; }
    r.practiced = true;
    d.match = core.normalize(text) === core.normalize(q.english);
    d.eligible = !d.assisted && (!isPuzzle() || d.match);
    d.submitted = text;
    d.checked = true;
    d.reference = true;
    d.done = true;
    state.run.completed = [...new Set([...(state.run.completed || []), q.id])];
    if (!d.match || d.assisted) { r.review = true; r.mastered = false; }
    d.feedback = d.match ? '与参考译文一致。请结合本次回忆情况，自评是否掌握。' : isPuzzle() ? '词块顺序或数量与参考译文有差异，已加入复习。请对照下方表达。' : '你的表达与参考译文有差异，已暂存到复习。翻译允许多种表达，请对照语义与语法自评。';
    if (d.assisted) d.feedback += ' 本次使用过提示或参考译文，请重置后独立尝试。';
    // The submitted attempt stays eligible, but editing after exposure requires a reset.
    d.assisted = true;
  }
  function navigate(delta) {
    const run = state.run;
    if (delta > 0 && run.mode === 'challenge' && !draft().done) return;
    if (run.pos + delta >= run.ids.length) {
      state.lastCompleted = (run.completed || []).length;
      state.run = null;
      show('finished');
    } else {
      run.pos = Math.max(0, run.pos + delta);
      show('practice');
    }
  }
  main.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    const data = button.dataset;
    if (data.set) return start('challenge', questions.filter(q => q.set === Number(data.set)).map(q => q.id));
    if (data.analysis) {
      const panel = document.getElementById(`analysis-${data.analysis}`);
      panel.hidden = !panel.hidden;
      button.setAttribute('aria-expanded', String(!panel.hidden));
      button.textContent = panel.hidden ? '逐句拆解' : '收起逐句拆解';
      if (state.page === 'practice') { draft().analysisOpen = !panel.hidden; save(); }
      return;
    }
    if (data.practice) return start('typing', [data.practice]);
    if (data.favorite) { record(data.favorite).favorite = !record(data.favorite).favorite; renderOverview(); save(); return; }
    if (data.toggle) {
      const english = document.getElementById(`en-${data.toggle}`);
      english.hidden = !english.hidden;
      button.textContent = english.hidden ? '显示英文' : '隐藏英文';
      return;
    }
    if (data.tile !== undefined) {
      const d = draft();
      const id = Number(data.tile);
      d.selected = data.selected === 'true' ? d.selected.filter(i => i !== id) : [...d.selected, id];
      changed(d);
      renderPractice();
      save();
      return;
    }
    switch (data.action) {
      case 'home': return show('home');
      case 'typing': case 'puzzle': return start(data.action);
      case 'analysis': return show('overview');
      case 'choose': case 'overview': return show(data.action);
      case 'resume': return show('practice');
      case 'review': {
        const ids = questions.filter(q => record(q.id).review).map(q => q.id);
        return ids.length ? start('review', ids) : show('empty');
      }
      case 'toggle-english': state.hideEnglish = !state.hideEnglish; break;
      case 'favorite': record(current().id).favorite = !record(current().id).favorite; break;
      case 'review-mark': record(current().id).review = !record(current().id).review; if (record(current().id).review) record(current().id).mastered = false; break;
      case 'mastered': {
        const r = record(current().id);
        if (!draft().eligible && !r.mastered) return;
        r.mastered = !r.mastered;
        if (r.mastered) r.review = false;
        break;
      }
      case 'hint': assist(); draft().hint = Math.min(3, draft().hint + 1); break;
      case 'reference': assist(); draft().reference = true; break;
      case 'reset': changed(draft()); state.drafts[draftKey()] = freshDraft(); break;
      case 'check': check(); break;
      case 'prev': return navigate(-1);
      case 'next': return navigate(1);
      default: return;
    }
    render();
    save();
  });
  main.addEventListener('input', event => {
    if (event.target.id !== 'typing') return;
    const d = draft();
    d.text = event.target.value;
    if (d.checked || d.reference || d.feedback) {
      const selection = event.target.selectionStart;
      changed(d);
      renderPractice();
      const input = document.querySelector('#typing');
      input.focus();
      input.setSelectionRange(selection, selection);
    }
    save();
  });
  main.addEventListener('change', event => {
    if (event.target.id === 'practice-set') return start(state.run.mode, questions.filter(q => !event.target.value || q.set === Number(event.target.value)).map(q => q.id));
    if (event.target.id === 'split') state.run.split = event.target.value;
    else if (event.target.id === 'overview-set') state.overviewSet = event.target.value;
    else if (event.target.id === 'favorites-only') state.favoritesOnly = event.target.checked;
    else return;
    render();
    save();
  });
  document.querySelector('#home').onclick = () => show('home');
  document.querySelector('#theme').onclick = () => { state.theme = state.theme === 'light' ? 'dark' : 'light'; theme(); save(); };
  render();
})();
