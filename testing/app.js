import { topbar, api, esc, today, uid, toast, fail, trackAI } from '/assets/app.js';
import { DRILLS, METRICS, WORK_ITEMS } from './content.js';

topbar({ brand: 'practise', sub: '质量工程', nav: [{ href: '/', label: '总站' }, { href: '/system-design/', label: '系统设计' }, { href: '/coding/', label: '算法编码' }] });
document.getElementById('work-list').innerHTML = WORK_ITEMS.map(([name, detail]) => `<li><b>${esc(name)}：</b>${esc(detail)}</li>`).join('');
document.getElementById('drill-topic').innerHTML = DRILLS.map(d => `<option value="${d.id}">${esc(d.name)}</option>`).join('');

const empty = () => ({ cases: [], iterations: [], drills: [], stories: [{}, {}] });
let state = empty(), selectedCase = null, selectedIteration = null, selectedDrill = null, selectedStory = 0;
let writeQueue = Promise.resolve(), saveTimer, busy = false;
const $ = id => document.getElementById(id);
const current = (kind, id) => state[kind].find(item => item.id === id);
const field = (label, key, value, rows = 3) => `<div class="field"><label for="f-${key}">${esc(label)}</label><textarea id="f-${key}" data-field="${key}" rows="${rows}">${esc(value || '')}</textarea></div>`;
const short = (label, key, value, type = 'text') => `<div class="field"><label for="f-${key}">${esc(label)}</label><input id="f-${key}" data-field="${key}" type="${type}" value="${esc(value || '')}"></div>`;
function saveNow() {
  clearTimeout(saveTimer);
  const snapshot = structuredClone(state);
  writeQueue = writeQueue.catch(() => {}).then(() => api.put('testing', 'progress', snapshot));
  return writeQueue;
}
function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(() => saveNow().catch(fail), 700); }
function bindFields(root, record, onChange) {
  root.querySelectorAll('[data-field]').forEach(input => input.addEventListener('input', () => {
    record[input.dataset.field] = input.value;
    onChange?.();
    scheduleSave();
  }));
}
async function callAI(action, label, body) {
  return trackAI(label, async () => {
    const response = await fetch(`/api/testing/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `AI 请求失败：${response.status}`);
    return data;
  });
}
function setBusy(value) {
  busy = value;
  document.querySelectorAll('#drill-generate, #drill-evaluate, #story-evaluate, #iteration-evaluate').forEach(button => { button.disabled = value; });
}
function evidenceSignature(item) { const { review, reviewedSignature, ...facts } = item; return JSON.stringify(facts); }

function renderStats() {
  $('evidence-stats').innerHTML = [
    [`${state.cases.length} / 30–50`, '固定评测样本'],
    [state.iterations.length, '规则对比记录'],
    [state.stories.filter(s => s.problem && s.validation).length + ' / 2', '完整项目案例'],
  ].map(([value, label]) => `<div class="card stat"><div class="num">${esc(value)}</div><div class="label">${esc(label)}</div></div>`).join('');
}
function renderCases() {
  $('case-list').innerHTML = state.cases.length ? state.cases.slice().reverse().map(item => `<button class="btn ${item.id === selectedCase ? 'active' : ''}" data-case="${esc(item.id)}"><b>${esc(item.requirement || '未命名样本')}</b><span class="muted small"> · ${esc(item.date || '')}</span></button>`).join('') : '<p class="muted small">尚无样本。从最近一次真实需求开始。</p>';
  $('case-list').querySelectorAll('[data-case]').forEach(button => button.onclick = () => { selectedCase = button.dataset.case; renderCases(); });
  const item = current('cases', selectedCase);
  const editor = $('case-editor');
  if (!item) { editor.innerHTML = '<p class="muted">选择一个样本查看或编辑。</p>'; return; }
  editor.innerHTML = `<h3 style="margin-top:0">样本与人工判定</h3>
    ${short('需求／用例标识（可脱敏）', 'requirement', item.requirement)}
    ${field('验收标准与应覆盖的行为', 'acceptance', item.acceptance)}
    ${field('AI 实际生成了什么', 'aiOutput', item.aiOutput)}
    ${field('漏测、错误预期、重复或不可执行项', 'finding', item.finding)}
    ${field('脚本首次运行、人工修改与失败根因', 'execution', item.execution)}
    ${short('原始证据位置（链接／日志／提交）', 'evidenceRef', item.evidenceRef)}
    <div class="row"><span class="badge warn">工作中积累</span><button class="btn ghost sm" id="case-delete">删除此样本</button></div>`;
  bindFields(editor, item, renderStats);
  $('case-delete').onclick = async () => { if (!confirm('删除这个评测样本？')) return; state.cases = state.cases.filter(x => x.id !== item.id); selectedCase = state.cases.at(-1)?.id || null; try { await saveNow(); renderEvidence(); } catch (error) { fail(error); } };
}
function measure(item, prefix) {
  const n = Number(item[prefix + 'Num']), d = Number(item[prefix + 'Den']);
  if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0 || n < 0) return '待填';
  if (!Number.isInteger(n) || !Number.isInteger(d) || (item.metric !== 'exploration-time' && n > d)) return '检查分子与分母';
  return item.metric === 'exploration-time' ? `${(n / d).toFixed(1)} 分钟/任务` : `${(n / d * 100).toFixed(1)}%（${n}/${d}）`;
}
function renderIterations() {
  $('iteration-list').innerHTML = state.iterations.length ? state.iterations.slice().reverse().map(item => `<button class="btn ${item.id === selectedIteration ? 'active' : ''}" data-iteration="${esc(item.id)}"><b>${esc(item.rule || '未命名对比')}</b><span class="muted small"> · ${esc(item.date || '')}</span></button>`).join('') : '<p class="muted small">先记录基线，再写改动后的复跑结果。</p>';
  $('iteration-list').querySelectorAll('[data-iteration]').forEach(button => button.onclick = () => { selectedIteration = button.dataset.iteration; renderIterations(); });
  const item = current('iterations', selectedIteration);
  const editor = $('iteration-editor');
  if (!item) { editor.innerHTML = '<p class="muted">选择一条规则对比。</p>'; return; }
  editor.innerHTML = `${short('规则／提示词改动', 'rule', item.rule)}${short('版本：前 → 后', 'versions', item.versions)}
    ${field('原问题、你的判断与调整假设', 'hypothesis', item.hypothesis)}
    ${short('固定评测集标识及样本量', 'sampleSet', item.sampleSet)}
    <div class="field"><label for="metric">指标</label><select id="metric">${METRICS.map(m => `<option value="${m.id}" ${m.id === item.metric ? 'selected' : ''}>${esc(m.name)} · ${esc(m.unit)}</option>`).join('')}</select></div>
    <div class="metric-pair"><div class="card"><b>改动前</b>${short('分子／总分钟数', 'beforeNum', item.beforeNum, 'number')}${short('分母／任务数', 'beforeDen', item.beforeDen, 'number')}<p class="small" id="before-value">${esc(measure(item, 'before'))}</p></div>
    <div class="card"><b>改动后</b>${short('分子／总分钟数', 'afterNum', item.afterNum, 'number')}${short('分母／任务数', 'afterDen', item.afterDen, 'number')}<p class="small" id="after-value">${esc(measure(item, 'after'))}</p></div></div>
    ${field('典型失败、根因与未解决的问题', 'failure', item.failure)}
    ${short('复跑报告／提交／日志位置', 'evidenceRef', item.evidenceRef)}
    <div class="row"><span class="badge warn">真实工作数据</span><button class="btn" id="iteration-evaluate" ${busy ? 'disabled' : ''}>AI 审查证据</button><button class="btn ghost sm" id="iteration-delete">删除此对比</button></div>
    ${item.review ? `<div class="card" style="margin-top:14px"><h3 style="margin-top:0">证据审查</h3>${item.reviewedSignature !== evidenceSignature(item) ? '<p class="muted small">记录已修改；这份审查对应上次版本。</p>' : ''}<p>${esc(item.review.summary)}</p><b>已有证据</b><ul>${item.review.strengths.map(x => `<li>${esc(x)}</li>`).join('')}</ul><b>证据缺口</b><ul>${item.review.gaps.map(x => `<li>${esc(x)}</li>`).join('')}</ul><p><b>下一步：</b>${esc(item.review.nextStep)}</p></div>` : ''}`;
  bindFields(editor, item, () => { $('before-value').textContent = measure(item, 'before'); $('after-value').textContent = measure(item, 'after'); });
  $('metric').onchange = () => { item.metric = $('metric').value; $('before-value').textContent = measure(item, 'before'); $('after-value').textContent = measure(item, 'after'); scheduleSave(); };
  $('iteration-evaluate').onclick = async () => {
    if (busy) return;
    if (!item.rule?.trim()) return toast('先写规则改动');
    const signature = evidenceSignature(item);
    setBusy(true);
    try { const data = await callAI('evidence-evaluate', 'AI 正在审查评测证据', { iteration: item, caseCount: state.cases.length }); item.review = data.review; item.reviewedSignature = signature; await saveNow(); toast('证据审查已保存'); if (selectedIteration === item.id) renderIterations(); }
    catch (error) { fail(error); } finally { setBusy(false); }
  };
  $('iteration-delete').onclick = async () => { if (!confirm('删除这条对比？')) return; state.iterations = state.iterations.filter(x => x.id !== item.id); selectedIteration = state.iterations.at(-1)?.id || null; try { await saveNow(); renderEvidence(); } catch (error) { fail(error); } };
}
function renderEvidence() { renderStats(); renderCases(); renderIterations(); }

function renderDrills() {
  $('drill-list').innerHTML = state.drills.length ? state.drills.slice().reverse().map(item => `<button class="btn ${item.id === selectedDrill ? 'active' : ''}" data-drill="${esc(item.id)}"><b>${esc(item.drill.title)}</b><span class="muted small"> · ${esc(DRILLS.find(d => d.id === item.topic)?.name || '')}</span></button>`).join('') : '<p class="muted small">选一个方向，让 AI 出实操题。</p>';
  $('drill-list').querySelectorAll('[data-drill]').forEach(button => button.onclick = () => { selectedDrill = button.dataset.drill; renderDrills(); });
  const item = current('drills', selectedDrill), editor = $('drill-editor');
  if (!item) { editor.innerHTML = '<p class="muted">选择一道题开始练习。</p>'; return; }
  const d = item.drill, ev = item.evaluation;
  editor.innerHTML = `<h3 style="margin-top:0">${esc(d.title)}</h3><p style="white-space:pre-wrap">${esc(d.situation)}</p><div class="card" style="margin-bottom:12px"><b>任务</b><p>${esc(d.task)}</p><b>约束</b><ul>${d.constraints.map(x => `<li>${esc(x)}</li>`).join('')}</ul><b>验收点</b><ul>${d.checks.map(x => `<li>${esc(x)}</li>`).join('')}</ul><details><summary>需要时看提示</summary>${esc(d.hint)}</details></div>
    ${field('你的实现／CI 配置／排障方案', 'answer', item.answer, 12)}${field('本机运行结果、日志与定位过程', 'runNote', item.runNote, 4)}
    <div class="row"><button class="btn primary" id="drill-evaluate" ${busy ? 'disabled' : ''}>AI 评估</button><span class="muted small">输入停止后自动保存；AI 不执行代码。</span></div>
    ${ev ? `<div class="card" style="margin-top:16px"><h3 style="margin-top:0">评估 · ${esc(ev.verdict)}</h3>${item.answer !== item.evaluatedAnswer ? '<p class="muted small">答案已修改；这份评估对应上次提交版本。</p>' : ''}<p>${esc(ev.summary)}</p><b>做得好</b><ul>${ev.strengths.map(x => `<li>${esc(x)}</li>`).join('')}</ul><b>待改进</b><ul>${ev.issues.map(x => `<li>${esc(x)}</li>`).join('')}</ul><b>建议本机验证</b><ul>${ev.missingTests.map(x => `<li>${esc(x)}</li>`).join('')}</ul><p><b>下一步：</b>${esc(ev.nextStep)}</p></div>` : ''}`;
  bindFields(editor, item);
  $('drill-evaluate').onclick = async () => {
    if (busy) return;
    const submitted = item.answer || '';
    if (!submitted.trim()) return toast('先写实现或排障方案');
    setBusy(true);
    try {
      const data = await callAI('evaluate', 'AI 正在评估自动化练习', { drill: d, answer: submitted, runNote: item.runNote || '' });
      item.evaluation = data.evaluation; item.evaluatedAnswer = submitted;
      await saveNow(); toast('评估已保存');
      if (selectedDrill === item.id) renderDrills();
    } catch (error) { fail(error); } finally { setBusy(false); }
  };
}

function renderStory() {
  document.querySelectorAll('[data-story]').forEach(button => button.classList.toggle('primary', Number(button.dataset.story) === selectedStory));
  const item = state.stories[selectedStory], editor = $('story-editor');
  const ev = item.evaluation;
  editor.innerHTML = `${short('案例标题', 'title', item.title)}${field('遇到的问题与业务风险', 'problem', item.problem)}${field('你做出的测试判断', 'judgment', item.judgment)}
    ${field('调整的提示词、规则或流程', 'ruleChange', item.ruleChange)}${field('如何验证：样本、基线、结果与失败', 'validation', item.validation)}
    ${field('本人亲手写或修改的代码', 'ownCode', item.ownCode)}${field('AI 协助实现的部分', 'aiRole', item.aiRole)}
    ${short('可核对的证据位置', 'evidenceRef', item.evidenceRef)}
    <div class="row"><button class="btn primary" id="story-evaluate" ${busy ? 'disabled' : ''}>AI 追问并评估</button><span class="muted small">工作事实与指标必须由你核对。</span></div>
    ${ev ? `<div class="card" style="margin-top:16px"><h3 style="margin-top:0">表达评估 · ${ev.score}/100</h3><p>${esc(ev.summary)}</p><b>缺少的证据</b><ul>${ev.missingEvidence.map(x => `<li>${esc(x)}</li>`).join('')}</ul><b>贡献归属不清</b><ul>${ev.unclearOwnership.map(x => `<li>${esc(x)}</li>`).join('')}</ul><b>可能追问</b><ol>${ev.followups.map(x => `<li>${esc(x)}</li>`).join('')}</ol><p><b>下一步：</b>${esc(ev.nextStep)}</p></div>` : ''}`;
  bindFields(editor, item, renderStats);
  $('story-evaluate').onclick = async () => {
    if (busy) return;
    if (!item.problem?.trim()) return toast('先写项目问题');
    setBusy(true);
    try { const data = await callAI('story-evaluate', 'AI 正在评估项目案例', { story: item }); item.evaluation = data.evaluation; await saveNow(); toast('案例评估已保存'); if (state.stories[selectedStory] === item) renderStory(); }
    catch (error) { fail(error); } finally { setBusy(false); }
  };
}

function showTab(tab) {
  if (tab === 'evidence') renderEvidence();
  if (tab === 'automation') renderDrills();
  if (tab === 'stories') renderStory();
  document.querySelectorAll('[data-tab]').forEach(button => button.classList.toggle('active', button.dataset.tab === tab));
  document.querySelectorAll('[data-panel]').forEach(panel => panel.classList.toggle('hidden', panel.id !== tab));
  history.replaceState(null, '', '#' + tab);
}
document.querySelectorAll('[data-tab]').forEach(button => button.onclick = () => showTab(button.dataset.tab));
$('case-add').onclick = async () => { const item = { id: uid(), date: today() }; state.cases.push(item); selectedCase = item.id; try { await saveNow(); renderEvidence(); } catch (error) { fail(error); } };
$('iteration-add').onclick = async () => { const item = { id: uid(), date: today(), metric: METRICS[0].id }; state.iterations.push(item); selectedIteration = item.id; try { await saveNow(); renderEvidence(); } catch (error) { fail(error); } };
$('drill-generate').onclick = async () => {
  if (busy) return;
  const topic = $('drill-topic').value;
  setBusy(true);
  try {
    const data = await callAI('generate', 'AI 正在生成自动化练习', { topic, recent: state.drills.filter(d => d.topic === topic).map(d => d.drill.title) });
    const item = { id: uid(), date: today(), topic, drill: data.drill, answer: '', runNote: '' };
    state.drills.push(item); selectedDrill = item.id; await saveNow(); renderDrills(); toast('练习已生成');
  } catch (error) { fail(error); } finally { setBusy(false); }
};
document.querySelectorAll('[data-story]').forEach(button => button.onclick = () => { selectedStory = Number(button.dataset.story); renderStory(); });

try {
  const stored = await api.get('testing', 'progress', empty());
  state = { ...empty(), ...(stored || {}) };
  state.stories = Array.isArray(state.stories) ? [state.stories[0] || {}, state.stories[1] || {}] : [{}, {}];
  for (const key of ['cases', 'iterations', 'drills']) if (!Array.isArray(state[key])) state[key] = [];
  selectedCase = state.cases.at(-1)?.id || null; selectedIteration = state.iterations.at(-1)?.id || null; selectedDrill = state.drills.at(-1)?.id || null;
  renderEvidence(); renderDrills(); renderStory();
  showTab(['evidence', 'automation', 'stories'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'evidence');
} catch (error) { fail(error); }
