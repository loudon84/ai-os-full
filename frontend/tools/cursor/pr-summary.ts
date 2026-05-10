import { Agent, CursorAgentError } from "@cursor/sdk";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(
      [
        `缺少环境变量 ${name}。`,
        "",
        "用法：",
        `  PowerShell: $env:${name}=\"cursor_...\"`,
        `  Bash: export ${name}=\"cursor_...\"`,
        "",
        "获取方式：Cursor Dashboard → Cloud Agents → API Key",
      ].join("\n"),
    );
    process.exit(1);
  }
  return value;
}

async function main() {
  const apiKey = requireEnv("CURSOR_API_KEY");

  const prompt = [
    "你在一个 Next.js 14 + TS 项目仓库中运行（本地 runtime，可访问当前 cwd）。",
    "请基于当前 git 工作区状态与改动（需要你自己查看 git diff / git status），输出：",
    "",
    "1) PR 标题（1 行）",
    "2) Summary（3-6 条 bullet，偏“为什么/影响面”）",
    "3) 风险点与回滚建议（最多 5 条）",
    "4) Test plan（给出可以直接复制运行的命令，结合本仓库 scripts：lint/test/build 等）",
    "",
    "要求：只输出以上四段，使用简体中文，尽量具体到目录/模块名。",
  ].join("\n");

  try {
    const result = await Agent.prompt(prompt, {
      apiKey,
      model: { id: "composer-2" },
      local: { cwd: process.cwd() },
    });

    if (result.status === "error") {
      console.error("Agent 运行失败（已启动但中途报错）。");
      process.exit(2);
    }

    // SDK 返回结构会随版本变化，这里优先打印 result.result / result.output 的文本部分
    const anyResult = result as unknown as { result?: unknown; output?: unknown };
    const text =
      (typeof anyResult.result === "string" && anyResult.result) ||
      (typeof anyResult.output === "string" && anyResult.output) ||
      JSON.stringify(anyResult.result ?? anyResult.output ?? result, null, 2);

    process.stdout.write(text.endsWith("\n") ? text : `${text}\n`);
  } catch (err) {
    if (err instanceof CursorAgentError) {
      console.error(`Agent 启动失败：${err.message}`);
      process.exit(1);
    }
    throw err;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

