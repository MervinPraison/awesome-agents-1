export interface MemoryBlockI extends Record<string, unknown> {
  /** Unique identifier for the block */
  label: string;
  /** Describes the purpose of the block */
  description: string;
  /** Contents/data of the block */
  value: string;
  /** Size limit of the block in characters. */
  limit: number;
  /** Whether the block is read-only */
  readOnly?: boolean;
  /** Last updated */
  lastUpdated: number;
}

export function renderMemory(blocks: MemoryBlockI[]) {
  let s = "";
  if (blocks.length === 0) return s;

  s +=
    "<memory_blocks>\nThe following memory blocks are currently engaged in your core memory unit:\n\n";

  blocks.forEach((block, idx) => {
    const label = block.label ?? "block";
    const value = block.value ?? "";
    const desc = block.description ?? "";
    const currentChars = value.length;
    const limit = block.limit ?? 0;
    s += `<${label}>\n`;
    s += "<description>\n";
    s += `${desc}\n`;
    s += "</description>\n";
    s += "<metadata>";
    if (block.readOnly) s += "\n- read_only=true";
    s += `\n- chars_current=${currentChars}`;
    s += `\n- chars_limit=${limit}\n`;
    s += "</metadata>\n";
    s += "<value>\n";
    s += `${value}\n`;
    s += "</value>\n";
    s += `</${label}>\n`;
    if (idx != blocks.length - 1) s += "\n";
  });

  s += "\n</memory_blocks>";

  return (
    s +
    `<memory_metadata>
- The current time is: ${new Date().toDateString()}
- Memory blocks were last modified: ${new Date(blocks.reduce((acc, b) => Math.max(acc, b.lastUpdated), 0)).toDateString()}
</memory_metadata>
`
  );
}