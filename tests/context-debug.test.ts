import assert from "node:assert/strict"
import { mkdtemp, readdir, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import {
    renderContextSnapshot,
    type ContextSnapshot,
    writeContextViewer,
} from "../lib/context-debug"
import { Logger } from "../lib/logger"

const snapshot: ContextSnapshot = {
    version: 1,
    capturedAt: "2026-07-27T12:00:00.000Z",
    sessionId: "session-test",
    system: ["System <prompt>"],
    messages: [
        {
            info: { id: "message-1", role: "user" },
            parts: [{ type: "text", text: "Keep task & context" }],
        },
        {
            info: { id: "message-2", role: "assistant" },
            parts: [
                {
                    type: "text",
                    text: "[Compressed conversation section]\nImportant prior task",
                    metadata: { preserved: true },
                },
            ],
        },
    ],
    request: {
        input: { agent: "build" },
        output: { options: { reasoningEffort: "medium" } },
    },
}

test("context viewer renders complete searchable system and message context", () => {
    const html = renderContextSnapshot(snapshot)

    assert.match(html, /System &lt;prompt&gt;/)
    assert.match(html, /Keep task &amp; context/)
    assert.match(html, /Important prior task/)
    assert.match(html, /message-2/)
    assert.match(html, /has-compression/)
    assert.match(html, /&quot;preserved&quot;: true/)
    assert.match(html, /reasoningEffort/)
})

test("context viewer writes timestamped, latest, and history pages", async () => {
    const dir = await mkdtemp(join(tmpdir(), "dcp-context-"))
    await writeContextViewer(dir, "2026-07-27T12-00-00-000Z", snapshot)

    const [timestamped, latest, index] = await Promise.all([
        readFile(join(dir, "2026-07-27T12-00-00-000Z.html"), "utf8"),
        readFile(join(dir, "latest.html"), "utf8"),
        readFile(join(dir, "index.html"), "utf8"),
    ])
    assert.equal(timestamped, latest)
    assert.match(index, /2026-07-27T12-00-00-000Z\.html/)
})

test("late system transform completes the same outgoing context snapshot", async () => {
    const dir = await mkdtemp(join(tmpdir(), "dcp-logger-"))
    const logger = new Logger(true, dir)

    await logger.saveContext(snapshot.sessionId, snapshot.messages)
    await logger.captureSystemContext(snapshot.sessionId, ["Exact outgoing system"])

    const contextDir = join(dir, "context", snapshot.sessionId)
    const jsonName = (await readdir(contextDir)).find((name) => /^\d{4}-.*\.json$/.test(name))
    assert.ok(jsonName)

    const saved = JSON.parse(await readFile(join(contextDir, jsonName), "utf8"))
    assert.deepEqual(saved.system, ["Exact outgoing system"])
    assert.match(await readFile(join(contextDir, "latest.html"), "utf8"), /Exact outgoing system/)
})

test("chat params replace intermediate system with final instructions", async () => {
    const dir = await mkdtemp(join(tmpdir(), "dcp-logger-"))
    const logger = new Logger(true, dir)

    await logger.saveContext(snapshot.sessionId, snapshot.messages)
    await logger.captureRequestContext(
        snapshot.sessionId,
        { agent: "build" },
        { options: { instructions: "Final outgoing instructions", reasoningEffort: "high" } },
    )

    const contextDir = join(dir, "context", snapshot.sessionId)
    const jsonName = (await readdir(contextDir)).find((name) => /^\d{4}-.*\.json$/.test(name))
    assert.ok(jsonName)
    const saved = JSON.parse(await readFile(join(contextDir, jsonName), "utf8"))
    assert.deepEqual(saved.system, ["Final outgoing instructions"])
    assert.equal(saved.request.output.options.reasoningEffort, "high")
    assert.match(
        await readFile(join(contextDir, "latest.html"), "utf8"),
        /Final outgoing instructions/,
    )
})
