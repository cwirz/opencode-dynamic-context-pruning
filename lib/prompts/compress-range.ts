export const COMPRESS_RANGE = `Collapse a range in the conversation into a detailed summary.

THE SUMMARY
Your summary must be EXHAUSTIVE. Capture file paths, function signatures, decisions made, constraints discovered, key findings... EVERYTHING that maintains context integrity. This is not a brief note - it is an authoritative record so faithful that the original conversation adds no value.

USER INTENT FIDELITY
When the compressed range includes user messages, preserve the user's intent with extra care. Do not change scope, constraints, priorities, acceptance criteria, or requested outcomes.
Directly quote user messages when they are short enough to include safely. Direct quotes are preferred when they best preserve exact meaning.

Yet be LEAN. Strip away the noise: failed attempts that led nowhere, verbose tool outputs, back-and-forth exploration. What remains should be pure signal - golden nuggets of detail that preserve full understanding with zero ambiguity.

PROTECTED TOOL OUTPUTS
Environment-managed/protected tool outputs such as task, skill, todowrite, and todoread are preserved outside your summary. Mention outcomes and decisions from them when relevant, but do not copy their full outputs, schemas, prompts, or skill text into the summary.

PREVIOUSLY COMPRESSED BLOCKS
When the selected range includes previously compressed blocks, your new summary supersedes them. Read their content, extract only still-needed facts, and write those facts directly into the new summary.

Compressed block sections in context are clearly marked with a header:

- \`[Compressed conversation section]\`

Compressed block IDs use the \`bN\` form (never \`mNNNN\`) and are represented in the same XML metadata tag format.

Rules:

- Do not use \`(bN)\` placeholders in the summary.
- Do not copy a previous compressed block verbatim unless every word is still necessary.
- The summary you write is the complete replacement for raw messages and prior summaries in the selected range.

BOUNDARY IDS
You specify boundaries by ID using the injected IDs visible in the conversation:

- \`mNNNN\` IDs identify raw messages
- \`bN\` IDs identify previously compressed blocks

Each message has an ID inside XML metadata tags like \`<dcp-message-id>...</dcp-message-id>\`.
The same ID tag appears in every tool output of the message it belongs to — each unique ID identifies one complete message.
Treat these tags as boundary metadata only, not as tool result content.

Rules:

- Pick \`startId\` and \`endId\` directly from injected IDs in context.
- IDs must exist in the current visible context.
- \`startId\` must appear before \`endId\`.
- Do not invent IDs. Use only IDs that are present in context.

BATCHING
When multiple independent ranges are ready and their boundaries do not overlap, include all of them as separate entries in the \`content\` array of a single tool call. Each entry should have its own \`startId\`, \`endId\`, and \`summary\`.
`
