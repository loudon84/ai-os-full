# Portal 独立 Monorepo 升级方案

> 将 portal 项目从 paperclip 仓库内的 Next.js 单体应用，升级为 TypeScript + Node.js 全栈 monorepo，**独立 git 仓库**，与 paperclip 无任何代码/依赖关联。
> 架构参照 paperclip 的 monorepo 模式（server/ + ui/ + packages/*），适配 portal 的实际场景做取舍。

---

## 〇、设计决策与取舍

### 为什么前端保留在仓库根目录

portal 前端（Next.js）已有 `app/`、`components/`、`modules/`、`provider/`、`config/`、`lib/`、`store/`、`hooks/` 等 20+ 顶级目录，数百个文件使用 `@/*` 路径别名。若将其迁入 `apps/web/`，所有 import 路径需全量修改，风险极高且收益有限。

**决策**：前端代码留在仓库根（根 package.json 即前端包），后端和共享包作为 workspace 子成员。这与 paperclip 的 `server/ + ui/ + packages/*` 平铺模式一致——只是 portal 中"ui"角色由根目录承担。

### 为什么不用 `@paperclipai/` 命名空间

portal 是独立项目，使用 `@portal/` 作为私有包 scope。所有包 `"private": true`，不发布到 npm，scope 仅用于 workspace 内部引用。

### 参照 paperclip 保留的模式

| 模式 | paperclip 实现 | portal 对应 |
|------|---------------|-------------|
| 共享类型包 | `packages/shared` → types/constants/validators | `packages/shared` → 同 |
| 数据库包 | `packages/db` → Drizzle schema + migrations | `packages/db` → 同 |
| Express 后端 | `server/` → REST API + services | `server/` → 同 |
| 前端 | `ui/` → React SPA | 根目录 → Next.js App Router |
| workspace 工具 | pnpm workspaces | 同 + Turborepo |
| 模块化构建 | `pnpm -r typecheck && pnpm -r build` | `turbo typecheck && turbo build` |

### 未采纳的 paperclip 模式

| 模式 | 原因 |
|------|------|
| 内嵌 PGlite | portal 使用外部 PostgreSQL，暂不需要嵌入式开发库 |
| Plugin worker 进程隔离 | portal 当前无插件系统需求 |
| Adapter registry | portal 不编排外部 agent |
| better-auth | portal 使用 NextAuth / 自有 JWT |

---

## 一、独立仓库目录结构

```
portal/                          # 仓库根 = Next.js 前端 + workspace root
├── server/                      # ★ Express REST API（新建）
│   ├── src/
│   │   ├── index.ts             #   入口：loadConfig → createApp → listen
│   │   ├── app.ts               #   Express app 工厂
│   │   ├── config.ts            #   类型安全的配置加载
│   │   ├── routes/
│   │   │   ├── health.ts        #   GET /health（部署探针）
│   │   │   ├── projects.ts
│   │   │   ├── boards.ts
│   │   │   ├── tasks.ts
│   │   │   ├── calendars.ts
│   │   │   ├── chat.ts
│   │   │   ├── comments.ts
│   │   │   ├── email.ts
│   │   │   ├── user.ts
│   │   │   └── finance.ts
│   │   ├── services/            #   业务逻辑层
│   │   ├── middleware/
│   │   │   ├── auth.ts          #   租户/用户身份解析
│   │   │   ├── logger.ts        #   HTTP 请求日志（pino）
│   │   │   └── error-handler.ts #   统一错误响应
│   │   └── errors.ts            #   HTTP 错误工厂（throw 模式）
│   ├── tsconfig.json
│   └── package.json             #   @portal/server
│
├── packages/
│   ├── shared/                  # ★ 前后端共享类型/常量/验证器（新建）
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── types/
│   │   │   │   ├── index.ts
│   │   │   │   ├── project.ts
│   │   │   │   ├── board.ts
│   │   │   │   ├── task.ts
│   │   │   │   ├── user.ts
│   │   │   │   └── common.ts    # 分页/排序/响应信封等通用类型
│   │   │   ├── constants.ts     # 状态枚举、业务常量
│   │   │   └── validators/
│   │   │       ├── index.ts
│   │   │       └── schemas.ts   # Zod schemas（前后端共用）
│   │   ├── tsconfig.json
│   │   └── package.json         # @portal/shared
│   │
│   └── db/                      # ★ Drizzle schema + 迁移（新建）
│       ├── src/
│       │   ├── index.ts         # 导出 DB client + schema
│       │   ├── client.ts        # createDb() 工厂
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
│       └── package.json         # @portal/db
│
├── app/                         # （已有）Next.js App Router
├── components/                  # （已有）
├── modules/                     # （已有）
├── provider/                    # （已有）
├── config/                      # （已有）
├── lib/                         # （已有）
├── store/                       # （已有）
├── hooks/                       # （已有）
├── action/                      # （已有）
├── ai/                          # （已有）
├── public/                      # （已有）
│
├── tooling/                     # ★ 共享开发工具配置（新建）
│   ├── tsconfig/
│   │   ├── base.json            # 根 tsconfig（所有包继承）
│   │   ├── nextjs.json          # Next.js 专用 extends
│   │   └── node.json            # Node.js 后端专用 extends
│   └── eslint/
│       └── base.js              # 共享 ESLint 配置
│
├── .github/
│   └── workflows/
│       └── ci.yml               # ★ GitHub Actions CI（新建）
│
├── middleware.ts                 # （已有，调整 API 代理目标）
├── next.config.js               # （已有）
├── tailwind.config.ts           # （已有）
├── postcss.config.js            # （已有）
├── tsconfig.json                # （已有，前端用，继承 tooling/tsconfig/nextjs.json）
├── package.json                 # @portal/web — workspace root + Next.js 前端
├── pnpm-workspace.yaml          # ★ 独立 workspace 定义（新建）
├── turbo.json                   # ★ Turborepo 构建编排（新建）
├── .env.example                 # ★ 环境变量模板（新建）
├── .gitignore                   # （已有，补充 server/dist 等）
└── README.md
```

---

## 二、pnpm-workspace.yaml

```yaml
packages:
  - server
  - packages/*
```

> 根目录（Next.js 前端）作为 workspace root 自动成为成员，无需显式列出。

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

## 四、package.json 配置

### 4.1 根 package.json（@portal/web — 同时承担 workspace root 和 Next.js 前端）

在现有 `package.json` 基础上修改：

```jsonc
{
  "name": "@portal/web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    // --- 前端 ---
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    // --- workspace 编排 ---
    "dev:server": "pnpm --filter @portal/server dev",
    "dev:all": "turbo dev",
    "build:all": "turbo build",
    "typecheck:all": "turbo typecheck",
    "test:all": "turbo test",
    "clean:all": "turbo clean",
    // --- 数据库 ---
    "db:generate": "pnpm --filter @portal/db generate",
    "db:migrate": "pnpm --filter @portal/db migrate"
  },
  "dependencies": {
    "@portal/shared": "workspace:*",
    // ... 保留现有全部 dependencies ...
  },
  "devDependencies": {
    "turbo": "^2.5.0",
    // ... 保留现有全部 devDependencies ...
  },
  "packageManager": "pnpm@9.15.4"
}
```

**关键变更**：
- `name` 从 `dash-tail` 改为 `@portal/web`
- 添加 `"type": "module"`
- 添加 `@portal/shared` 依赖
- 添加 `turbo` 开发依赖和 workspace 编排脚本
- 保留现有所有 Next.js 依赖不变

### 4.2 server/package.json

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

### 4.3 packages/shared/package.json

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

> **注意**：zod 在 `dependencies` 中（非 devDependencies），因为 validators 是运行时导出。
> `exports` 字段采用 paperclip `packages/shared` 的双层模式——开发时直接指向 src，发布时指向 dist。

### 4.4 packages/db/package.json

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

## 五、TypeScript 配置

### 5.1 tooling/tsconfig/base.json（所有包继承的根配置）

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

### 5.2 tooling/tsconfig/node.json（server / db 使用）

```jsonc
{
  "extends": "./base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### 5.3 tooling/tsconfig/nextjs.json（前端使用）

```jsonc
{
  "extends": "./base.json",
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "noEmit": true,
    "incremental": true,
    "plugins": [{ "name": "next" }]
  }
}
```

### 5.4 根 tsconfig.json（前端 — 在现有基础上改造）

```jsonc
{
  "extends": "./tooling/tsconfig/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@portal/shared": ["./packages/shared/src"],
      "@portal/shared/*": ["./packages/shared/src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    ".next/types/**/*.ts",
    "**/*.ts",
    "**/*.tsx"
  ],
  "exclude": [
    "node_modules",
    "server",
    "packages",
    "stories",
    "tooling"
  ]
}
```

### 5.5 server/tsconfig.json

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

### 5.6 packages/shared/tsconfig.json

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

### 5.7 packages/db/tsconfig.json

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

## 六、后端骨架关键文件

### 6.1 server/src/index.ts

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

### 6.2 server/src/config.ts

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

### 6.3 server/src/app.ts

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

### 6.4 server/src/middleware/auth.ts

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

### 6.5 server/src/middleware/logger.ts

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

### 6.6 server/src/middleware/error-handler.ts

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

### 6.7 server/src/errors.ts（throw 模式，参照 paperclip `authz.ts`）

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

### 6.8 server/src/routes/health.ts

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

## 七、共享包骨架

### 7.1 packages/shared/src/index.ts

```typescript
export * from "./types/index.js";
export * from "./constants.js";
export * from "./validators/index.js";
```

### 7.2 packages/shared/src/constants.ts（示例）

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

### 7.3 packages/shared/src/types/common.ts（示例）

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

## 八、数据库包骨架

### 8.1 packages/db/src/client.ts

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

### 8.2 packages/db/src/index.ts

```typescript
export { createDb, type Db } from "./client.js";
export * from "./schema/index.js";
```

### 8.3 packages/db/drizzle.config.ts

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

## 九、前端适配

### 9.1 middleware.ts 调整（代理目标确认）

当前 `middleware.ts` 已使用环境变量指向 backend，无需大幅修改：

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const AI_BASE  = process.env.NEXT_PUBLIC_AI_URL  ?? "http://localhost:8001/api/v1";
```

