# Portal 独立 Monorepo 升级方案

> 将 portal 项目升级为 TypeScript + Node.js 全栈 monorepo，**独立 git 仓库**，与 paperclip 无任何代码/依赖关联。
> 架构参照 paperclip 的 monorepo 模式（server/ + ui/ + packages/*），适配 portal 的前后端分离场景。

---

## 〇、设计决策与取舍

### 当前仓库状态

前端代码已完整迁移至 `portal/frontend/`，根目录成为纯净的 monorepo workspace root。

| 目录 | 状态 | 角色 |
|------|------|------|
| `portal/` | 已有 | monorepo 根（workspace root，不含业务代码） |
| `portal/frontend/` | 已有（完整） | Next.js 14 前端应用 |
| `portal/backend/` | 已创建（空） | 待搭建 — Express REST API |
| `portal/packages/` | 已创建（空） | 待搭建 — 共享包（shared / db） |
| `portal/ai-os-api/` | 已有（Python） | 既有 Python API，独立管理，不纳入 pnpm workspace |
| `portal/docs/` | 已有 | monorepo 级共享文档（PRD、方案） |

### 为什么这个结构优于"根目录即前端"

上一版方案中根 `package.json` 身兼 workspace root 和 Next.js 前端两个角色，存在脚本命名冲突、`@/*` 路径别名泄漏到 server/packages、Next.js 隐式修改根 tsconfig 等问题。现在 `frontend/` 独立后：

- 根 `package.json` 纯做编排，零业务依赖
- 前端 `@/*` 路径别名天然隔离在 `frontend/` 内
- 各包 tsconfig 独立，互不干扰
- 新增第二个前端（如移动端 BFF）只需再加一个 workspace 成员

### 包命名空间

使用 `@portal/` 作为私有包 scope，所有包 `"private": true`，不发布到 npm。

| 包 | name | 角色 |
|---|---|---|
| `frontend/` | `@portal/web` | Next.js 前端 |
| `backend/` | `@portal/server` | Express REST API |
| `packages/shared/` | `@portal/shared` | 前后端共享类型/常量/验证器 |
| `packages/db/` | `@portal/db` | Drizzle schema + 迁移 |

### 参照 paperclip 保留的模式

| 模式 | paperclip 实现 | portal 对应 |
|------|---------------|-------------|
| 共享类型包 | `packages/shared` → types/constants/validators | `packages/shared` → 同 |
| 数据库包 | `packages/db` → Drizzle schema + migrations | `packages/db` → 同 |
| Express 后端 | `server/` → REST API + services | `backend/` → 同 |
| 前端 | `ui/` → React SPA | `frontend/` → Next.js App Router |
| workspace 工具 | pnpm workspaces | 同 + Turborepo |
| 模块化构建 | `pnpm -r typecheck && pnpm -r build` | `turbo typecheck && turbo build` |

### 未采纳的 paperclip 模式

| 模式 | 原因 |
|------|------|
| 内嵌 PGlite | portal 使用外部 PostgreSQL |
| Plugin worker 进程隔离 | portal 当前无插件系统需求 |
| Adapter registry | portal 不编排外部 agent |
| better-auth | portal 使用 NextAuth / 自有 JWT |

---

## 一、目录结构

```
portal/                              # monorepo root（workspace root）
├── frontend/                        # @portal/web — Next.js 前端
│   ├── app/                         #   Next.js App Router（已有）
│   ├── components/                  #   UI 组件（已有）
│   ├── modules/                     #   业务模块（已有）
│   ├── provider/                    #   Provider 链（已有）
│   ├── config/                      #   前端配置（已有）
│   ├── lib/                         #   工具函数（已有）
│   ├── store/                       #   Zustand stores（已有）
│   ├── hooks/                       #   自定义 hooks（已有）
│   ├── action/                      #   Server Actions（已有）
│   ├── ai/                          #   AI 接入层（已有）
│   ├── public/                      #   静态资源（已有）
│   ├── specs/                       #   前端代码规格（已有）
│   ├── docs/                        #   前端文档（已有）
│   ├── .storybook/                  #   Storybook 配置（已有）
│   ├── stories/                     #   Storybook stories（已有）
│   ├── middleware.ts                #   API 代理 + i18n（已有）
│   ├── next.config.js               #   （改造：添加 transpilePackages）
│   ├── tailwind.config.ts           #   （已有）
│   ├── postcss.config.js            #   （已有）
│   ├── tsconfig.json                #   （改造：添加 @portal/shared 路径）
│   ├── package.json                 #   （改造：改名 + 添加 shared 依赖）
│   ├── .env.local                   #   （已有）
│   ├── .gitignore                   #   （已有）
│   ├── AGENTS.md                    #   前端 Agent 手册（已有）
│   └── DESIGN.md                    #   UI 设计规范（已有）
│
├── backend/                         # @portal/server — Express REST API（新建）
│   ├── src/
│   │   ├── index.ts                 #   入口：loadConfig → createApp → listen
│   │   ├── app.ts                   #   Express app 工厂
│   │   ├── config.ts                #   类型安全的配置加载（Zod）
│   │   ├── routes/
│   │   │   ├── health.ts            #   GET /health（部署探针）
│   │   │   ├── projects.ts
│   │   │   ├── boards.ts
│   │   │   ├── tasks.ts
│   │   │   ├── calendars.ts
│   │   │   ├── chat.ts
│   │   │   ├── comments.ts
│   │   │   ├── email.ts
│   │   │   ├── user.ts
│   │   │   └── finance.ts
│   │   ├── services/                #   业务逻辑层
│   │   ├── middleware/
│   │   │   ├── auth.ts              #   租户/用户身份解析
│   │   │   ├── logger.ts            #   HTTP 请求日志（pino）
│   │   │   └── error-handler.ts     #   统一错误响应
│   │   └── errors.ts                #   HTTP 错误工厂（throw 模式）
│   ├── tsconfig.json
│   └── package.json
│
├── packages/
│   ├── shared/                      # @portal/shared — 前后端共享类型（新建）
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── types/
│   │   │   │   ├── index.ts
│   │   │   │   ├── project.ts
│   │   │   │   ├── board.ts
│   │   │   │   ├── task.ts
│   │   │   │   ├── user.ts
│   │   │   │   └── common.ts        # 分页/排序/响应信封
│   │   │   ├── constants.ts          # 状态枚举、业务常量
│   │   │   └── validators/
│   │   │       ├── index.ts
│   │   │       └── schemas.ts        # Zod schemas（前后端共用）
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── db/                          # @portal/db — Drizzle schema + 迁移（新建）
│       ├── src/
│       │   ├── index.ts
│       │   ├── client.ts             # createDb() 工厂
│       │   ├── schema/
│       │   │   ├── index.ts
│       │   │   ├── projects.ts
│       │   │   ├── boards.ts
│       │   │   ├── tasks.ts
│       │   │   ├── users.ts
│       │   │   └── tenants.ts
│       │   └── migrations/
│       ├── drizzle.config.ts
│       ├── tsconfig.json
│       └── package.json
│
├── ai-os-api/                       # 既有 Python API（独立管理，不纳入 pnpm workspace）
│   ├── app/
│   ├── tests/
│   ├── pyproject.toml
│   └── ...
│
├── tooling/                         # ★ 共享开发工具配置（新建）
│   ├── tsconfig/
│   │   ├── base.json                # 基础 tsconfig（backend/packages 继承）
│   │   └── node.json                # Node.js 后端专用 extends
│   └── eslint/
│       └── base.js                  # 共享 ESLint 配置
│
├── docs/                            # monorepo 级共享文档（已有）
│   └── prd/
│       └── monorepo.md              # 本文件
│
├── scripts/                         # 工具脚本（已有，Python）
├── skills/                          # Agent skills（已有）
│
├── .github/
│   └── workflows/
│       └── ci.yml                   # ★ GitHub Actions CI（新建）
│
├── package.json                     # ★ workspace root（新建，纯编排）
├── pnpm-workspace.yaml              # ★ workspace 定义（新建）
├── turbo.json                       # ★ Turborepo 构建编排（新建）
├── .npmrc                           # ★ pnpm 配置（新建）
├── .env.example                     # ★ 环境变量模板（新建）
├── .gitignore                       # ★ 根级 gitignore（新建）
├── AGENTS.md                        # monorepo 级 Agent 手册（已有）
├── CURSOR.md                        # Cursor 使用说明（已有）
└── README.md                        # ★ 项目 README（新建）
```

---

## 二、pnpm-workspace.yaml

```yaml
packages:
  - frontend
  - backend
  - packages/*
```

> `ai-os-api/` 是 Python 项目，不纳入 pnpm workspace。
> 根 `package.json` 为 workspace root，自动成为 workspace 成员但不含业务依赖。

---

## 三、Turborepo 构建编排

```jsonc
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "clean": {
      "cache": false
    }
  }
}
```

---

## 四、.npmrc

```ini
# 严格依赖隔离，防止幽灵依赖
shamefully-hoist=false
# Next.js 需要部分 hoisting 才能正常工作
public-hoist-pattern[]=*eslint*
public-hoist-pattern[]=*prettier*
public-hoist-pattern[]=*next*
```

> 若 Next.js 出现找不到依赖的报错，按需添加 `public-hoist-pattern`。

---

## 五、package.json 配置

### 5.1 根 package.json（workspace root — 纯编排，零业务依赖）

```jsonc
{
  "name": "portal",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "dev:web": "pnpm --filter @portal/web dev",
    "dev:server": "pnpm --filter @portal/server dev",
    "build": "turbo build",
    "typecheck": "turbo typecheck",
    "test": "turbo test",
    "lint": "turbo lint",
    "clean": "turbo clean",
    "db:generate": "pnpm --filter @portal/db generate",
    "db:migrate": "pnpm --filter @portal/db migrate"
  },
  "devDependencies": {
    "turbo": "^2.5.0"
  },
  "packageManager": "pnpm@9.15.4"
}
```

### 5.2 frontend/package.json（@portal/web — 在现有基础上改造）

在现有 `package.json` 基础上修改：

```jsonc
{
  "name": "@portal/web",          // ← 从 "dash-tail" 改名
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",  // ← 新增
    "clean": "rm -rf .next",      // ← 新增
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  },
  "dependencies": {
    "@portal/shared": "workspace:*",  // ← 新增
    // ... 保留现有全部 dependencies 不变 ...
  },
  "devDependencies": {
    // ... 保留现有全部 devDependencies 不变 ...
  }
}
```

**关键变更**：
- `name` 从 `"dash-tail"` 改为 `"@portal/web"`
- 添加 `@portal/shared` 到 `dependencies`
- 添加 `typecheck` 和 `clean` 脚本（Turborepo 需要）
- 其余所有 dependencies / devDependencies **保持不变**

### 5.3 backend/package.json

```jsonc
{
  "name": "@portal/server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -b",
    "typecheck": "tsc --noEmit",
    "start": "node dist/index.js",
    "test": "vitest run",
    "clean": "rm -rf dist tsconfig.tsbuildinfo"
  },
  "dependencies": {
    "@portal/shared": "workspace:*",
    "@portal/db": "workspace:*",
    "express": "^5.1.0",
    "cors": "^2.8.5",
    "drizzle-orm": "^0.38.4",
    "pino": "^9.6.0",
    "pino-http": "^10.4.0",
    "zod": "^3.24.2",
    "dotenv": "^16.4.7"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/cors": "^2.8.17",
    "@types/node": "^22.0.0",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3",
    "vitest": "^3.0.5"
  }
}
```

### 5.4 packages/shared/package.json

```jsonc
{
  "name": "@portal/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*.ts"
  },
  "publishConfig": {
    "exports": {
      ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
      "./*": { "types": "./dist/*.d.ts", "import": "./dist/*.js" }
    }
  },
  "scripts": {
    "build": "tsc -b",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist tsconfig.tsbuildinfo"
  },
  "dependencies": {
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "typescript": "^5.7.3"
  }
}
```

> **注意**：zod 在 `dependencies`（非 devDependencies），因为 validators 是运行时导出。

### 5.5 packages/db/package.json

```jsonc
{
  "name": "@portal/db",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*.ts"
  },
  "scripts": {
    "build": "tsc -b",
    "typecheck": "tsc --noEmit",
    "generate": "drizzle-kit generate",
    "migrate": "tsx src/migrate.ts",
    "clean": "rm -rf dist tsconfig.tsbuildinfo"
  },
  "dependencies": {
    "@portal/shared": "workspace:*",
    "drizzle-orm": "^0.38.4",
    "postgres": "^3.4.5"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "drizzle-kit": "^0.31.9",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3"
  }
}
```

---

## 六、TypeScript 配置

### 6.1 tooling/tsconfig/base.json（backend / packages 继承）

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "strictNullChecks": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}
```

### 6.2 tooling/tsconfig/node.json（backend / db 使用）

```jsonc
{
  "extends": "./base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### 6.3 frontend/tsconfig.json（在现有基础上改造）

前端 tsconfig **保持现有结构不变**，仅添加 `@portal/shared` 路径映射：

```jsonc
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "target": "esnext",
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "incremental": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "noUnusedParameters": false,
    "preserveWatchOutput": true,
    "strictNullChecks": true,
    "composite": false,
    "declaration": true,
    "declarationMap": true,
    "forceConsistentCasingInFileNames": true,
    "inlineSources": false,
    "noUnusedLocals": false,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"],
      "@portal/shared": ["../packages/shared/src"],       // ← 新增
      "@portal/shared/*": ["../packages/shared/src/*"]    // ← 新增
    }
  },
  "include": [
    "next-env.d.ts",
    ".next/types/**/*.ts",
    "**/*.ts",
    "**/*.tsx"
  ],
  "exclude": ["node_modules", "stories"]
}
```

**变更项**：仅在 `paths` 中添加 `@portal/shared` 和 `@portal/shared/*`，相对路径 `../packages/shared/src` 从 `frontend/` 指向 `packages/shared/src/`。

### 6.4 backend/tsconfig.json

```jsonc
{
  "extends": "../tooling/tsconfig/node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### 6.5 packages/shared/tsconfig.json

```jsonc
{
  "extends": "../../tooling/tsconfig/node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### 6.6 packages/db/tsconfig.json

```jsonc
{
  "extends": "../../tooling/tsconfig/node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 七、后端骨架关键文件

### 7.1 backend/src/index.ts

```typescript
import "dotenv/config";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { logger } from "./middleware/logger.js";

const config = loadConfig();
const app = createApp(config);

app.listen(config.port, () => {
  logger.info({ port: config.port }, "portal-server listening");
});
```

### 7.2 backend/src/config.ts

```typescript
import { z } from "zod";

const configSchema = z.object({
  port: z.coerce.number().default(8000),
  dbUrl: z.string().min(1, "DATABASE_URL is required"),
  defaultTenantId: z.string().default(""),
  defaultWorkspaceId: z.string().default(""),
  defaultUserId: z.string().default(""),
  nodeEnv: z.enum(["development", "production", "test"]).default("development"),
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(): AppConfig {
  return configSchema.parse({
    port: process.env.PORT,
    dbUrl: process.env.DATABASE_URL,
    defaultTenantId: process.env.DEFAULT_TENANT_ID,
    defaultWorkspaceId: process.env.DEFAULT_WORKSPACE_ID,
    defaultUserId: process.env.DEFAULT_USER_ID,
    nodeEnv: process.env.NODE_ENV,
  });
}
```

### 7.3 backend/src/app.ts

```typescript
import express, { Router } from "express";
import cors from "cors";
import { httpLogger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { authMiddleware } from "./middleware/auth.js";
import { healthRoutes } from "./routes/health.js";
import { projectRoutes } from "./routes/projects.js";
import { boardRoutes } from "./routes/boards.js";
import { taskRoutes } from "./routes/tasks.js";
import { calendarRoutes } from "./routes/calendars.js";
import { chatRoutes } from "./routes/chat.js";
import { commentRoutes } from "./routes/comments.js";
import { emailRoutes } from "./routes/email.js";
import { userRoutes } from "./routes/user.js";
import { financeRoutes } from "./routes/finance.js";
import type { AppConfig } from "./config.js";

export function createApp(config: AppConfig) {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "2mb" }));
  app.use(httpLogger);

  app.use("/health", healthRoutes());

  app.use(authMiddleware(config));

  const api = Router();
  api.use("/projects", projectRoutes());
  api.use("/boards", boardRoutes());
  api.use("/tasks", taskRoutes());
  api.use("/calendars", calendarRoutes());
  api.use("/chat", chatRoutes());
  api.use("/comments", commentRoutes());
  api.use("/email", emailRoutes());
  api.use("/user", userRoutes());
  api.use("/finance", financeRoutes());

  app.use("/api/v1", api);

  app.use(errorHandler);
  return app;
}
```

### 7.4 backend/src/middleware/auth.ts

```typescript
import type { RequestHandler } from "express";
import type { AppConfig } from "../config.js";

export interface RequestContext {
  tenantId: string;
  workspaceId: string;
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      ctx: RequestContext;
    }
  }
}

export function authMiddleware(config: AppConfig): RequestHandler {
  return (req, _res, next) => {
    req.ctx = {
      tenantId:
        (req.headers["x-tenant-id"] as string) || config.defaultTenantId,
      workspaceId:
        (req.headers["x-workspace-id"] as string) || config.defaultWorkspaceId,
      userId:
        (req.headers["x-user-id"] as string) || config.defaultUserId,
    };
    next();
  };
}
```

### 7.5 backend/src/middleware/logger.ts

```typescript
import pino from "pino";
import pinoHttp from "pino-http";

export const logger = pino({
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino/file", options: { destination: 1 } }
      : undefined,
});

export const httpLogger = pinoHttp({ logger });
```

### 7.6 backend/src/middleware/error-handler.ts

```typescript
import type { ErrorRequestHandler } from "express";
import { logger } from "./logger.js";
import { HttpError } from "../errors.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  logger.error({ err }, "unhandled error");
  res.status(500).json({ error: "Internal server error" });
};
```

### 7.7 backend/src/errors.ts（throw 模式，参照 paperclip `authz.ts`）

```typescript
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function badRequest(message: string): never {
  throw new HttpError(400, message);
}
export function unauthorized(message = "Unauthorized"): never {
  throw new HttpError(401, message);
}
export function forbidden(message = "Forbidden"): never {
  throw new HttpError(403, message);
}
export function notFound(message = "Not found"): never {
  throw new HttpError(404, message);
}
export function conflict(message: string): never {
  throw new HttpError(409, message);
}
export function validationError(message: string): never {
  throw new HttpError(422, message);
}
```

### 7.8 backend/src/routes/health.ts

```typescript
import { Router } from "express";

export function healthRoutes() {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  return router;
}
```

---

## 八、共享包骨架

### 8.1 packages/shared/src/index.ts

```typescript
export * from "./types/index.js";
export * from "./constants.js";
export * from "./validators/index.js";
```

### 8.2 packages/shared/src/constants.ts（示例）

```typescript
export const TASK_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
  "cancelled",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const BOARD_TYPES = ["kanban", "list", "calendar"] as const;
export type BoardType = (typeof BOARD_TYPES)[number];

export const PROJECT_STATUSES = [
  "active",
  "archived",
  "completed",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
```

### 8.3 packages/shared/src/types/common.ts（示例）

```typescript
export interface PaginatedRequest {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiErrorResponse {
  error: string;
  details?: unknown;
}
```

---

## 九、数据库包骨架

### 9.1 packages/db/src/client.ts

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

export function createDb(connectionString: string) {
  const client = postgres(connectionString);
  return drizzle(client, { schema });
}

export type Db = ReturnType<typeof createDb>;
```

### 9.2 packages/db/src/index.ts

```typescript
export { createDb, type Db } from "./client.js";
export * from "./schema/index.js";
```

### 9.3 packages/db/drizzle.config.ts

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/*.ts",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

---

## 十、前端适配（对 frontend/ 现有代码的最小改动）

### 10.1 next.config.js — 添加 transpilePackages

```javascript
const nextConfig = {
  transpilePackages: ["@portal/shared"],  // ← 新增
  webpack(config) {
    // ... 保留现有 SVG 相关 webpack 配置 ...
    return config;
  },
  images: {
    // ... 保留现有 remotePatterns 配置 ...
  },
};

module.exports = nextConfig;
```

### 10.2 middleware.ts — 无需修改

当前 `middleware.ts` 已通过环境变量指向 backend：

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const AI_BASE  = process.env.NEXT_PUBLIC_AI_URL  ?? "http://localhost:8001/api/v1";
```

保持不变。

### 10.3 前端消费 shared 包示例

```typescript
import { TASK_STATUSES, type TaskStatus } from "@portal/shared";
import type { PaginatedResponse } from "@portal/shared/types/common";
```

---

## 十一、环境变量管理

### .env.example（monorepo 根）

```bash
# ===== Portal Backend (Node.js) =====
PORT=8000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/portal
NODE_ENV=development

# Multi-tenant defaults (local dev)
DEFAULT_TENANT_ID=00000000-0000-0000-0000-000000000001
DEFAULT_WORKSPACE_ID=00000000-0000-0000-0000-000000000001
DEFAULT_USER_ID=00000000-0000-0000-0000-000000000001

# ===== Portal Frontend (Next.js) =====
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_AI_URL=http://localhost:8001/api/v1

# Auth
AUTH_SECRET=<random-32-char-string>
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Hermes AI Gateway
HERMES_BASE_URL=http://localhost:8642/v1
HERMES_API_KEY=change-me-local-dev
HERMES_MODEL=default
HERMES_GATEWAY_BASE_URL=http://localhost:8642
HERMES_GATEWAY_TOKEN=change-me-local-dev
```

> 后端使用 `dotenv` 从根 `.env` 加载；前端使用 Next.js 内置的 `frontend/.env.local`（已有）。
> 两者可以共用一份 `.env`（放在根目录），也可以各自维护。推荐开发阶段统一放根目录。

---

## 十二、CI/CD 基础

### .github/workflows/ci.yml

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24.14.1
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

---

## 十三、.gitignore（monorepo 根级）

```gitignore
# Dependencies
node_modules/

# Build outputs
dist/
.next/
tsconfig.tsbuildinfo

# Turbo
.turbo/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store
Thumbs.db

# Python (ai-os-api)
__pycache__/
*.pyc
.pytest_cache/
.venv/

# Storybook
storybook-static/

# Debug
debug-storybook.log
*.log
```

---

## 十四、开发启动流程

| 命令 | 端口 | 说明 |
|------|------|------|
| `pnpm dev` | 3000 + 8000 | turbo 并行启动前端 + 后端 |
| `pnpm dev:web` | 3000 | 仅启动 Next.js 前端 |
| `pnpm dev:server` | 8000 | 仅启动 Express 后端 |
| `pnpm build` | — | turbo 按依赖拓扑构建所有包 |
| `pnpm typecheck` | — | 全包类型检查 |
| `pnpm test` | — | 全包测试 |
| `pnpm db:generate` | — | Drizzle Kit 生成迁移文件 |
| `pnpm db:migrate` | — | 执行 pending 迁移 |

### 验证清单

```bash
# 1. 进入 portal 根目录
cd portal

# 2. 安装依赖
pnpm install

# 3. 验证后端启动
pnpm dev:server
curl http://localhost:8000/health     # → {"status":"ok","timestamp":"..."}

# 4. 验证前端启动
pnpm dev:web
# 浏览器打开 http://localhost:3000

# 5. 全量检查
pnpm typecheck
pnpm test
pnpm build
```

---

## 十五、实施步骤

> 前端代码已迁移至 `frontend/`，`backend/` 和 `packages/` 目录已创建。以下为剩余操作。

| # | 操作 | 验证 |
|---|------|------|
| 1 | 创建根 `package.json`（见 5.1） | 有效 JSON |
| 2 | 创建 `pnpm-workspace.yaml`（见第二章） | `pnpm ls -r` 列出 4 个 workspace 成员 |
| 3 | 创建 `turbo.json`（见第三章） | 有效 JSON |
| 4 | 创建 `.npmrc`（见第四章） | — |
| 5 | 创建 `tooling/tsconfig/base.json` + `node.json`（见 6.1、6.2） | 有效 JSON |
| 6 | 搭建 `packages/shared/` 骨架：package.json + tsconfig.json + src/ | `pnpm --filter @portal/shared typecheck` 通过 |
| 7 | 搭建 `packages/db/` 骨架：package.json + tsconfig.json + drizzle.config.ts + src/ | `pnpm --filter @portal/db typecheck` 通过 |
| 8 | 搭建 `backend/` 完整骨架：package.json + tsconfig.json + src/ 全部文件 | `pnpm --filter @portal/server typecheck` 通过 |
| 9 | 改造 `frontend/package.json`：改 name 为 `@portal/web`、添加 `@portal/shared` 依赖、添加 typecheck/clean 脚本 | `pnpm --filter @portal/web typecheck` 通过 |
| 10 | 改造 `frontend/tsconfig.json`：添加 `@portal/shared` paths | IDE 路径解析正常 |
| 11 | 改造 `frontend/next.config.js`：添加 `transpilePackages` | `pnpm dev:web` 正常启动 |
| 12 | 创建根 `.gitignore`（见第十三章） | — |
| 13 | 创建 `.env.example`（见第十一章） | — |
| 14 | 创建 `.github/workflows/ci.yml`（见第十二章） | — |
| 15 | `pnpm install` | lockfile 生成无错 |
| 16 | `pnpm typecheck` | 全部通过 |
| 17 | `pnpm dev` | 前端 :3000 + 后端 :8000 均可访问 |
| 18 | `pnpm build` | 全部构建成功 |
| 19 | 初始化 git 仓库并推送 | `git init && git add . && git commit && git remote add origin <url> && git push` |

---

## 十六、依赖拓扑

```
@portal/shared      ← 零依赖（仅 zod）
    ↑
@portal/db          ← 依赖 shared
    ↑
@portal/server      ← 依赖 shared + db
@portal/web         ← 依赖 shared
```

Turborepo 按此拓扑顺序执行 `build`：`shared → db → server / web`（server 和 web 可并行）。

---

## 十七、风险与对策

| # | 风险 | 影响 | 对策 |
|---|------|------|------|
| 1 | **pnpm hoisting 与 Next.js 冲突** | Next.js 依赖某些包必须 hoisted | `.npmrc` 配置 `public-hoist-pattern` 按需放行 |
| 2 | **前端 `@/*` 路径别名泄漏** | `@/backend/...` 或 `@/packages/...` 被意外导入 | `frontend/` 独立目录天然隔离；tsconfig exclude 已覆盖 |
| 3 | **workspace 包的 TypeScript 源码在 Next.js 中不识别** | 编译报错 | `next.config.js` 配置 `transpilePackages: ["@portal/shared"]` |
| 4 | **lockfile 规模**：frontend 依赖 150+ 包 | 首次 install 较慢 | pnpm store + CI cache 缓解 |
| 5 | **ai-os-api（Python）与 pnpm workspace 互不影响** | 无 | Python 项目不纳入 workspace；各自用 uv / pip 管理 |
| 6 | **根 `.env` 与 `frontend/.env.local` 的优先级** | 环境变量来源混乱 | 后端从根 `.env` 读取（dotenv）；前端从 `frontend/.env.local` 读取（Next.js 内置）；文档明确说明 |
| 7 | **两套文档体系**：`portal/docs/`（monorepo 级）vs `frontend/docs/`（前端专属） | 文档归属不清 | monorepo 级 PRD/方案放 `portal/docs/`；前端代码规格/Agent 手册放 `frontend/docs/` + `frontend/specs/` |

---

## 十八、Scripts 工具集（参照 paperclip 模式）

> 参照 `paperclip/scripts/` 的一键启动、一键停止、一键备份、一键发布模式，在 `portal/scripts/` 建立等效脚本。

### 18.1 目录结构

```
portal/scripts/
├── dev-runner.ts              # 一键启动（backend + frontend 联动）
├── kill-dev.sh                # 一键停止（kill 所有 portal dev 进程 + PG）
├── backup-db.sh               # 一键备份（pg_dump + gzip）
├── release.sh                 # 一键发布（canary / stable 双通道）
├── release-lib.sh             # 发布辅助库（版本计算/标签/npm 验证）
├── prepare-frontend-dist.sh   # 构建前端产物并复制到 backend
└── gen-*.py                   # 已有 Storybook 生成脚本（保留）
```

### 18.2 一键启动：`pnpm dev`

```bash
# portal/package.json
"dev": "node --import tsx scripts/dev-runner.ts watch"
```

`dev-runner.ts` 工作流程：

1. 检测 `portal/` 根目录，读取端口配置（`BACKEND_PORT=8000`, `FRONTEND_PORT=3000`）
2. 执行 `pnpm --filter @portal/db exec tsx src/migrate.ts`（自动迁移）
3. 启动 backend：`pnpm --filter @portal/server dev`
4. 等待 2s 后启动 frontend：`pnpm --filter @portal/web dev`（注入 `PORTAL_API_URL`）
5. 写入状态文件 `.portal/dev-status/dev-server.json`
6. 任意子进程退出时自动清理并终止全部

### 18.3 一键停止：`pnpm dev:stop`

```bash
# portal/package.json
"dev:stop": "bash scripts/kill-dev.sh"
```

`kill-dev.sh` 工作流程（参照 paperclip 的 `kill-dev.sh`）：

1. `ps aux | grep /portal/ | grep node` → 收集所有 portal Node 进程
2. 扫描 `.portal/instances/*/db/postmaster.pid` → 收集嵌入式 PG 进程
3. SIGTERM → 等待 → SIGKILL 兜底
4. 支持 `--dry` 预览模式

### 18.4 一键备份：`pnpm db:backup`

```bash
# portal/package.json
"db:backup": "bash scripts/backup-db.sh"
```

```bash
# 用法
pnpm db:backup                          # 默认名 portal-db-YYYYMMDDTHHMMSSZ
pnpm db:backup --name before-migration  # 自定义名称
pnpm db:backup --output /backups/       # 自定义输出目录
```

- 输出至 `.portal/backups/` 目录
- 使用 `pg_dump --no-owner --no-privileges | gzip`
- 从 `DATABASE_URL` 环境变量或 `.env` 文件读取连接串

### 18.5 一键发布：`pnpm release`

```bash
# portal/package.json
"release": "bash scripts/release.sh",
"release:canary": "bash scripts/release.sh canary",
"release:stable": "bash scripts/release.sh stable"
```

`release.sh` 6 步流程（参照 paperclip 的 7 步流程，合并了 CLI 构建步骤）：

| 步骤 | 操作 |
|------|------|
| 1/6 | **Verification gate** — `pnpm -r typecheck && pnpm test && pnpm build` |
| 2/6 | **Build workspace artifacts** — `pnpm build && prepare-frontend-dist.sh` |
| 3/6 | **Rewrite versions** — 所有非 private 包设为目标版本 |
| 4/6 | **Publish to npm** — `pnpm publish --no-git-checks --tag <dist-tag>` |
| 5/6 | **Verify npm availability** — 轮询确认包可安装 |
| 6/6 | **Create git tag** — `vYYYY.MDD.P` 或 `canary/vYYYY.MDD.P-canary.N` |

版本格式：`YYYY.MDD.P`（与 paperclip 一致）

`release-lib.sh` 提供：版本计算、git tag 管理、npm 验证、workspace 包列表等辅助函数。

### 18.6 构建前端产物：`pnpm prepare-frontend-dist`

```bash
# portal/package.json
"prepare-frontend-dist": "bash scripts/prepare-frontend-dist.sh"
```

将 `frontend/.next` 构建产物复制到 `backend/public-frontend/`，使 `@portal/server` 发布包可独立静态服务前端。

### 18.7 与 paperclip scripts 的对照

| paperclip | portal | 差异 |
|-----------|--------|------|
| `scripts/dev-runner.ts` | `scripts/dev-runner.ts` | portal 无 worktree/Vite 中间件，简化为双进程启动 |
| `scripts/dev-service.ts` | — | portal 暂不实现本地服务注册表 |
| `scripts/kill-dev.sh` | `scripts/kill-dev.sh` | 进程匹配模式改为 `/portal/` |
| `scripts/backup-db.sh` | `scripts/backup-db.sh` | 备份目录改为 `.portal/backups/` |
| `scripts/release.sh` | `scripts/release.sh` | portal 无 CLI 包，省略 CLI 构建步骤 |
| `scripts/release-lib.sh` | `scripts/release-lib.sh` | 变量名 `PORTAL_ROOT` 替代 `REPO_ROOT` |
| `scripts/prepare-server-ui-dist.sh` | `scripts/prepare-frontend-dist.sh` | 源目录 `frontend/.next`，目标 `backend/public-frontend/` |

---

## 十九、未来演进（不在本次范围，仅记录）

| 方向 | 说明 |
|------|------|
| ai-os-api → backend 整合 | 将 Python API 功能逐步迁移至 Node.js backend，最终统一技术栈 |
| WebSocket 支持 | 后端当前仅 REST；如需实时推送（聊天、通知），添加 `ws` 或 `socket.io` |
| 认证体系升级 | 从 header 注入 → JWT + refresh token 完整认证流 |
| Docker Compose | 一键启动 PostgreSQL + backend + frontend 的容器化开发环境 |
| Changeset 版本管理 | 如果未来需要发布 shared 包到内部 registry |
| 移动端 BFF | 如需第二个前端，只需在 workspace 中新增一个成员 |
