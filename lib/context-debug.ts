import { readdir, writeFile } from "fs/promises"
import { basename, join } from "path"

export type ContextSnapshot = {
    version: 1
    capturedAt: string
    sessionId: string
    system: string[]
    messages: any[]
    request?: {
        input: any
        output: any
    }
}

function escapeHtml(value: unknown): string {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")
}

function pretty(value: unknown): string {
    if (typeof value === "string") return value
    return JSON.stringify(value, null, 2)
}

function renderPart(part: any, index: number): string {
    const type = part?.type || "unknown"
    const compressionClass =
        typeof part?.text === "string" && part.text.includes("[Compressed conversation section]")
            ? " compression"
            : ""
    const visible =
        type === "text" || type === "reasoning"
            ? part.text
            : type === "tool"
              ? {
                    tool: part.tool,
                    callID: part.callID,
                    status: part.state?.status,
                    input: part.state?.input,
                    output: part.state?.output,
                    error: part.state?.error,
                }
              : part

    return `<section class="part${compressionClass}">
        <div class="part-title">${escapeHtml(type)} <span>#${index + 1}</span></div>
        <pre>${escapeHtml(pretty(visible))}</pre>
        <details><summary>Raw part JSON</summary><pre>${escapeHtml(pretty(part))}</pre></details>
    </section>`
}

function renderMessage(message: any, index: number): string {
    const info = message?.info || {}
    const role = info.role || "unknown"
    const id = info.id || info.messageID || "no id"
    const parts = Array.isArray(message?.parts) ? message.parts : []
    const compression = parts.some(
        (part: any) =>
            typeof part?.text === "string" &&
            part.text.includes("[Compressed conversation section]"),
    )
    const tokens = info.tokens
        ? ` · tokens ${escapeHtml(
              [info.tokens.input, info.tokens.output, info.tokens.reasoning]
                  .filter((value) => typeof value === "number")
                  .join("/"),
          )}`
        : ""

    return `<article class="message role-${escapeHtml(role)}${compression ? " has-compression" : ""}">
        <header><span class="role">${escapeHtml(role)}</span><span>${index + 1} · ${escapeHtml(id)}${tokens}</span></header>
        <div class="parts">${parts.map(renderPart).join("") || '<p class="empty">No parts</p>'}</div>
        <details class="raw"><summary>Raw message JSON</summary><pre>${escapeHtml(pretty(message))}</pre></details>
    </article>`
}

export function renderContextSnapshot(snapshot: ContextSnapshot): string {
    const request = snapshot.request
        ? `<article class="request"><header>Final chat.params hook payload</header><pre>${escapeHtml(pretty(snapshot.request))}</pre></article>`
        : '<p class="empty">Final request parameters unavailable for this snapshot.</p>'
    const system = snapshot.system
        .map(
            (prompt, index) =>
                `<article class="system-message"><header>System prompt ${index + 1}</header><pre>${escapeHtml(prompt)}</pre></article>`,
        )
        .join("")
    const messages = snapshot.messages.map(renderMessage).join("")

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>DCP context · ${escapeHtml(snapshot.sessionId)}</title>
<style>
:root{color-scheme:dark;--bg:#0b0d10;--panel:#141820;--line:#29303d;--text:#e8edf5;--muted:#93a0b4;--accent:#75baff;--user:#9b87f5;--assistant:#4fd1a1;--compression:#f5b942}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace}main{width:min(1200px,calc(100% - 32px));margin:24px auto 80px}.toolbar{position:sticky;top:0;z-index:2;background:rgba(11,13,16,.94);backdrop-filter:blur(12px);padding:12px 0 16px;border-bottom:1px solid var(--line)}h1{font:700 22px/1.2 system-ui;margin:0 0 6px}.meta{color:var(--muted);margin-bottom:12px}input{width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--text);font:inherit}.section-title{color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.12em;margin:24px 0 8px}.message,.system-message{border:1px solid var(--line);border-radius:10px;background:var(--panel);margin:10px 0;overflow:hidden}.message>header,.system-message>header{display:flex;gap:12px;justify-content:space-between;padding:10px 12px;border-bottom:1px solid var(--line);color:var(--muted)}.role{font-weight:700;color:var(--accent)}.role-user .role{color:var(--user)}.role-assistant .role{color:var(--assistant)}.has-compression{border-color:var(--compression)}.parts{padding:4px 12px}.part{padding:10px 0;border-bottom:1px solid var(--line)}.part:last-child{border-bottom:0}.part-title{color:var(--accent);font-weight:700;margin-bottom:6px}.part-title span{color:var(--muted);font-weight:400}.compression .part-title{color:var(--compression)}pre{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace}.system-message pre{padding:12px}.raw,details{color:var(--muted)}.raw{border-top:1px solid var(--line);padding:8px 12px}details pre{color:var(--text);margin-top:8px}.hidden{display:none}.empty{color:var(--muted)}a{color:var(--accent)}
</style>
</head>
<body><main>
<div class="toolbar"><h1>LLM context snapshot</h1><div class="meta">${escapeHtml(snapshot.capturedAt)} · ${escapeHtml(snapshot.sessionId)} · ${snapshot.system.length} system prompts · ${snapshot.messages.length} messages</div><input id="filter" type="search" placeholder="Filter roles, IDs, summaries, tools, or content…" autofocus></div>
<div class="section-title">Final request parameters</div>${request}
<div class="section-title">System context</div>${system || '<p class="empty">System context unavailable for this snapshot.</p>'}
<div class="section-title">Conversation context</div>${messages || '<p class="empty">No conversation messages.</p>'}
</main><script>
const filter=document.querySelector('#filter');filter.addEventListener('input',()=>{const q=filter.value.toLowerCase();document.querySelectorAll('.message,.system-message,.request').forEach(el=>el.classList.toggle('hidden',!el.textContent.toLowerCase().includes(q)))})
</script></body></html>`
}

export async function writeContextViewer(
    contextDir: string,
    fileStem: string,
    snapshot: ContextSnapshot,
): Promise<void> {
    const html = renderContextSnapshot(snapshot)
    await Promise.all([
        writeFile(join(contextDir, `${fileStem}.html`), html),
        writeFile(join(contextDir, "latest.html"), html),
    ])

    const snapshots = (await readdir(contextDir))
        .filter((name) => /^\d{4}-.*\.html$/.test(name))
        .sort()
        .reverse()
    const rows = snapshots
        .map(
            (name) =>
                `<li><a href="${escapeHtml(name)}">${escapeHtml(basename(name, ".html"))}</a></li>`,
        )
        .join("")
    await writeFile(
        join(contextDir, "index.html"),
        `<!doctype html><meta charset="utf-8"><title>DCP context history</title><style>body{max-width:900px;margin:40px auto;background:#0b0d10;color:#e8edf5;font:14px/1.7 ui-monospace,monospace}a{color:#75baff}li{margin:4px 0}</style><h1>DCP context history</h1><p>${escapeHtml(snapshot.sessionId)} · newest first · <a href="latest.html">latest snapshot</a></p><ol>${rows}</ol>`,
    )
}
