<div align="center">
<img width="1200" height="475" alt="GHBanner" src="src\img\readlogo.png" />
</div>

# LAhe

一个面向 Arch Linux 用户的 AI 系统助手。项目提供类控制台的桌面管理界面，可用于咨询包管理、服务配置、日志排查、系统状态分析，并通过命令安全审计面板展示 AI 生成的 shell 命令。

项目由 React + Vite 前端和 Express 后端组成，后端内置 SQLite 持久化，用于保存交互历史、记忆节点、技能模板和计划任务。

## 功能特性

- AI 命令中心：基于本地 Ollama 模型回答 Arch Linux 运维问题，并生成 pacman、systemctl、journalctl 等常用命令。
- 命令安全审计：AI 输出可携带 `[AUDIT]` 元数据，前端会解析命令、安全等级和说明，并在执行前展示确认区域。
- 命令审计记录：保存命令执行和安全拦截记录，并在审计视图中展示最近记录。
- 交互历史：将用户问题和 AI 回复保存到本地 SQLite 数据库。
- 持久记忆与技能：支持保存 AI 识别出的记忆节点和复用型技能流程。
- 系统日志查看：后端读取 `journalctl` 最近日志，前端提供过滤和展示界面。
- 系统状态面板：读取 uptime、内存、磁盘、CPU 负载等 Linux 系统信息。
- 计划任务视图：保存和展示 cron 风格的任务定义。
- 中英双语界面：默认中文，可在侧边栏切换 English / 简体中文。

## 技术栈

- 前端：React 19、Vite 6、TypeScript、Tailwind CSS 4、Motion、Lucide React
- 后端：Express、better-sqlite3、tsx
- AI：Ollama 本地模型
- 数据库：SQLite，默认文件为 `lahe.db`

## 项目结构

```text
.
├── server.ts                  # Express API、SQLite 初始化、Vite 开发中间件
├── src/
│   ├── App.tsx                # 主布局、侧边栏导航、多视图切换
│   ├── components/
│   │   ├── Console.tsx        # AI 对话、命令审计、命令执行入口
│   │   ├── HistoryView.tsx    # 交互历史
│   │   ├── LogViewer.tsx      # journalctl 日志查看
│   │   ├── NeuralMap.tsx      # 记忆节点与技能
│   │   ├── Scheduler.tsx      # 计划任务
│   │   └── SystemStats.tsx    # 系统状态
│   ├── lib/
│   │   ├── i18n.tsx           # 中英双语文案
│   │   └── utils.ts           # className 合并工具
│   ├── main.tsx               # React 入口
│   └── index.css              # Tailwind 主题与全局样式
├── .env.example               # 环境变量示例
├── vite.config.ts             # Vite 配置
└── package.json               # 脚本与依赖
```

## 环境要求

- Node.js 20 或更高版本
- npm
- Ollama
- 本地模型，例如 `qwen3.5:0.8b`
- 推荐运行环境为 Linux / Arch Linux

系统日志和状态接口依赖 `journalctl`、`uptime`、`free`、`df`、`top` 等 Linux 命令。在 Windows 或受限容器中运行时，部分系统信息会返回空值或降级提示。

## 快速开始

1. 安装依赖：

```bash
npm install
```

2. 创建本地环境变量文件：

```bash
cp .env.example .env.local
```

3. 编辑 `.env.local`，配置本地模型：

```env
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="qwen3.5:0.8b"
APP_URL="http://localhost:3000"
```

请确保 Ollama 已启动，并已拉取对应模型：

```bash
ollama pull qwen3.5:0.8b
ollama serve
```

4. 启动开发服务：

```bash
npm run dev
```

5. 打开浏览器访问：

```text
http://localhost:3000
```

## 可用脚本

```bash
npm run dev      # 启动 Express + Vite 开发服务
npm run build    # 构建前端生产产物
npm run preview  # 使用 Vite 预览构建产物
npm run lint     # TypeScript 类型检查
npm run clean    # 删除 dist 目录
```

## 后端 API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/api/execute` | 执行经过前端确认的 shell 命令 |
| `GET` | `/api/stats` | 获取系统 uptime、内存、磁盘、CPU 信息 |
| `GET` | `/api/logs` | 获取最近 50 条 journalctl 日志 |
| `GET` | `/api/history` | 获取最近 50 条交互历史 |
| `POST` | `/api/history` | 保存一次用户问题与 AI 回复 |
| `GET` | `/api/memory` | 获取持久记忆节点 |
| `POST` | `/api/memory` | 保存持久记忆节点 |
| `GET` | `/api/skills` | 获取学习到的技能流程 |
| `POST` | `/api/skills` | 保存或更新技能流程 |
| `GET` | `/api/cron` | 获取计划任务 |
| `POST` | `/api/cron` | 新增计划任务 |

## 数据持久化

应用启动时会在项目根目录创建 `lahe.db`，并自动初始化以下表：

- `interactions`：交互历史
- `skills`：技能流程
- `memory`：持久记忆
- `cron_jobs`：计划任务

该数据库属于本地运行数据，不建议提交到 Git 仓库。

## 安全说明

`/api/execute` 会在服务器所在机器上执行 shell 命令。当前后端包含基础黑名单，会阻止 `rm -rf /`、`mkfs`、`dd if=/dev/zero`、`shutdown`、`reboot` 等高危模式，但这不是完整的沙箱。

建议：

- 只在可信本机或隔离环境中运行。
- 不要将服务直接暴露到公网。
- 不要以 root 身份启动开发服务，除非明确知道后果。
- 执行 AI 生成命令前，务必人工检查命令内容。
- 对生产环境应增加鉴权、命令白名单、审计日志和更严格的执行隔离。

## 构建与部署

构建前端：

```bash
npm run build
```

生产模式下，`server.ts` 会从 `dist` 目录提供静态文件：

```bash
NODE_ENV=production npm run dev
```

部署时需要设置 `OLLAMA_BASE_URL` 和 `OLLAMA_MODEL`，并确保运行环境允许写入 SQLite 数据库文件。

## 常见问题

### 本地模型无响应

请检查 Ollama 是否正在运行，`.env.local` 中的 `OLLAMA_BASE_URL` 和 `OLLAMA_MODEL` 是否正确，并确认模型已拉取到本机。

### 系统状态显示 N/A

系统状态接口依赖 Linux 命令。在非 Linux 环境、容器环境或权限不足时，部分数据可能不可用。

### journalctl 日志为空

请确认运行用户具有读取 systemd journal 的权限。部分发行版可能需要将用户加入 `systemd-journal` 组。

### 命令执行失败

后端会直接执行命令，因此命令是否成功取决于服务器操作系统、当前用户权限和已安装的软件包。

## AI Studio

原始 AI Studio 应用地址：

```text
https://ai.studio/apps/8a777aee-9966-4c78-b94d-3eabaae361f6
```

这是推送测试！
