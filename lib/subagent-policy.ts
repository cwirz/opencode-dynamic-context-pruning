export const DEFAULT_ALLOW_SUBAGENTS = true

export function restrictCompressToPrimaryAgents(
    opencodeConfig: any,
    compressEnabled: boolean,
    allowSubAgents: boolean,
): void {
    if (!compressEnabled || allowSubAgents) return

    const existingPrimaryTools = opencodeConfig.experimental?.primary_tools ?? []
    opencodeConfig.experimental = {
        ...opencodeConfig.experimental,
        primary_tools: [...existingPrimaryTools, "compress"],
    }
}
