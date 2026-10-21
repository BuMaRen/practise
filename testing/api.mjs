import { askJson } from '../assets/ai-cli.mjs';
import { DRILLS } from './content.js';

const str = { type: 'string' };
const list = { type: 'array', items: str };
const object = properties => ({ type: 'object', additionalProperties: false, required: Object.keys(properties), properties });
const GENERATE = object({ title: str, situation: str, task: str, constraints: list, checks: list, hint: str });
const EVALUATE = object({ verdict: { type: 'string', enum: ['ready', 'revise', 'insufficient'] }, summary: str, strengths: list, issues: list, missingTests: list, nextStep: str });
const STORY = object({ score: { type: 'integer', minimum: 0, maximum: 100 }, summary: str, missingEvidence: list, unclearOwnership: list, followups: list, nextStep: str });
const EVIDENCE = object({ summary: str, strengths: list, gaps: list, nextStep: str });

async function run(prompt, schema) {
  const { output, provider, model } = await askJson(prompt, schema);
  return { output, provider, model };
}

async function generate(body) {
  const topic = DRILLS.find(d => d.id === body?.topic);
  if (!topic) throw Object.assign(new Error('请选择有效的练习方向'), { status: 400 });
  const recent = Array.isArray(body.recent) ? body.recent.slice(-12).map(x => String(x).slice(0, 120)) : [];
  const result = await run(`你是质量工程技术面试陪练。为有 Python 自动化经验但最近较少亲手编码的测试工程师出一道可在 30–40 分钟内完成的实操题。方向：${topic.name}（${topic.focus}）。\n已做过：${JSON.stringify(recent)}。\n请换具体业务场景，不要复用已做题名。题目必须要求学习者亲手写 Python、Playwright 测试或 CI 配置中的至少一种，并解释断言、测试数据、失败定位和边界；不要给答案。situation 提供足够接口/页面行为和输入输出约定，让人不用额外猜需求。checks 给 3–5 个验收点。hint 只给方向，不泄露实现。`, GENERATE);
  if (!result.output.title || !result.output.task || result.output.checks.length < 2) throw new Error('AI 返回的练习题不完整');
  return { drill: result.output, provider: result.provider, model: result.model };
}

async function evaluate(body) {
  if (!body?.drill?.task || !String(body.answer || '').trim()) throw Object.assign(new Error('先写实现或排障方案'), { status: 400 });
  const answer = String(body.answer).slice(0, 20000);
  const runNote = String(body.runNote || '').slice(0, 4000);
  const result = await run(`你是严格但建设性的 Python 自动化测试评审者。只根据提交文本做静态评估；不能声称运行过代码。评估断言是否有效、测试数据与隔离、边界、错误处理、CI/日志排障和不稳定性风险。没有运行证据时明确标注。不要为通过而弱化断言。\n题目：${JSON.stringify(body.drill)}\n学习者提交：\n${answer}\n本机运行与排障记录：\n${runNote || '未提供'}\nverdict 为 ready/revise/insufficient；issues 给具体可执行的问题，missingTests 给建议本机验证的场景。`, EVALUATE);
  return { evaluation: result.output, provider: result.provider, model: result.model };
}

async function evaluateStory(body) {
  const story = body?.story;
  if (!story || !String(story.problem || '').trim()) throw Object.assign(new Error('先写项目问题'), { status: 400 });
  const { evaluation, ...facts } = story;
  const result = await run(`你是智能测试/质量工程岗位的面试官。评估下面项目案例是否说清“遇到的问题 → 本人的判断 → 调整的规则 → 如何验证”，是否有真实证据、可追问的技术细节，并清楚区分本人亲手代码、测试判断与 AI 协助。不要补造事实、指标或个人贡献。对“自动放行”和“人工评审”的表述要符合案例所给事实，缺证据要指出。\n案例：${JSON.stringify(facts).slice(0, 20000)}\nscore 评表达完整度而非成果大小；missingEvidence、unclearOwnership 和 followups 具体列出问题。`, STORY);
  return { evaluation: result.output, provider: result.provider, model: result.model };
}

async function evaluateEvidence(body) {
  const item = body?.iteration;
  if (!item?.rule?.trim()) throw Object.assign(new Error('先写规则改动'), { status: 400 });
  const { review, reviewedSignature, ...facts } = item;
  const result = await run(`你是 AI 测试评测负责人。审查这次提示词/规则改动的效果证据：是否有固定评测集、改动前后的可比分子分母、真实失败案例和根因，结论是否超出证据。不能编造百分比、样本量或工作成果；没有基线就明确指出。\n当前已登记样本数：${Number(body.caseCount) || 0}\n对比记录：${JSON.stringify(facts).slice(0, 15000)}\n用简短中文返回 strengths、gaps 和下一步可验证动作。`, EVIDENCE);
  return { review: result.output, provider: result.provider, model: result.model };
}

export async function handle(req, res, action, url, { sendJson, readBody }) {
  if (req.method !== 'POST' || !['generate', 'evaluate', 'story-evaluate', 'evidence-evaluate'].includes(action)) return sendJson(res, 404, { error: 'unknown action' });
  let body;
  try { body = JSON.parse(await readBody(req)); } catch { return sendJson(res, 400, { error: 'invalid JSON' }); }
  try {
    const result = action === 'generate' ? await generate(body) : action === 'evaluate' ? await evaluate(body) : action === 'story-evaluate' ? await evaluateStory(body) : await evaluateEvidence(body);
    return sendJson(res, 200, result);
  } catch (error) { return sendJson(res, error.status || 502, { error: error.message }); }
}
