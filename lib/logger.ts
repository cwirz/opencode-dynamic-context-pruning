import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { homedir } from "os"
import { type ContextSnapshot, writeContextViewer } from "./context-debug"

export class Logger {
    private logDir: string
    private systemBySession = new Map<string, string[]>()
    private latestSnapshotBySession = new Map<
        string,
        {
            contextDir: string
            fileStem: string
            snapshot: ContextSnapshot
            savedAt: number
        }
    >()
    public enabled: boolean

    constructor(enabled: boolean, logDir?: string) {
        this.enabled = enabled
        const configHome = process.env.XDG_CONFIG_HOME || join(homedir(), ".config")
        this.logDir = logDir || join(configHome, "opencode", "logs", "dcp")
    }

    private async ensureLogDir() {
        if (!existsSync(this.logDir)) {
            await mkdir(this.logDir, { recursive: true })
        }
    }

    private formatData(data?: any): string {
        if (!data) return ""

        const parts: string[] = []
        for (const [key, value] of Object.entries(data)) {
            if (value === undefined || value === null) continue

            // Format arrays compactly
            if (Array.isArray(value)) {
                if (value.length === 0) continue
                parts.push(
                    `${key}=[${value.slice(0, 3).join(",")}${value.length > 3 ? `...+${value.length - 3}` : ""}]`,
                )
            } else if (typeof value === "object") {
                const str = JSON.stringify(value)
                if (str.length < 50) {
                    parts.push(`${key}=${str}`)
                }
            } else {
                parts.push(`${key}=${value}`)
            }
        }
        return parts.join(" ")
    }

    private getCallerFile(skipFrames: number = 3): string {
        const originalPrepareStackTrace = Error.prepareStackTrace
        try {
            const err = new Error()
            Error.prepareStackTrace = (_, stack) => stack
            const stack = err.stack as unknown as NodeJS.CallSite[]
            Error.prepareStackTrace = originalPrepareStackTrace

            // Skip specified number of frames to get to actual caller
            for (let i = skipFrames; i < stack.length; i++) {
                const filename = stack[i]?.getFileName()
                if (filename && !filename.includes("/logger.")) {
                    // Extract just the filename without path and extension
                    const match = filename.match(/([^/\\]+)\.[tj]s$/)
                    return match ? match[1] : filename
                }
            }
            return "unknown"
        } catch {
            return "unknown"
        }
    }

    private async write(level: string, component: string, message: string, data?: any) {
        if (!this.enabled) return

        try {
            await this.ensureLogDir()

            const timestamp = new Date().toISOString()
            const dataStr = this.formatData(data)

            const logLine = `${timestamp} ${level.padEnd(5)} ${component}: ${message}${dataStr ? " | " + dataStr : ""}\n`

            const dailyLogDir = join(this.logDir, "daily")
            if (!existsSync(dailyLogDir)) {
                await mkdir(dailyLogDir, { recursive: true })
            }

            const logFile = join(dailyLogDir, `${new Date().toISOString().split("T")[0]}.log`)
            await writeFile(logFile, logLine, { flag: "a" })
        } catch (error) {}
    }

    info(message: string, data?: any) {
        const component = this.getCallerFile(2)
        return this.write("INFO", component, message, data)
    }

    debug(message: string, data?: any) {
        const component = this.getCallerFile(2)
        return this.write("DEBUG", component, message, data)
    }

    warn(message: string, data?: any) {
        const component = this.getCallerFile(2)
        return this.write("WARN", component, message, data)
    }

    error(message: string, data?: any) {
        const component = this.getCallerFile(2)
        return this.write("ERROR", component, message, data)
    }

    async captureSystemContext(sessionId: string, system: string[]) {
        if (!this.enabled) return
        const capturedSystem = [...system]
        this.systemBySession.set(sessionId, capturedSystem)

        // OpenCode runs message transforms before system transforms. Rewrite the
        // just-written snapshot so both halves represent the same model request.
        const latest = this.latestSnapshotBySession.get(sessionId)
        if (!latest || Date.now() - latest.savedAt > 5_000) return

        try {
            latest.snapshot.system = capturedSystem
            await writeFile(
                join(latest.contextDir, `${latest.fileStem}.json`),
                JSON.stringify(latest.snapshot, null, 2),
            )
            await writeContextViewer(latest.contextDir, latest.fileStem, latest.snapshot)
        } catch (error) {}
    }

    async captureRequestContext(sessionId: string, input: any, output: any) {
        if (!this.enabled) return

        const latest = this.latestSnapshotBySession.get(sessionId)
        if (!latest || Date.now() - latest.savedAt > 5_000) return

        try {
            latest.snapshot.request = { input, output }
            const finalInstructions = output?.options?.instructions
            if (typeof finalInstructions === "string") {
                latest.snapshot.system = [finalInstructions]
                this.systemBySession.set(sessionId, [finalInstructions])
            }
            await writeFile(
                join(latest.contextDir, `${latest.fileStem}.json`),
                JSON.stringify(latest.snapshot, null, 2),
            )
            await writeContextViewer(latest.contextDir, latest.fileStem, latest.snapshot)
        } catch (error) {}
    }

    async saveContext(sessionId: string, messages: any[]) {
        if (!this.enabled) return

        try {
            const contextDir = join(this.logDir, "context", sessionId)
            if (!existsSync(contextDir)) {
                await mkdir(contextDir, { recursive: true })
            }

            const capturedAt = new Date().toISOString()
            const timestamp = capturedAt.replace(/[:.]/g, "-")
            const snapshot: ContextSnapshot = {
                version: 1,
                capturedAt,
                sessionId,
                system: this.systemBySession.get(sessionId) || [],
                messages,
            }
            const contextFile = join(contextDir, `${timestamp}.json`)
            await writeFile(contextFile, JSON.stringify(snapshot, null, 2))
            await writeContextViewer(contextDir, timestamp, snapshot)
            this.latestSnapshotBySession.set(sessionId, {
                contextDir,
                fileStem: timestamp,
                snapshot,
                savedAt: Date.now(),
            })
        } catch (error) {}
    }
}
