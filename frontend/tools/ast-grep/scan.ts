import { execSync } from "child_process";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, join } from "path";

const PROJECT_ROOT = resolve(__dirname, "../..");
const RAW_DIR = join(PROJECT_ROOT, "generated/raw");
const RULES_DIR = join(PROJECT_ROOT, "tools/ast-grep/rules");
const CONFIG = join(PROJECT_ROOT, "tools/ast-grep/sgconfig.yml");

// Ensure raw directory exists
if (!existsSync(RAW_DIR)) {
  mkdirSync(RAW_DIR, { recursive: true });
}

// Rule file to output file mapping
const scanTargets = [
  { ruleFile: "component-export.yaml", outputFile: "components.raw.json", label: "组件定义" },
  { ruleFile: "props-type.yaml", outputFile: "props.raw.json", label: "Props 类型" },
  { ruleFile: "page-blocks.yaml", outputFile: "pages.raw.json", label: "页面布局" },
  { ruleFile: "imports.yaml", outputFile: "imports.raw.json", label: "Import 依赖" },
  { ruleFile: "state-patterns.yaml", outputFile: "states.raw.json", label: "状态模式" },
];

// Scan paths
const scanPaths = ["app", "components", "modules/copilotkit/components", "modules/copilotkit/provider"].map((p) => join(PROJECT_ROOT, p));

function runScan(ruleFile: string, outputFile: string, label: string): number {
  const rulePath = join(RULES_DIR, ruleFile);
  const outputPath = join(RAW_DIR, outputFile);

  if (!existsSync(rulePath)) {
    console.log(`  SKIP: ${ruleFile} not found`);
    writeFileSync(outputPath, "[]", "utf-8");
    return 0;
  }

  const startTime = Date.now();

  try {
    // Run ast-grep scan with JSON output
    const cmd = [
      "npx ast-grep scan",
      `--config "${CONFIG}"`,
      `--rule "${rulePath}"`,
      "--format json",
      ...scanPaths.map((p) => `"${p}"`),
    ].join(" ");

    const result = execSync(cmd, {
      cwd: PROJECT_ROOT,
      encoding: "utf-8",
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Parse and write
    let matches: unknown[] = [];
    try {
      matches = JSON.parse(result);
    } catch {
      // ast-grep may output non-JSON lines before the JSON
      const lines = result.split("\n");
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          matches = JSON.parse(lines[i]);
          break;
        } catch {
          continue;
        }
      }
    }

    writeFileSync(outputPath, JSON.stringify(matches, null, 2), "utf-8");

    const elapsed = Date.now() - startTime;
    console.log(`  OK: ${label} → ${matches.length} matches (${elapsed}ms)`);
    return matches.length;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.log(`  ERROR: ${label} - ${errMsg.slice(0, 200)}`);
    writeFileSync(outputPath, "[]", "utf-8");
    return 0;
  }
}

// Main
console.log("=== ast-grep scan start ===");
console.log(`Project root: ${PROJECT_ROOT}`);
console.log(`Scan paths: ${scanPaths.join(", ")}`);
console.log("");

const totalStart = Date.now();
let totalMatches = 0;

for (const target of scanTargets) {
  totalMatches += runScan(target.ruleFile, target.outputFile, target.label);
}

const totalElapsed = Date.now() - totalStart;
console.log("");
console.log(`=== ast-grep scan complete ===`);
console.log(`Total matches: ${totalMatches}`);
console.log(`Total time: ${totalElapsed}ms`);
