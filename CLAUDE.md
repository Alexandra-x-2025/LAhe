# LAhe - Claude 项目文档

## 项目概述

**LAhe** 是一个面向 Arch Linux 用户的本地优先 AI 系统助手。提供类控制台的桌面管理界面，用于咨询包管理、服务配置、日志排查、系统状态分析，并通过命令安全审计面板展示 AI 生成的 shell 命令。

### 核心特性

- 🏠 **本地优先** — AI 推理和命令执行均在本地完成，保护隐私
- 🔐 **命令安全门** — SOFT / MODERATE / CRITICAL 三级风险控制
- 💾 **配置持久化** — 设置保存到数据库，重启不丢失
- 🤖 **AI 自动检测** — 自动检测 Ollama 服务，一键接入
- 🌐 **中英双语** — 完整的双语界面支持
- 📊 **系统监控** — CPU、内存、磁盘、日志查看

---

## 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 19, Vite 6, TypeScript, Tailwind CSS 4, Motion |
| **后端** | Express, better-sqlite3, tsx |
| **AI** | Ollama 本地模型（默认 qwen3.5:0.8b） |
| **数据库** | SQLite (lahe.db) |
| **测试** | Vitest |

---

## 目录结构

```
LAhe/
├── server.ts                        # 服务入口
├── src/
│   ├── App.tsx                      # 主应用布局
│   ├── components/                  # React 组件
│   │   ├── Console.tsx              # AI 对话 + 命令审计
│   │   ├── HistoryView.tsx          # 交互历史
│   │   ├── LogViewer.tsx            # 系统日志查看
│   │   ├── SystemStats.tsx          # 系统状态面板
│   │   ├── NeuralMap.tsx            # 记忆节点与技能
│   │   ├── Scheduler.tsx            # 计划任务管理
│   │   ├── AuditView.tsx            # 命令审计记录
│   │   └── OllamaSettings.tsx       # Ollama 配置面板
│   ├── server/                      # 后端代码
│   │   ├── app.ts                   # Express 应用配置
│   │   ├── config.ts                # 配置管理（支持数据库加载）
│   │   ├── logger.ts                # 日志配置 (pino)
│   │   ├── loadEnv.ts               # 环境变量加载
│   │   ├── routes/                  # API 路由
│   │   │   ├── chatRoutes.ts        # /api/chat
│   │   │   ├── commandRoutes.ts     # /api/execute
│   │   │   ├── systemRoutes.ts      # /api/stats, /api/logs
│   │   │   ├── historyRoutes.ts     # /api/history
│   │   │   ├── memoryRoutes.ts      # /api/memory
│   │   │   ├── skillRoutes.ts       # /api/skills
│   │   │   ├── cronRoutes.ts        # /api/cron
│   │   │   ├── ollamaRoutes.ts      # /api/ollama/*
│   │   │   └── settingsRoutes.ts    # /api/settings/*
│   │   ├── services/                # 业务逻辑
│   │   │   ├── aiService.ts         # AI 响应生成
│   │   │   ├── ollamaClient.ts      # Ollama API 客户端
│   │   │   └── commandService.ts    # 命令执行服务
│   │   ├── db/                      # 数据库层
│   │   │   ├── client.ts            # SQLite 客户端
│   │   │   ├── schema.ts            # 表结构定义
│   │   │   └── repositories/        # 数据仓库
│   │   │       ├── historyRepository.ts
│   │   │       ├── memoryRepository.ts
│   │   │       ├── skillRepository.ts
│   │   │       ├── cronRepository.ts
│   │   │       ├── commandExecutionRepository.ts
│   │   │       └── settingsRepository.ts
│   │   ├── prompts/                 # AI 提示词
│   │   │   └── archSystemPrompt.ts  # Arch 系统提示词
│   │   ├── commandSafety.ts         # 命令安全检查
│   │   ├── commandExtractor.ts      # 命令提取
│   │   ├── aiResponseParser.ts      # AI 响应解析
│   │   ├── outputSanitizer.ts       # 输出清理
│   │   ├── schemas.ts               # Zod 校验 schema
│   │   ├── systemService.ts         # 系统服务调用
│   │   └── types.ts                 # 后端类型定义
│   ├── lib/                         # 前端工具
│   │   ├── i18n.tsx                 # 国际化文案
│   │   └── utils.ts                 # 工具函数
│   ├── main.tsx                     # React 入口
│   ├── index.css                    # Tailwind 主题
│   └── types.ts                     # 前端类型定义
├── docs/                            # 文档
│   ├── architecture.md              # 架构文档
│   ├── requirements-mvp.md          # MVP 需求
│   ├── tech-stack.md                # 技术栈说明
│   └── backend-module-design.md     # 后端模块设计
├── .env.example                     # 环境变量示例
├── .gitignore                       # Git 忽略规则
├── package.json                     # 项目依赖
├── tsconfig.json                    # TypeScript 配置
└── vite.config.ts                   # Vite 配置
```

---

## 快速开始

### 环境要求

- Node.js 20+
- npm
- Ollama（可选，但推荐）

### 安装依赖

```bash
npm install
```

### 配置环境变量

```bash
cp .env.example .env.local
# 编辑 .env.local 配置 Ollama 地址和模型
```

### 启动开发服务

```bash
npm run dev
```

访问 `http://localhost:3000`