保持不变。前端对 backend 的所有请求通过 Next.js middleware 代理转发。

### 9.2 前端消费 shared 包

在 `next.config.js` 中添加 transpilePackages 以支持直接导入 workspace 包的 TypeScript 源码：

```javascript
const nextConfig = {
  transpilePackages: ["@portal/shared"],
  // ... 保留现有 webpack / images 配置 ...
};
```

前端代码中使用：

```typescript
import { TASK_STATUSES, type TaskStatus } from "@portal/shared";
import type { PaginatedResponse } from "@portal/shared/types/common";
```

---

## 十、环境变量管理

### 10.1 .env.example

```bash
# ===== Portal Server =====
PORT=8000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/portal
NODE_ENV=development

# Multi-tenant defaults (local dev)
DEFAULT_TENANT_ID=00000000-0000-0000-0000-000000000001
DEFAULT_WORKSPACE_ID=00000000-0000-0000-0000-000000000001
DEFAULT_USER_ID=00000000-0000-0000-0000-000000000001

# ===== Portal Web (Next.js) =====
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

---

## 十一、CI/CD 基础

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
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck:all
      - run: pnpm test:all
      - run: pnpm build:all
```

---

## 十二、.gitignore 补充

在现有 `.gitignore` 中追加：

```gitignore
# Server
server/dist/
server/tsconfig.tsbuildinfo

# Packages
packages/*/dist/
packages/*/tsconfig.tsbuildinfo

# Tooling
tooling/*/dist/

# Turbo
.turbo/

# Environment
.env
.env.local
.env.*.local
```

