# practise

AI 时代职业晋升技能练习。每项技能一个子目录，也是总站点下的一个子站点。

## 打开

```bash
npm start            # http://localhost:4600/
PRACTISE_PORT=4700 npm start   # 换端口
```

只依赖 Node（≥18），不需要 `npm install`。必须通过服务器打开：直接双击 html 文件无法读写数据。英文每日计划与阅读点评、算法、系统设计和质量工程的出题与评估均由本机的 Claude 或 Codex CLI 完成，需要先安装并登录所选工具。

## 结构

| 路径 | 内容 | 状态 |
|------|------|------|
| [english/](english/) | 英文：顺畅阅读 + 基本回复 + 闲聊 | 进行中 |
| [coding/](coding/) | 算法编码：六个类别下持续生成新题、限时练习、静态评估和复练记录 | 可用 |
| [system-design/](system-design/) | 系统设计：第一部分对单个理论和设计方法做专项训练（★ 核心优先），第二部分结合真实业务场景做完整设计；含讲解、小题、架构图、追问与 AI 评估 | 可用 |
| [testing/](testing/) | 质量工程：固定评测集、真实指标对比、Python 自动化实操、项目案例追问 | 可用 |

- `index.html`：总站点首页，汇总各技能。
- `server.mjs`：本地服务器。负责托管静态页面，并把每个技能的数据存成 `<技能>/data/<名字>.json`。技能如果有 `<技能>/api.mjs`，它导出的 `handle()` 会挂到 `/api/<技能>/<动作>` 上（English 用它来生成每日计划）。
- `assets/`：所有页面共用的样式（`style.css`）和工具函数（`app.js`）。

练习记录都在 `*/data/*.json` 里，**跟代码一起提交**，git 历史就是学习记录。

英文、算法、系统设计和质量工程的 AI 功能默认使用本机的 `claude` CLI，模型为 `sonnet`。可设置 `PRACTISE_AI_CLI=codex` 改用本机 `codex` CLI，默认模型为 `gpt-6-luna`；需先安装并登录对应工具。可用 `PRACTISE_CLAUDE_BIN` / `PRACTISE_CODEX_BIN` 指定命令路径，用 `PRACTISE_CLAUDE_MODEL` / `PRACTISE_CODEX_MODEL` 覆盖默认模型，用 `PRACTISE_AI_TIMEOUT_MS` 调整超时。英文 AI 陪练可直接在页面中对话，练习记录写入 `english/data/coaching.json`。算法可在任一类别下反复生成新题，各题的练习与评估记录写入 `coding/data/progress.json`、`system-design/data/progress.json`。算法 AI 只静态审阅代码，须在本机自行运行示例和边界输入。系统设计前六个主题会读取相邻的 `casehub` 和 `auto-test` 仓库文档作为设计背景；其他主题无需这些仓库。

## 加一个新技能

1. 新建目录，例如 `coding/`，在里面放 `index.html`。可以参照 `english/js/common.js` 写这个技能的导航，以及数据的读和存。
2. 在根目录 `index.html` 的 `SKILLS` 里把它的 `ready` 设为 `true`，并填上 `href`。
