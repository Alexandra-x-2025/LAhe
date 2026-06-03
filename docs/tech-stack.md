# LAhe 技术栈文档

## 1. 技术选型原则

LAhe 的技术选型围绕四个原则：

- 本地优先：AI 推理、数据库、系统命令执行默认发生在用户本机。
- 简单部署：MVP 使用一个 Node.js 进程承载前后端。
- 类型清晰：前端和后端都使用 TypeScript。
- 渐进增强：Windows 可开发，Arch/Linux 可完整测试。

## 2. 运行环境

必需：

- Node.js 20 或更高版本。
- npm。
- Git。
- Ollama。
- 至少一个本地模型，例如 `qwen3.5:0.8b`。

Windows 上推荐：

- Visual Studio C++ Build Tools。
- Python 3。
- VS Code。

Arch/Linux 上推荐：

- systemd / journalctl。
- pacman。
- 常用系统命令：`uptime`、`free`、`df`、`top`、`systemctl`。

## 3. 前端技术栈

| 技术 | 用途 |
| --- | --- |
| React 19 | 构建前端 UI |
| TypeScript | 类型约束和可维护性 |
| Vite 6 | 前端构建与开发服务 |
| Tailwind CSS 4 | 样式系统 |
| Motion | 动效和视图切换 |
| Lucide React | 图标 |
| React Markdown | 渲染 AI Markdown 回复 |
| clsx | 条件 className |
| tailwind-merge | 合并 Tailwind className |

前端入口：

- `index.html`
- `src/main.tsx`
- `src/App.tsx`

核心组件：

- `Console.tsx`
- `HistoryView.tsx`
- `LogViewer.tsx`
- `SystemStats.tsx`
- `NeuralMap.tsx`
- `Scheduler.tsx`

## 4. 后端技术栈

| 技术 | 用途 |
| --- | --- |
| Express 4 | HTTP API 服务 |
| TypeScript | 后端类型 |
| tsx | 直接运行 TypeScript 服务端入口 |
| better-sqlite3 | SQLite 本地持久化 |
| dotenv | 加载 `.env.local` / `.env` 配置 |
| execa | 执行本机 shell 命令并控制 timeout / stdout / stderr |
| Zod | 请求体和 AI 响应结构校验 |
| pino | 后端结构化日志 |
| Vite middleware | 开发模式下挂载前端 |

后端入口：

- `server.ts`

后端主要职责：

- API 路由。
- SQLite 初始化和查询。
- Ollama 调用。
- 命令安全判断。
- 命令执行。
- 系统状态和日志读取。

## 5. AI 技术栈

MVP 使用 Ollama 本地模型。

默认配置：

```env
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="qwen3.5:0.8b"
```

推荐模型：

| 模型 | 说明 |
| --- | --- |
| `qwen3.5:0.8b` | 中文能力较好，适合默认开发测试 |
| `llama3.1:8b` | 英文能力较稳 |
| `deepseek-r1:7b` | 适合推理型排障，但输出结构可能需要额外约束 |

本项目不再使用：

- Gemini API。
- 前端 AI SDK 直连。
- 云端 API Key 注入前端。

## 6. 数据库技术栈

数据库：

- SQLite。
- 驱动：`better-sqlite3`。
- 默认文件：`lahe.db`。

优点：

- 零服务依赖。
- 适合本地桌面工具。
- 查询简单。
- 备份和迁移容易。

注意：

- `lahe.db` 是本地运行数据，不应提交到 Git。
- 当前没有 migration 系统，表结构由 `server.ts` 启动时创建。
- 后续表结构复杂后，建议引入迁移脚本。

## 7. 系统命令依赖

系统状态：

- `uptime -p`
- `free -h`
- `df -h --total`
- `top -bn1`

系统日志：

- `journalctl -n 50 --no-hostname --output=short-iso`

Arch 运维建议中常见命令：

- `pacman`
- `systemctl`
- `journalctl`
- `ip`
- `ss`
- `df`
- `free`
- `top`

Windows 下这些命令可能不可用，后端应返回降级结果。

## 8. npm 脚本

| 脚本 | 说明 |
| --- | --- |
| `npm run dev` | 启动 Express + Vite 开发服务 |
| `npm run build` | 构建前端生产产物 |
| `npm run preview` | Vite 预览构建产物 |
| `npm run lint` | TypeScript 类型检查 |
| `npm test` | 运行 Vitest 单元测试 |
| `npm run clean` | 删除 `dist` 目录 |

注意：

- `clean` 当前使用 `rm -rf dist`，在原生 Windows shell 中可能不可用。
- 如需更好跨平台支持，后续可改为 Node 脚本或 `rimraf`。

## 9. 配置文件

| 文件 | 说明 |
| --- | --- |
| `.env.example` | 环境变量模板 |
| `.env.local` | 本地实际配置，不提交 |
| `vite.config.ts` | Vite、React、Tailwind、路径别名 |
| `tsconfig.json` | TypeScript 配置 |
| `package.json` | 脚本和依赖 |
| `.gitignore` | 忽略依赖、构建产物、环境变量、本地数据库 |

推荐 `.env.local`：

```env
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="qwen3.5:0.8b"
APP_URL="http://localhost:3000"
```

## 10. 目录结构

```text
.
├── docs/
│   ├── architecture.md
│   ├── requirements-mvp.md
│   └── tech-stack.md
├── src/
│   ├── components/
│   ├── lib/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── types.ts
├── server.ts
├── vite.config.ts
├── tsconfig.json
├── package.json
├── package-lock.json
├── .env.example
└── README.md
```

## 11. 开发环境验证

Windows 开发机：

```bash
node -v
npm -v
git --version
python --version
npm install
npm run lint
npm run build
```

Ollama 验证：

```bash
ollama --version
ollama pull qwen3.5:0.8b
ollama serve
```

项目启动：

```bash
npm run dev
```

访问：

```text
http://localhost:3000
```

## 12. 后续技术演进

后端拆分：

- `src/server/routes`
- `src/server/services`
- `src/server/db`
- `src/server/safety`
- `src/server/ai`

质量工具：

- Vitest。
- ESLint。
- Prettier。
- Playwright。

安全增强：

- 命令白名单。
- shell 命令 AST 或 parser。
- 执行记录表。
- 审计日志。
- 更严格的确认流程。

部署增强：

- Linux systemd user service。
- Docker 或 Podman。
- 数据目录配置。
- 多模型配置页面。
