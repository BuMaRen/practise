export const DRILLS = [
  { id: 'api', name: '接口测试', focus: '请求构造、断言、边界和错误响应' },
  { id: 'playwright', name: 'Playwright', focus: '定位器、等待、断言和可维护性' },
  { id: 'pytest', name: 'pytest 与数据准备', focus: 'fixture、隔离、参数化和清理' },
  { id: 'ci', name: 'CI 集成', focus: '流水线、报告、失败门槛和可复现性' },
  { id: 'debug', name: '问题定位', focus: '日志、数据库、请求链路和根因' },
  { id: 'flaky', name: '不稳定用例治理', focus: '重试边界、证据和根因修复' },
];

export const METRICS = [
  { id: 'case-edit', name: '用例人工修改率', unit: '需修改用例 / 评审用例' },
  { id: 'script-first-run', name: '脚本首次运行可用率', unit: '首次可用脚本 / 生成脚本' },
  { id: 'exploration-time', name: '重复探索耗时', unit: '总分钟数 / 同类任务数' },
  { id: 'failure-attribution', name: '失败归因准确率', unit: '归因正确次数 / 抽查次数' },
  { id: 'regression-find', name: '回归缺陷发现率', unit: '发现缺陷数 / 实际回归缺陷数' },
];

export const WORK_ITEMS = [
  ['评测样本', '从真实需求或用例中逐步固定 30–50 个代表性样本；记录验收标准、AI 产物和人工判定。'],
  ['基线与对比', '每次提示词或规则调整前后用同一评测集复跑，保留样本量、分子分母和典型失败。'],
  ['亲手编码', '在现有项目里独立完成一个边界清晰的 Python／Playwright／CI 小改动，并用测试证明。'],
  ['两段完整案例', '记录“问题 → 判断 → 规则调整 → 验证结果”，区分本人决策、亲手代码与 AI 协助实现。'],
  ['架构事实', '在真实代码和运行记录中核对任务恢复、幂等、经验复用及自动放行边界，再用于系统设计回答。'],
];
