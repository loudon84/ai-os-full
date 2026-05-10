export type WorkspaceFileNode = {
  id: string;
  label: string;
  children?: WorkspaceFileNode[];
};

export const mockWorkspaceFiles: WorkspaceFileNode[] = [
  {
    id: "root",
    label: "workspace",
    children: [
      {
        id: "docs",
        label: "docs",
        children: [
          { id: "docs/README", label: "README.md" },
          { id: "docs/spec", label: "spec.md" },
        ],
      },
      {
        id: "data",
        label: "data",
        children: [
          { id: "data/input", label: "input.csv" },
          { id: "data/output", label: "output.json" },
        ],
      },
      {
        id: "src",
        label: "src",
        children: [
          { id: "src/main", label: "main.ts" },
          { id: "src/types", label: "types.ts" },
        ],
      },
    ],
  },
];