---

## 十三、开发启动流程

| 步骤 | 命令 | 端口 | 说明 |
|------|------|------|------|
| 一键启动（推荐） | `pnpm dev:all` | 3000 + 8000 | turbo 并行启动前端 + 后端 |
| 仅前端 | `pnpm dev` | 3000 | Next.js dev server |
| 仅后端 | `pnpm dev:server` | 8000 | Express + tsx watch |
| 构建全部 | `pnpm build:all` | — | turbo 依赖拓扑构建 |
| 类型检查 | `pnpm typecheck:all` | — | 全包类型检查 |
| 数据库迁移生成 | `pnpm db:generate` | — | Drizzle Kit 生成迁移 |
| 数据库迁移执行 | `pnpm db:migrate` | — | 执行 pending 迁移 |

### 验证清单

```bash
# 1. 安装依赖
pnpm install

# 2. 启动 backend
pnpm dev:server
curl http://localhost:8000/health     # → {"status":"ok","timestamp":"..."}

# 3. 启动 frontend
pnpm dev
# 浏览器打开 http://localhost:3000

# 4. 全量检查
pnpm typecheck:all
pnpm test:all
pnpm build:all
```

---

## 十四、从 paperclip 仓库迁出步骤

> 当前 portal 代码位于 `paperclip/portal/`，以下是迁移至独立仓库的操作流程。

