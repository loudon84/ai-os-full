import { ScrollArea } from "@/components/ui/scroll-area";

type SourceRefItem = {
  name: string;
  href?: string;
  timestamp?: string;
};

type SourceRefListProps = {
  sources: SourceRefItem[];
};

export function SourceRefList({ sources }: SourceRefListProps) {
  if (sources.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">暂无数据来源</p>
    );
  }

  return (
    <ScrollArea className="max-h-48">
      <ul className="space-y-1.5">
        {sources.map((source, index) => (
          <li key={`${source.name}-${index}`} className="text-sm">
            <div className="flex items-baseline justify-between gap-2">
              {source.href ? (
                <a
                  href={source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  {source.name}
                </a>
              ) : (
                <span className="text-foreground">{source.name}</span>
              )}
              {source.timestamp && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {source.timestamp}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}
