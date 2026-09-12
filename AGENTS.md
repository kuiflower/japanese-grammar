# AGENTS.md — 项目接手说明

给 Cursor / 其他 Agent：换账号或新开对话时，先读本文件与 `.cursor/rules/`。

## 项目是什么

个人用 JLPT **文法 + 単語** 练习站（React + Vite + TypeScript）。

- 仓库：`https://github.com/kuiflower/japanese-grammar`
- 本地：`npm install` → `npm run dev` → http://localhost:5173/japanese-grammar/
- 构建：`npm run build`（`base: /japanese-grammar/`）
- 主分支：`main`；改完默认 **commit + push origin/main**

## 必读规则（仓库内）

| 文件 | 作用 |
|------|------|
| `.cursor/rules/project-data-architecture.mdc` | 唯一数据源、出题模版、禁止旁路 |
| `.cursor/rules/data-qa-audit.mdc` | 改 JSON 后的质量审计 |
| `.cursor/rules/agent-workflow.mdc` | 沟通语言、提交节奏、常用约定 |

## 目录速查

```
src/data/levels/{n5|n4|n3|n2|n1}/
  grammar.json              # 基础语法（N5–N2）
  grammar-reading.json      # 阅读专项语法
  grammar-listening.json    # 听力专项语法
  vocabulary.json           # 频出单词
  vocabulary-full.json      # 全套单词
  vocabulary-reading.json   # 阅读高频词
  vocabulary-listening.json # 听力高频词

src/data/quiz/              # 语法出题模版
src/data/vocab-quiz/        # 单词出题模版（读音→释义→填空）
src/lib/practiceStorage.ts      # 语法进度 / 错题 localStorage
src/lib/vocabPracticeStorage.ts # 单词进度 / 错题 localStorage
src/pages/PracticeSession.tsx
src/pages/VocabularyPracticeSession.tsx  # 含题号跳转
```

## 改数据时

1. **只改对应正式 JSON**，不要新建 `scripts/`、CSV、refinements、build 管线。
2. 单词挖空：`example.japanese` **必须包含精确的 `word` 字符串**（含 `暖める/温める` 这类带斜杠的写法）。
3. 禁模板烂句：`うまくX` / `そろそろX` / `すぐにX` / `丁寧にX` / `Xを見た` 等。
4. 改完用对话内一次性 Python 审计 → `ERR=0` → `npm run build` → commit + push。

## 产品行为备忘

- 文法 / 単語练习：有未完成进度时提示「继续上次 / 重新开始」。
- 単語刷题按词表 **index 原序**（全套常按词性成块；N3 动词约从第 1203 题起）。
- 単語练习页可 **输入题号跳转**。
- 进度存在浏览器 localStorage（`jg-v1-*` / `jv-v1-*`），不进 git。

## 新账号第一次开聊建议

复制下面这段即可：

> 这是 JLPT 文法/单词练习站。请先读 `AGENTS.md` 与 `.cursor/rules/`。数据只改 `src/data/levels/**` 正式 JSON；改完审计、`npm run build`，再 commit 并 push 到 `main`。回复用简体中文。

## 账号级 Rules（Settings → Rules）

仓库规则会自动加载；下列若未写入 Cursor 用户 Rules，建议在新账号补一遍（与 `agent-workflow.mdc` 一致即可）：

- 始终用简体中文回复
- 用户未禁止时：改完自动 commit + push
- 不 force push、不改 git config、不擅自 amend 