| 步骤 | 操作 | 说明 |
|------|------|------|
| 1 | 在 GitHub/GitLab 创建新仓库 `portal` | 空仓库，不初始化 README |
| 2 | 本地：`mkdir portal-standalone && cd portal-standalone && git init` | 初始化独立仓库 |
| 3 | 复制 portal 目录所有文件（排除 `node_modules`、`.next`、`pnpm-lock.yaml`） | `rsync -av --exclude node_modules --exclude .next --exclude pnpm-lock.yaml ../paperclip/portal/ .` |
| 4 | 创建本方案中的新文件：`pnpm-workspace.yaml`、`turbo.json`、`server/`、`packages/`、`tooling/`、`.env.example`、`.github/` | 按上述章节内容创建 |
| 5 | 修改根 `package.json`：改 name、添加 workspace 脚本、添加 `@portal/shared` 依赖 | 见第四章 4.1 |
| 6 | 修改根 `tsconfig.json`：继承 `tooling/tsconfig/nextjs.json`、排除 server/packages | 见第五章 5.4 |
| 7 | 修改 `next.config.js`：添加 `transpilePackages` | 见第九章 9.2 |
| 8 | 补充 `.gitignore` | 见第十二章 |
| 9 | `pnpm install` | 生成全新 lockfile |
| 10 | `pnpm typecheck:all` | 确认类型正确 |
| 11 | `pnpm dev:all` | 确认前后端均可启动 |
| 12 | `git add . && git commit -m "feat: 初始化 portal 独立 monorepo"` | 首次提交 |
| 13 | `git remote add origin <新仓库 URL> && git push -u origin main` | 推送到远程 |
| 14 | 在 paperclip 仓库中删除 `portal/` 目录（或保留 README 指向新仓库） | 清理旧代码 |

### 是否保留 git 历史

如需保留 portal 目录的 git 历史，可使用 `git filter-repo`：

```bash
# 在 paperclip 仓库副本中执行
git filter-repo --subdirectory-filter portal/
```

此命令将 `portal/` 子目录提升为仓库根并保留所有相关 commit。之后再执行步骤 4–13。

---

## 十五、风险与对策

| # | 风险 | 影响 | 对策 |
|---|------|------|------|
| 1 | **根 package.json 身兼二职**（workspace root + Next.js 前端） | 脚本命名冲突、职责不清 | workspace 编排脚本统一加 `:all` / `:server` 后缀；前端脚本保持原名 |
| 2 | **前端 `@/*` 路径别名可能解析到 server/ 或 packages/** | 编译错误或错误导入 | 根 `tsconfig.json` 的 `exclude` 明确排除 `server/`、`packages/`、`tooling/` |
| 3 | **双 tsconfig 冲突**：根 tsconfig 被 Next.js 隐式修改 | 影响其他包的类型推断 | 各包 tsconfig 独立继承 `tooling/tsconfig/*.json`，不依赖根 tsconfig |
| 4 | **pnpm hoisting 导致幽灵依赖** | 前端意外 import 后端依赖 | `.npmrc` 设置 `shamefully-hoist=false`（按需调整为 Next.js 兼容配置） |
| 5 | **lockfile 规模**：portal 前端依赖 150+ 包，首次 install 较慢 | CI 耗时 | pnpm store + GitHub Actions cache 缓解 |
| 6 | **迁移后 paperclip 仍保留 portal 残留引用** | 混乱 | 迁移完成后在 paperclip 仓库中全局搜索 `portal` 并清理 |
| 7 | **Next.js 14 与 ESM workspace 包兼容性** | 某些场景 require/import 混用报错 | `next.config.js` 使用 `transpilePackages` 确保 workspace 包被正确编译 |

---

## 十六、未来演进（不在本次范围，仅记录）

| 方向 | 说明 |
|------|------|
| 前端提取到 `apps/web/` | 当前保持根目录是务实之举；未来若添加第二个前端（如移动端 BFF），可重构为 `apps/` 目录 |
| WebSocket 支持 | 后端当前仅 REST；如需实时推送（聊天、通知），后续添加 `ws` 或 `socket.io` |
| 认证体系升级 | 从 header 注入 → JWT + refresh token 完整认证流 |
| Docker Compose | 一键启动 PostgreSQL + server + web 的容器化开发环境 |
| Changeset 版本管理 | 如果未来需要发布 shared 包到内部 registry |
