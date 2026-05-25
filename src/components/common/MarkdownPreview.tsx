export function MarkdownPreview({ markdown }: Readonly<{ markdown: string }>) {
  const blocks = markdown
    .split("\n\n")
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <div className="markdown-preview space-y-4 text-sm text-muted-foreground">
      {blocks.map((block, index) => {
        if (block.startsWith("### ")) {
          return (
            <h4
              key={`${block}-${index}`}
              className="text-base font-semibold text-foreground"
            >
              {block.replace("### ", "")}
            </h4>
          );
        }

        if (block.startsWith("## ")) {
          return (
            <h3
              key={`${block}-${index}`}
              className="text-lg font-semibold text-foreground"
            >
              {block.replace("## ", "")}
            </h3>
          );
        }

        if (block.split("\n").every((line) => line.startsWith("- "))) {
          return (
            <ul key={`${block}-${index}`} className="list-disc space-y-1 pl-5">
              {block.split("\n").map((line) => (
                <li key={line}>{line.replace("- ", "")}</li>
              ))}
            </ul>
          );
        }

        return <p key={`${block}-${index}`}>{block}</p>;
      })}
    </div>
  );
}
