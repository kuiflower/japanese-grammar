# 东东文法 — 日语语法学习

PRE-N3 / N2 / N3 语法库与练习应用（React + Vite）。

## 快速开始

```bash
npm install
npm run dev
```

浏览器访问 http://localhost:5173

## 项目结构

```
src/data/
├── types/grammar-entry.ts       # 数据字段约定
├── levels/                      # 各级别唯一数据库（唯一数据源）
│   ├── pre-n3/grammar.json      # PRE-N3（44 条）
│   ├── n2/grammar.json          # N2（155 条）
│   └── n3/grammar.json          # N3（192 条）
├── grammar.ts                   # 语法库 UI 适配
└── quiz/
    ├── generateQuestions.ts     # 出题模版（通用，与级别无关）
    └── index.ts                 # 按 level 调取数据库出题
```

## 数据维护

**唯一数据源：直接编辑对应级别的 `grammar.json`。**

| 级别 | 数据库文件 |
|------|-----------|
| PRE-N3 | `src/data/levels/pre-n3/grammar.json` |
| N2 | `src/data/levels/n2/grammar.json` |
| N3 | `src/data/levels/n3/grammar.json` |

每条字段：`meaning` 释义 · `usage` 用法 · `notes` 辨析 · `examples` 例句

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器 |
| `npm run build` | 生产构建 |

## 新增题型

只改 `src/data/quiz/generateQuestions.ts`，从 `GrammarEntry` 字段读取数据。