---

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览构建产物 |
| `npm run lint` | TypeScript 类型检查 |
| `npm run clean` | 删除 dist 目录 |
| `npm run test` | 运行测试 |

---

## API 端点

### Ollama 相关

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/ollama/status` | 检测 Ollama 服务状态 |
| `GET` | `/api/ollama/models` | 获取已安装的模型列表 |
| `GET` | `/api/ollama/config` | 获取当前配置 |
| `POST` | `/api/ollama/config` | 更新配置（持久化到数据库） |

### 设置相关

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/settings` | 获取所有设置 |
| `GET` | `/api/settings/:key` | 获取单个设置 |
| `POST` | `/api/settings` | 保存设置 |
| `PUT` | `/api/settings/:key` | 更新设置 |
| `DELETE` | `/api/settings/:key` | 删除设置 |

### AI 对话

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/chat` | 发送消息到 AI |

### 命令执行

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/execute` | 执行经过安全检查的命令 |

### 系统信息

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/stats` | 获取系统状态 |
| `GET` | `/api/logs` | 获取 journalctl 日志 |

### 历史记录

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/history` | 获取交互历史 |
| `POST` | `/api/history` | 保存交互历史 |

### 记忆与技能

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/memory` | 获取持久记忆 |
| `POST` | `/api/memory` | 保存持久记忆 |
| `GET` | `/api/skills` | 获取技能流程 |
| `POST` | `/api/skills` | 保存技能流程 |

---

## 数据库表结构

| 表名 | 说明 |
|------|------|
| `interactions` | 交互历史（用户问题 + AI 回复） |
| `skills` | 技能流程（模式化的命令序列） |
| `memory` | 持久记忆节点 |
| `cron_jobs` | 计划任务定义 |
| `command_executions` | 命令执行审计记录 |
| `settings` | 应用设置（key-value 存储） |

---

## 安全设计

### 命令安全等级

- **SOFT** — 只读查询，直接执行
- **MODERATE** — 修改系统状态，需前端确认
- **CRITICAL** — 高危命令，默认阻止

### 安全边界

- 前端永远不能直接执行命令
- `/api/execute` 必须独立判断命令风险
- CRITICAL 命令默认阻止
- 不建议以 root 身份运行
- 不建议将服务暴露到公网

---

## 配置持久化

### 工作流程

1. 服务启动时从 `settings` 表加载配置
2. 如果数据库无数据，使用 `.env.local` 或默认值
3. 配置变更通过 `/api/settings` 或 `/api/ollama/config` 保存
4. 变更立即生效，无需重启服务

### 数据库优先级

```
数据库 settings 表 > .env.local > 默认值
```

---

## 国际化

### 使用方式

```tsx
import { useLanguage } from "@/src/lib/i18n";

function MyComponent() {
  const { t, language, setLanguage } = useLanguage();

  return (
    <div>
      {t("console.placeholder")}
      <button onClick={() => setLanguage(language === "en" ? "zh" : "en")}>
        切换语言
      </button>
    </div>
  );
}
```

### 添加新文案

在 `src/lib/i18n.tsx` 的 `translations` 对象中添加：

```typescript
const translations: Translations = {
  "my.key": { en: "English text", zh: "中文文本" },
};
```

---

## 开发指南

### 添加新 API 路由

1. 在 `src/server/routes/` 创建新路由文件
2. 在 `src/server/app.ts` 注册路由
3. 添加必要的 Zod schema 校验
4. 考虑错误处理和日志记录

### 添加新前端组件

1. 在 `src/components/` 创建组件
2. 使用 TypeScript 编写类型安全代码
3. 添加国际化文案
4. 在 `src/App.tsx` 注册视图

### 数据库变更

1. 修改 `src/server/db/schema.ts`
2. 如需要，创建对应的 repository
3. 删除 `lahe.db` 让表结构重新初始化

---

## 常见问题

### Ollama 连接失败

1. 确保 Ollama 正在运行：`ollama serve`
2. 检查配置是否正确（使用设置面板自动检测）
3. 确认模型已安装：`ollama list`

### 配置丢失

配置现在持久化到数据库。如需重置：
```bash
rm lahe.db
npm run dev  # 数据库会自动重新初始化
```

### 系统状态显示 N/A

系统状态接口依赖 Linux 命令。在 Windows 或容器环境中部分数据可能不可用。

---

## 项目现状

### 已完成 ✅

- [x] 基础架构（前后端分离）
- [x] AI 对话功能
- [x] 命令安全门
- [x] 交互历史记录
- [x] 系统状态面板
- [x] 日志查看器
- [x] Ollama 自动检测与配置
- [x] 配置持久化（数据库）
- [x] 国际化支持
- [x] 命令审计记录

### 待完成 📋

- [ ] 错误处理中间件
- [ ] 健康检查端点 `/health`
- [ ] 计划任务调度器
- [ ] 用户认证鉴权
- [ ] 命令执行沙箱
- [ ] 测试覆盖

---

## Git 工作流

### 分支策略

- `main` — 主分支，稳定代码
- 功能分支 — `feature/xxx`

### 提交规范

```
<type>: <description>

[optional body]

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
```

Type: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

---

## 许可证

Apache-2.0

---

## 联系方式

- GitHub: https://github.com/Alexandra-x-2025/LAhe