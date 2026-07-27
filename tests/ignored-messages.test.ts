import assert from "node:assert/strict"
import test from "node:test"
import {
    isIgnoredUserMessage,
    minimizeCompletedCompressInputs,
    removeIgnoredUserMessages,
} from "../lib/messages/query"
import type { WithParts } from "../lib/state"

function message(id: string, ignored: boolean): WithParts {
    return {
        info: { id, role: "user", sessionID: "session", time: { created: 1 } },
        parts: [{ type: "text", text: id, ignored }],
    } as unknown as WithParts
}

test("removeIgnoredUserMessages strips DCP UI notices from model context", () => {
    const visible = message("visible", false)
    const notice = message("notice", true)
    const messages = [visible, notice]

    assert.equal(isIgnoredUserMessage(notice), true)
    assert.equal(removeIgnoredUserMessages(messages), 1)
    assert.deepEqual(messages, [visible])
})

test("minimizeCompletedCompressInputs replaces duplicated summaries", () => {
    const messages = [
        {
            info: {
                id: "assistant",
                role: "assistant",
                sessionID: "session",
                time: { created: 1 },
            },
            parts: [
                {
                    type: "tool",
                    tool: "compress",
                    state: {
                        status: "completed",
                        input: {
                            topic: "History",
                            content: [
                                {
                                    startId: "m1",
                                    endId: "m2",
                                    summary: "A very long summary",
                                },
                            ],
                        },
                        output: "Compressed 2 messages",
                    },
                },
            ],
        },
    ] as unknown as WithParts[]

    assert.equal(minimizeCompletedCompressInputs(messages), 1)
    assert.equal(
        (messages[0].parts[0] as any).state.input.content[0].summary,
        "[summary stored in compressed context block]",
    )
    assert.equal(minimizeCompletedCompressInputs(messages), 0)
})

test("minimizeCompletedCompressInputs leaves unfinished calls unchanged", () => {
    const messages = [
        {
            info: {
                id: "assistant",
                role: "assistant",
                sessionID: "session",
                time: { created: 1 },
            },
            parts: [
                {
                    type: "tool",
                    tool: "compress",
                    state: {
                        status: "running",
                        input: { content: [{ summary: "Still needed" }] },
                    },
                },
            ],
        },
    ] as unknown as WithParts[]

    assert.equal(minimizeCompletedCompressInputs(messages), 0)
    assert.equal((messages[0].parts[0] as any).state.input.content[0].summary, "Still needed")
})
