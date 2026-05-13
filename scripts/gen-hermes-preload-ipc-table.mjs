import fs from "node:fs";

const path = new URL("../hermes-desktop/src/preload/index.ts", import.meta.url);
const lines = fs.readFileSync(path, "utf8").split("\n");

/** @type {string | null} */
let currentApi = null;
/** @type {Map<string, string>} */
const invokeChanToApi = new Map();

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // 仅顶层 `  camelCase:`（恰好两个空格），避免类型体内的 `    mode:` 覆盖 currentApi
  const prop = line.match(/^  ([a-zA-Z]\w*):/);
  if (prop) {
    currentApi = prop[1];
  }

  const invSame = line.match(/ipcRenderer\.invoke\(\s*"([^"]+)"/);
  if (invSame && currentApi) {
    invokeChanToApi.set(invSame[1], currentApi);
    continue;
  }

  // 多行 invoke：上一行以 ipcRenderer.invoke( 结尾，本行仅字符串 channel
  const invNext = line.match(/^\s+"([^"]+)",\s*$/);
  if (invNext && i > 0 && /ipcRenderer\.invoke\(\s*$/.test(lines[i - 1].trimEnd()) && currentApi) {
    invokeChanToApi.set(invNext[1], currentApi);
  }
}

const sortedInvoke = [...invokeChanToApi.keys()].sort((a, b) => a.localeCompare(b));
if (sortedInvoke.length !== 96) {
  console.error("Expected 96 invoke channels, got", sortedInvoke.length);
  process.exitCode = 1;
}

/** @type {Array<{ api: string; ch: string }>} */
const onRows = [];
currentApi = null;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const prop = line.match(/^  ([a-zA-Z]\w*):/);
  if (prop) {
    currentApi = prop[1];
  }
  const onm = line.match(/ipcRenderer\.on\("([^"]+)"/);
  if (onm && currentApi) {
    onRows.push({ api: currentApi, ch: onm[1] });
  }
}

const sortedOn = [...onRows].sort((a, b) => a.ch.localeCompare(b.ch));

console.log("## 附录 D：全量 IPC 扁平总表（按 channel 排序）\n");
console.log(
  "> 由 `scripts/gen-hermes-preload-ipc-table.mjs` 从 `hermes-desktop/src/preload/index.ts` 解析生成；upstream 变更后重跑：`node scripts/gen-hermes-preload-ipc-table.mjs`，将输出替换本附录。\n",
);
console.log("| # | 类型 | IPC channel | `hermesAPI` |");
console.log("|---|------|-------------|-------------|");
let n = 0;
for (const ch of sortedInvoke) {
  n++;
  console.log(`| ${n} | invoke | \`${ch}\` | \`${invokeChanToApi.get(ch)}\` |`);
}
for (const r of sortedOn) {
  n++;
  console.log(`| ${n} | on（订阅） | \`${r.ch}\` | \`${r.api}\` |`);
}
console.log("");
console.log(
  `**合计**：invoke **${sortedInvoke.length}** 条 + 订阅 **${sortedOn.length}** 条 = **${sortedInvoke.length + sortedOn.length}** 行。`,
);
