import assert from "node:assert/strict"
import test from "node:test"
import { DEFAULT_ALLOW_SUBAGENTS, restrictCompressToPrimaryAgents } from "../lib/subagent-policy"

test("subagents are enabled by default", () => {
    assert.equal(DEFAULT_ALLOW_SUBAGENTS, true)
})

test("explicit false restricts compress to primary agents", () => {
    const opencodeConfig: any = { experimental: { primary_tools: ["existing"] } }

    restrictCompressToPrimaryAgents(opencodeConfig, true, false)

    assert.deepEqual(opencodeConfig.experimental.primary_tools, ["existing", "compress"])
})

test("default subagent access leaves primary tools unrestricted", () => {
    const opencodeConfig: any = { experimental: { primary_tools: ["existing"] } }

    restrictCompressToPrimaryAgents(opencodeConfig, true, DEFAULT_ALLOW_SUBAGENTS)

    assert.deepEqual(opencodeConfig.experimental.primary_tools, ["existing"])
})
