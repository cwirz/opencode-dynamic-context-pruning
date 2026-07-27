export const COMPRESS_RANGE = `Collapse a range in the conversation into a detailed summary.

THE SUMMARY
Your summary must be EXHAUSTIVE. Capture file paths, function signatures, decisions made, constraints discovered, key findings... EVERYTHING that maintains context integrity. This is not a brief note - it is an authoritative record so faithful that the original conversation adds no value.

USER INTENT FIDELITY
When the compressed range includes user messages, preserve the user's intent with extra care. Do not change scope, constraints, priorities, acceptance criteria, or requested outcomes.
Directly quote user messages when they are short enough to include safely. Direct quotes are preferred when they best preserve exact meaning.
A newer user request does not cancel or pause an unfinished earlier request unless the user says so. Explicitly retain every unfinished task, its status, and its next step so interrupted work resumes after compression.

Yet be LEAN. Strip away the noise: failed attempts that led nowhere, verbose tool outputs, back-and-forth exploration. What remains should be pure signal - golden nuggets of detail that preserve full understanding with zero ambiguity.

PROTECTED TOOL OUTPUTS
Environment-managed/protected tool outputs such as task, skill, todowrite, and todoread are preserved outside your summary. Mention outcomes and decisions from them when relevant, but do not copy their full outputs, schemas, prompts, or skill text into the summary.

PREVIOUSLY COMPRESSED BLOCKS
Previously compressed blocks are durable, high-priority memory, not ordinary conversation history. When the selected range includes one, rewrite its still-relevant information into the new summary. The new block supersedes it.

Before writing the summary:

1. Read every included compressed block in full. Recompress it: merge durable facts and active work into the new summary; remove repetition, superseded status, and obsolete detail.
2. Identify every unresolved user request, including work interrupted by a newer request. A newer task does not cancel an older task unless the user explicitly says so.
3. Preserve each task's current state: original intent, acceptance criteria, completed work, remaining work, blockers, and exact next step.
4. Preserve other still-relevant decisions, constraints, file paths, code details, and findings.

CURRENT STATE
Prior summaries may contain task statuses that were accurate at an earlier compression boundary. Do not retain stale status prose when newer messages supersede it. Preserve only history needed to explain decisions or resume work.

- Integrate required prior-block content directly into one coherent summary. Do not copy the old summary wholesale.
- End every summary containing task work with a \`CURRENT STATE (authoritative)\` section.
- In that final section, list every unfinished task, its present status, blockers, and exact next step.
- Explicitly mark prior in-progress tasks completed or cancelled when later messages establish that outcome.
- The final section overrides conflicting or stale status statements preserved from earlier summaries.

Compressed block sections in context are clearly marked with a header:

- \`[Compressed conversation section]\`

Compressed block IDs use the \`bN\` form (never \`mNNNN\`) and are represented in the same XML metadata tag format.

Rules:

- Rewrite all still-relevant information from each included block into the new summary, then include its \`(bN)\` placeholder exactly once as a source acknowledgement. Placeholders are removed; they do not copy old text.
- If you omit a required placeholder, the plugin safely appends that old summary verbatim. This prevents accidental loss but costs tokens, so always include the marker after integrating its content.
- Remove duplicated facts, stale task states, obsolete exploration, and superseded implementation detail. Keep unresolved intent, constraints, decisions, current implementation facts, and exact next steps.
- The resulting summary must replace both raw messages and prior summaries. It may grow when genuinely new durable information appears, but should shrink when old detail becomes redundant or obsolete.

TOKEN-EFFICIENT BOUNDARIES
- If an older raw message is already fully represented by the summary you are creating, include that message inside the selected range instead of leaving a duplicate outside it.
- In particular, absorb an earlier opening request when its intent is already preserved in a recompressed block. Never absorb a still-relevant raw message unless its full intent is retained in the new summary.

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
