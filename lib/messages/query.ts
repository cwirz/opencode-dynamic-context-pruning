import type { PluginConfig } from "../config"
import type { WithParts } from "../state"
import { isMessageWithInfo } from "./shape"

export const getLastUserMessage = (
    messages: WithParts[],
    startIndex?: number,
): WithParts | null => {
    const start = startIndex ?? messages.length - 1
    for (let i = start; i >= 0; i--) {
        const msg = messages[i]
        if (!isMessageWithInfo(msg)) {
            continue
        }
        if (msg.info.role === "user" && !isIgnoredUserMessage(msg)) {
            return msg
        }
    }
    return null
}

export const messageHasCompress = (message: WithParts): boolean => {
    if (!isMessageWithInfo(message)) {
        return false
    }

    if (message.info.role !== "assistant") {
        return false
    }

    const parts = Array.isArray(message.parts) ? message.parts : []
    return parts.some(
        (part) =>
            part.type === "tool" && part.tool === "compress" && part.state?.status === "completed",
    )
}

export const isIgnoredUserMessage = (message: WithParts): boolean => {
    if (!isMessageWithInfo(message)) {
        return false
    }

    if (message.info.role !== "user") {
        return false
    }

    const parts = Array.isArray(message.parts) ? message.parts : []
    if (parts.length === 0) {
        return true
    }

    for (const part of parts) {
        if (!(part as any).ignored) {
            return false
        }
    }

    return true
}

/** Remove plugin/UI-only user messages before the request reaches the model. */
export function removeIgnoredUserMessages(messages: WithParts[]): number {
    const kept = messages.filter((message) => !isIgnoredUserMessage(message))
    const removed = messages.length - kept.length
    if (removed > 0) {
        messages.length = 0
        messages.push(...kept)
    }
    return removed
}

const COMPRESSED_SUMMARY_PLACEHOLDER = "[summary stored in compressed context block]"

/** Avoid sending a second full copy of each summary in completed compress tool history. */
export function minimizeCompletedCompressInputs(messages: WithParts[]): number {
    let minimized = 0

    for (const message of messages) {
        if (!messageHasCompress(message)) {
            continue
        }

        for (const part of message.parts) {
            if (
                part.type !== "tool" ||
                part.tool !== "compress" ||
                part.state?.status !== "completed"
            ) {
                continue
            }

            const content = (part.state.input as any)?.content
            if (!Array.isArray(content)) {
                continue
            }

            for (const range of content) {
                if (
                    typeof range?.summary !== "string" ||
                    range.summary === COMPRESSED_SUMMARY_PLACEHOLDER
                ) {
                    continue
                }
                range.summary = COMPRESSED_SUMMARY_PLACEHOLDER
                minimized++
            }
        }
    }

    return minimized
}

export function isProtectedUserMessage(config: PluginConfig, message: WithParts): boolean {
    if (!isMessageWithInfo(message)) {
        return false
    }

    return (
        config.compress.mode === "message" &&
        config.compress.protectUserMessages &&
        message.info.role === "user" &&
        !isIgnoredUserMessage(message)
    )
}
