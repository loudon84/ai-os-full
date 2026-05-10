import { NextRequest, NextResponse } from "next/server";
import { writeFile, rename } from "fs/promises";
import path from "path";

/** toolName → kebab-case fixture file name */
function toFixtureFileName(toolName: string): string {
  return toolName.replace(/\./g, "-");
}

/** Security: only allow safe toolName characters */
const SAFE_TOOLNAME_RE = /^[a-z0-9.-]+$/;

export async function POST(request: NextRequest) {
  // Production guard
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { toolName, payload } = body as { toolName?: string; payload?: unknown };

    if (!toolName || payload === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing toolName or payload" },
        { status: 400 }
      );
    }

    // Security: reject path traversal
    if (!SAFE_TOOLNAME_RE.test(toolName)) {
      return NextResponse.json(
        { success: false, error: "Invalid toolName: only [a-z0-9.-] allowed" },
        { status: 400 }
      );
    }

    const fileName = `${toFixtureFileName(toolName)}.json`;
    const fixturesDir = path.resolve(process.cwd(), "modules/hermes/tool-ui/fixtures");
    const targetPath = path.join(fixturesDir, fileName);
    const tmpPath = `${targetPath}.tmp`;

    // Atomic write: write to .tmp first, then rename
    const content = JSON.stringify(payload, null, 2);
    await writeFile(tmpPath, content, "utf-8");
    await rename(tmpPath, targetPath);

    const relativePath = `modules/hermes/tool-ui/fixtures/${fileName}`;
    return NextResponse.json({ success: true, filePath: relativePath });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
