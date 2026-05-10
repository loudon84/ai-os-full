# react-email Project Semantic Overview

## Purpose

`react-email` is a **React-to-email-HTML compilation framework**, not a UI component library in the conventional sense. It solves the structural mismatch between modern React authoring and the constraints of cross-client HTML email (XHTML 1.0 Transitional, table-based layout, inlined CSS, MSO conditional comments). The system's output is always a static HTML string — it has no runtime in the browser.

It is **not** a design system, not a mail-sending SDK, and not a general-purpose React renderer. It is a compilation target adapter: React → email-safe HTML.

---

## Core Architecture

**Rendering layer** (`@react-email/render`): The only package that converts React trees to HTML strings. Ships three separate `render()` implementations selected at import time via `package.json` `exports` conditions (`node`, `browser`/`worker`/`deno`, `workerd`/`edge-light`/`convex`). All three wrap the component in `<Suspense>` + `createErrorBoundary`, call React's streaming server API, then post-process: prepend XHTML 1.0 Transitional DOCTYPE, optionally convert to plain text via `html-to-text`, or pretty-print via `prettier`. [1](#0-0) [2](#0-1) 

**Style layer** (`@react-email/tailwind`): A React component that performs a two-pass traversal of the React tree using `mapReactTree`. Pass 1 collects all `className` values and feeds them to Tailwind v4 via `setupTailwind`. Pass 2 clones each element with inlined styles via `cloneElementWithInlinedStyles`. Non-inlinable rules (media queries, pseudo-selectors) are injected as a `<style>` tag into the first `<head>` element found. If no `<head>` exists but non-inlinable rules are present, it throws. [3](#0-2) 

**Component layer** (18 individual `@react-email/*` packages): Each is a standalone npm package built with `tsdown` to dual ESM/CJS. `react` is always a peer dependency, never bundled. `@react-email/components` is a pure re-export meta-package — its entire `src/index.ts` is 20 `export *` lines. [4](#0-3) 

**CLI layer** (`react-email` package, `email` binary): Commander.js program with 5 commands. The entrypoint self-re-spawns with `--experimental-vm-modules` if that flag is absent, because the preview server's template sandbox requires `vm.SourceTextModule`. [5](#0-4) 

**Preview server** (`@react-email/preview-server`): A pre-built Next.js app published to npm with `.next/` included. The CLI starts it by setting `REACT_EMAIL_INTERNAL_*` env vars and proxying HTTP. It is not a library — it is a compiled artifact. Email templates are bundled per-request with esbuild inside a `vm.SourceTextModule` sandbox, then rendered via `@react-email/render`. [6](#0-5) [7](#0-6) 

---

## Key Modules

- `packages/render/src/node/render.tsx` — canonical render path for Node.js; `renderToReadableStream` with `renderToPipeableStream` fallback
- `packages/render/src/browser/render.tsx` — browser/worker/deno render path
- `packages/render/src/edge/render.tsx` — Cloudflare Workers / edge-light / Convex render path
- `packages/render/src/shared/` — shared `Options` type, `error-boundary`, `pretty`, `to-plain-text` utilities
- `packages/tailwind/src/tailwind.tsx` — `Tailwind` component; the entire Tailwind-to-email pipeline
- `packages/tailwind/src/utils/react/map-react-tree.ts` — recursive React tree traversal used by Tailwind
- `packages/tailwind/src/utils/tailwindcss/setup-tailwind.ts` — Tailwind v4 engine initialization
- `packages/tailwind/src/utils/tailwindcss/clone-element-with-inlined-styles.ts` — per-element style inlining
- `packages/preview-server/src/utils/get-email-component.ts` — esbuild bundle + vm sandbox execution of user templates
- `packages/preview-server/src/utils/run-bundled-code.ts` — `vm.SourceTextModule` execution context
- `packages/preview-server/src/utils/esbuild/renderring-utilities-exporter.ts` — esbuild plugin that injects `render` and `reactEmailCreateReactElement` into the bundle
- `packages/preview-server/src/actions/render-email-by-path.tsx` — server action: orchestrates bundle → render → cache
- `packages/react-email/src/index.ts` — CLI entrypoint; Commander.js program definition
- `packages/react-email/src/commands/dev.ts` — `email dev` command
- `packages/react-email/src/commands/export.ts` — `email export` command
- `packages/components/src/index.ts` — meta-package re-export barrel



---

## Email Template Contract (Invariants)

These are non-negotiable structural rules enforced at runtime:

1. **`export default` must be a function component.** `getEmailComponent` validates this with Zod and returns an `ErrorObject` if violated. [8](#0-7) 

2. **`Component.PreviewProps`** is the only supported mechanism for injecting preview-time props. It is read directly off the default export. [9](#0-8) 

3. **DOCTYPE is always XHTML 1.0 Transitional.** It is unconditionally prepended and any existing DOCTYPE in the rendered output is stripped. [10](#0-9) 

4. **`<Head>` must exist inside `<Tailwind>` when using non-inlinable CSS rules.** Tailwind throws a descriptive error otherwise. [11](#0-10) 

5. **Directories prefixed with `_` are excluded from the preview server's email discovery.** This is the only supported convention for shared component directories.

6. **`react` is always a peer dependency across all component packages.** Never bundle React.

7. **Node.js ≥ 20.0.0 is required.** `vm.SourceTextModule` and the streaming APIs depend on it.

---

## Stable Abstractions vs. Volatile Implementation Details

**Stable (do not redesign without major version):**
- `render(node, options?)` signature and its `Options` type (`plainText`, `pretty`, `htmlToTextOptions`)
- The `exports` condition map in `@react-email/render/package.json` (node / browser / edge)
- `Tailwind` component props interface (`children`, `config?: TailwindConfig`)
- `pixelBasedPreset` export from `@react-email/tailwind`
- `Component.PreviewProps` static property convention
- `@react-email/components` as the single-import entry point for consumers

**Volatile (implementation details, safe to change internally):**
- esbuild plugin `renderingUtilitiesExporter` — how `render` and `createElement` are injected into the sandbox bundle
- `vm.SourceTextModule` sandbox mechanics in `run-bundled-code.ts`
- `mapReactTree` traversal strategy inside Tailwind
- Preview server's Next.js app structure, routes, and UI components
- `renderEmailByPath` caching strategy
- Hot reload mechanism (chokidar + socket.io)

---

## Extension Points

**Adding a new email component:** Create a new package under `packages/{name}`, follow the uniform `tsdown` build pattern with `react` as peer dep, add it to `packages/components/package.json` dependencies and `packages/components/src/index.ts`. Do not add it as a direct dependency of `@react-email/render`. [4](#0-3) 

**Adding a new render target/runtime:** Add a new `exports` condition in `packages/render/package.json` pointing to a new source file under `packages/render/src/{target}/render.tsx`. The implementation must wrap the component in `<Suspense>` + `createErrorBoundary` and call a React streaming API. [2](#0-1) 

**Adding a new CLI command:** Add a Commander.js `.command()` call in `packages/react-email/src/index.ts` and a corresponding source file under `packages/react-email/src/commands/`. [12](#0-11) 

**Tailwind config extension:** Pass a `TailwindConfig` (Tailwind v4 `Config` minus `content`) to the `<Tailwind config={...}>` prop. Use `pixelBasedPreset` for pixel-unit spacing/typography overrides. [13](#0-12) 

**New email provider integration:** No code changes needed in this repo. `render()` returns a plain HTML string; pass it to any provider's SDK. The `examples/` directory contains reference integrations.

---

## Lifecycle

```
1. Scaffold       create-email [dir]
                  → copies template, patches package.json with latest npm versions

2. Develop        email dev --dir ./emails
                  → CLI self-re-spawns with --experimental-vm-modules
                  → starts @react-email/preview-server (pre-built Next.js)
                  → chokidar watches emails/
                  → per-request: esbuild bundles template → vm.SourceTextModule executes → render() → HTML

3. Iterate        edit .tsx → chokidar fires → socket.io pushes reload → browser re-requests

4. Export         email export --outDir out/
                  → esbuild bundles each template → vm executes → render() → writes .html files

5. Deploy preview email build → email start  (or deploy .react-email/ to Vercel as Next.js)

6. Send           application server imports template → calls render() → passes HTML to provider SDK
```

---

## Risky Modifications

- **Changing the `render()` function signature or its `Options` type** — breaks all downstream consumers and the preview server's `renderEmailByPath`.
- **Modifying `@react-email/components/src/index.ts` to not re-export a package** — silently breaks consumers who import from the meta-package.
- **Changing the `Component.PreviewProps` convention** — breaks the preview server's prop injection at `renderEmailByPath.tsx:149`.
- **Modifying the esbuild plugin `renderingUtilitiesExporter`** — the sandbox expects exactly `render`, `reactEmailCreateReactElement`, and `default` exports; the Zod schema at `get-email-component.ts:14-18` enforces this. [14](#0-13) 
- **Changing the Tailwind two-pass tree traversal order** — inlining happens in pass 2; collecting class names must complete before `getStyleSheet()` is called in pass 1. [15](#0-14) 
- **Removing `--experimental-vm-modules` self-respawn** — the entire preview and export pipeline breaks because `vm.SourceTextModule` is unavailable without it. [16](#0-15) 
- **Altering the XHTML 1.0 Transitional DOCTYPE** — breaks rendering in Outlook and other legacy clients that require this exact doctype. [10](#0-9)

### Citations

**File:** packages/render/src/node/render.tsx (L8-75)
```typescript
export const render = async (node: React.ReactNode, options?: Options) => {
  const reactDOMServer = await import('react-dom/server').then((m) => {
    if ('default' in m) {
      return m.default;
    }
    return m;
  });

  let html!: string;
  await new Promise<void>((resolve, reject) => {
    if (
      Object.hasOwn(reactDOMServer, 'renderToReadableStream') &&
      typeof WritableStream !== 'undefined'
    ) {
      const ErrorBoundary = createErrorBoundary(reject);
      reactDOMServer
        .renderToReadableStream(
          <ErrorBoundary>
            <Suspense>{node}</Suspense>
          </ErrorBoundary>,
          {
            progressiveChunkSize: Number.POSITIVE_INFINITY,
            onError(error) {
              // Throw immediately when an error occurs to prevent CSR fallback
              throw error;
            },
          },
        )
        .then((stream) => readStream(stream))
        .then((result) => {
          html = result;
          resolve();
        })
        .catch(reject);
    } else {
      const ErrorBoundary = createErrorBoundary(reject);
      const stream = reactDOMServer.renderToPipeableStream(
        <ErrorBoundary>
          <Suspense>{node}</Suspense>
        </ErrorBoundary>,
        {
          async onAllReady() {
            html = await readStream(stream);
            resolve();
          },
          onError(error) {
            reject(error);
          },
          progressiveChunkSize: Number.POSITIVE_INFINITY,
        },
      );
    }
  });

  if (options?.plainText) {
    return toPlainText(html, options.htmlToTextOptions);
  }

  const doctype =
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';

  const document = `${doctype}${html.replace(/<!DOCTYPE.*?>/, '')}`;

  if (options?.pretty) {
    return pretty(document);
  }

  return document;
```

**File:** packages/render/package.json (L12-60)
```json
  "exports": {
    ".": {
      "workerd": {
        "import": {
          "types": "./dist/edge/index.d.mts",
          "default": "./dist/edge/index.mjs"
        },
        "require": {
          "types": "./dist/edge/index.d.ts",
          "default": "./dist/edge/index.js"
        }
      },
      "deno": {
        "import": {
          "types": "./dist/browser/index.d.mts",
          "default": "./dist/browser/index.mjs"
        },
        "require": {
          "types": "./dist/browser/index.d.ts",
          "default": "./dist/browser/index.js"
        }
      },
      "worker": {
        "import": {
          "types": "./dist/browser/index.d.mts",
          "default": "./dist/browser/index.mjs"
        },
        "require": {
          "types": "./dist/browser/index.d.ts",
          "default": "./dist/browser/index.js"
        }
      },
      "edge-light": {
        "import": {
          "types": "./dist/edge/index.d.mts",
          "default": "./dist/edge/index.mjs"
        },
        "require": {
          "types": "./dist/edge/index.d.ts",
          "default": "./dist/edge/index.js"
        }
      },
      "convex": {
        "import": {
          "types": "./dist/edge/index.d.mts",
          "default": "./dist/edge/index.mjs"
        },
        "require": {
          "types": "./dist/edge/index.d.ts",
```

**File:** packages/tailwind/src/tailwind.tsx (L13-18)
```typescript
export type TailwindConfig = Omit<Config, 'content'>;

export interface TailwindProps {
  children: React.ReactNode;
  config?: TailwindConfig;
}
```

**File:** packages/tailwind/src/tailwind.tsx (L85-173)
```typescript
export function Tailwind({ children, config }: TailwindProps) {
  const tailwindSetup = useSuspensedPromise(
    () => setupTailwind(config ?? {}),
    JSON.stringify(config, (_key, value) =>
      typeof value === 'function' ? value.toString() : value,
    ),
  );
  let classesUsed: string[] = [];

  let mappedChildren: React.ReactNode = mapReactTree(children, (node) => {
    if (React.isValidElement<EmailElementProps>(node)) {
      if (node.props.className) {
        const classes = node.props.className?.split(/\s+/);
        classesUsed = [...classesUsed, ...classes];
        tailwindSetup.addUtilities(classes);
      }
    }

    return node;
  });

  const styleSheet = tailwindSetup.getStyleSheet();
  sanitizeStyleSheet(styleSheet);

  const { inlinable: inlinableRules, nonInlinable: nonInlinableRules } =
    extractRulesPerClass(styleSheet, classesUsed);

  const customProperties = getCustomProperties(styleSheet);

  const nonInlineStyles: StyleSheet = {
    type: 'StyleSheet',
    children: new List<CssNode>().fromArray(
      Array.from(nonInlinableRules.values()),
    ),
  };
  sanitizeNonInlinableRules(nonInlineStyles);

  const hasNonInlineStylesToApply = nonInlinableRules.size > 0;
  let appliedNonInlineStyles = false as boolean;

  mappedChildren = mapReactTree(mappedChildren, (node) => {
    if (React.isValidElement<EmailElementProps>(node)) {
      const elementWithInlinedStyles = cloneElementWithInlinedStyles(
        node,
        inlinableRules,
        nonInlinableRules,
        customProperties,
      );

      if (elementWithInlinedStyles.type === 'head') {
        appliedNonInlineStyles = true;

        const styleElement = (
          <style
            dangerouslySetInnerHTML={{ __html: generate(nonInlineStyles) }}
          />
        );

        return React.cloneElement(
          elementWithInlinedStyles,
          elementWithInlinedStyles.props,
          styleElement,
          elementWithInlinedStyles.props.children,
        );
      }

      return elementWithInlinedStyles;
    }

    return node;
  });

  if (hasNonInlineStylesToApply && !appliedNonInlineStyles) {
    throw new Error(
      `You are trying to use the following Tailwind classes that cannot be inlined: ${Array.from(
        nonInlinableRules.keys(),
      ).join(' ')}.
For the media queries to work properly on rendering, they need to be added into a <style> tag inside of a <head> tag,
the Tailwind component tried finding a <head> element but just wasn't able to find it.

Make sure that you have a <head> element at some point inside of the <Tailwind> component at any depth. 
This can also be our <Head> component.

If you do already have a <head> element at some depth, 
please file a bug https://github.com/resend/react-email/issues/new?assignees=&labels=Type%3A+Bug&projects=&template=1.bug_report.yml.`,
    );
  }

  return mappedChildren;
```

**File:** packages/components/src/index.ts (L1-20)
```typescript
export * from '@react-email/body';
export * from '@react-email/button';
export * from '@react-email/code-block';
export * from '@react-email/code-inline';
export * from '@react-email/column';
export * from '@react-email/container';
export * from '@react-email/font';
export * from '@react-email/head';
export * from '@react-email/heading';
export * from '@react-email/hr';
export * from '@react-email/html';
export * from '@react-email/img';
export * from '@react-email/link';
export * from '@react-email/markdown';
export * from '@react-email/preview';
export * from '@react-email/render';
export * from '@react-email/row';
export * from '@react-email/section';
export * from '@react-email/tailwind';
export * from '@react-email/text';
```

**File:** packages/react-email/src/index.ts (L12-36)
```typescript
const requiredFlags = [
  '--experimental-vm-modules',
  '--disable-warning=ExperimentalWarning',
];

const hasRequiredFlags = requiredFlags.every((flag) =>
  process.execArgv.includes(flag),
);

if (!hasRequiredFlags) {
  const child = spawn(
    process.execPath,
    [
      ...requiredFlags,
      ...process.execArgv,
      process.argv[1] ?? '',
      ...process.argv.slice(2),
    ],
    { stdio: 'inherit' },
  );

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
} else {
```

**File:** packages/react-email/src/index.ts (L39-109)
```typescript
  program
    .name(PACKAGE_NAME)
    .description('A live preview of your emails right in your browser')
    .version(packageJson.version);

  program
    .command('dev')
    .description('Starts the preview email development app')
    .option(
      '-d, --dir <path>',
      'Directory with your email templates',
      './emails',
    )
    .option('-p --port <port>', 'Port to run dev server on', '3000')
    .action(dev);

  program
    .command('build')
    .description('Copies the preview app for onto .react-email and builds it')
    .option(
      '-d, --dir <path>',
      'Directory with your email templates',
      './emails',
    )
    .option(
      '-p --packageManager <name>',
      'Package name to use on installation on `.react-email`',
      'npm',
    )
    .action(build);

  program
    .command('start')
    .description('Runs the built preview app that is inside of ".react-email"')
    .action(start);

  program
    .command('export')
    .description('Build the templates to the `out` directory')
    .option('--outDir <path>', 'Output directory', 'out')
    .option('-p, --pretty', 'Pretty print the output', false)
    .option('-t, --plainText', 'Set output format as plain text', false)
    .option(
      '-d, --dir <path>',
      'Directory with your email templates',
      './emails',
    )
    .option(
      '-s, --silent',
      'To, or not to show a spinner with process information',
      false,
    )
    .action(({ outDir, pretty, plainText, silent, dir: srcDir }) =>
      exportTemplates(outDir, srcDir, { silent, plainText, pretty }),
    );

  const resend = program.command('resend');

  resend
    .command('setup')
    .description(
      'Sets up the integration between the React Email CLI, and your Resend account through an API Key',
    )
    .action(resendSetup);

  resend
    .command('reset')
    .description('Deletes your API Key from the React Email configuration')
    .action(resendReset);

  program.parse();
```

**File:** packages/preview-server/src/utils/get-email-component.ts (L14-18)
```typescript
const EmailComponentModule = z.object({
  default: z.any(),
  render: z.function(),
  reactEmailCreateReactElement: z.function(),
});
```

**File:** packages/preview-server/src/utils/get-email-component.ts (L40-73)
```typescript
  let outputFiles: OutputFile[];
  try {
    const buildData = await build({
      bundle: true,
      entryPoints: [emailPath],
      plugins: [renderingUtilitiesExporter([emailPath])],
      platform: 'node',
      write: false,

      jsxDev: true,
      jsxImportSource: jsxRuntimePath,

      format: 'esm',
      jsx: 'automatic',
      logLevel: 'silent',
      // allows for using jsx on a .js file
      loader: {
        '.js': 'jsx',
      },
      outdir: 'stdout', // just a stub for esbuild, it won't actually write to this folder
      sourcemap: 'external',
    });
    outputFiles = buildData.outputFiles;
  } catch (exception) {
    const buildFailure = exception as BuildFailure;
    return {
      error: {
        message: buildFailure.message,
        stack: buildFailure.stack,
        name: buildFailure.name,
        cause: buildFailure.cause,
      },
    };
  }
```

**File:** packages/preview-server/src/utils/get-email-component.ts (L86-93)
```typescript
  const context = createContext(emailPath, {
    shouldIncludeSourceReference: false,
  });
  const runningResult = await runBundledCode(
    builtEmailCode,
    emailPath,
    context,
  );
```

**File:** packages/preview-server/src/utils/get-email-component.ts (L138-147)
```typescript
  if (typeof parseResult.data.default !== 'function') {
    return {
      error: {
        name: 'Error',
        message: `The email component at ${emailPath} does not contain a default exported function`,
        stack: new Error().stack,
        cause: parseResult.error,
      },
    };
  }
```

**File:** packages/preview-server/src/actions/render-email-by-path.tsx (L149-153)
```typescript
  const previewProps = Email.PreviewProps || {};
  const EmailComponent = Email as React.FunctionComponent;
  try {
    const timeBeforeEmailRendered = performance.now();
    const element = createElement(EmailComponent, previewProps);
```
