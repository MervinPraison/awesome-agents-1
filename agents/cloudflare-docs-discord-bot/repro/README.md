# Minimal Reproduction: `addMcpServer()` setName Bug

## Issue Summary

When calling `this.addMcpServer()` inside an Agent's `onStart()` method, the following error occurs:

```
Error: Attempting to read .name on CloudflareDocsAgent before it was set.
The name can be set by explicitly calling .setName(name) on the stub,
or by using routePartyKitRequest().
```

**This happens even when the agent is correctly accessed using `getAgentByName()`.**

## Environment

- Package: `agents@0.0.0-cf3b3d7` (beta)
- Runtime: Cloudflare Workers with Durable Objects

## What This Repro Demonstrates

✅ **Correct Usage:**
- Agent is exported correctly: `export { ReproAgent } from './agent'`
- Agent is accessed using `getAgentByName()`: `await getAgentByName(env.REPRO_AGENT, 'test-agent')`
- Durable Object binding is properly configured in `wrangler.toml`

❌ **Bug:**
- `addMcpServer()` still fails with setName error
- The error occurs inside the SDK, not in user code
- The SDK's internal Durable Object creation doesn't call `setName()` properly

## Reproduction Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Dev Server

```bash
npm run dev
```

### 3. Trigger the Bug

```bash
curl http://localhost:8787/test
```

## Expected Behavior

The agent should successfully connect to the MCP server without setName errors.

## Actual Behavior

The following error is thrown from inside `addMcpServer()`:

```
[ReproAgent] onStart() called
[ReproAgent] Calling addMcpServer...
[ReproAgent] addMcpServer failed: Error: Attempting to read .name on ReproAgent before it was set.
```

## Root Cause

The bug is inside the Agents SDK's `addMcpServer()` implementation. When it creates internal Durable Objects for MCP connection management, it doesn't properly call `setName()` on those stubs before trying to read their `.name` property.

## Code Flow

```
Worker Entry Point (index.ts)
  → getAgentByName() ✅ Correct
    → Agent DO created with setName() ✅ Works
      → Agent.onStart() called ✅ Works
        → this.addMcpServer() called ✅ Correct usage
          → SDK creates internal DO for MCP connection ❌ BUG HERE
            → SDK reads stub.name without calling setName() first ❌ FAILS
```

## Files

- `agent.ts` - Minimal Agent that calls `addMcpServer()` in `onStart()`
- `index.ts` - Worker that correctly uses `getAgentByName()`
- `wrangler.toml` - Configuration with DO binding
- `package.json` - Dependencies including `agents@0.0.0-cf3b3d7`

## Additional Context

This issue was reported after being told that the setName issue was "fixed in agents@beta". However, the fix may only apply to user-level Durable Objects, not the internal Durable Objects created by the SDK's MCP client implementation.

## Logs

When running `npm run dev` and calling `/test`, you'll see:

```
GET http://dummy-example.cloudflare.com/cdn-cgi/partyserver/set-name/ - Ok
  (log) [Worker] Using getAgentByName() - CORRECT USAGE
  (log) [Worker] Successfully got agent, calling fetch...
  (log) [ReproAgent] onStart() called
  (log) [ReproAgent] Calling addMcpServer...
  (error) [ReproAgent] addMcpServer failed: Error: Attempting to read .name on ReproAgent before it was set.
  (error) [Worker] Error: Error: Attempting to read .name on ReproAgent before it was set.
```

Note that the first `setName/` call succeeds (for the agent itself), but `addMcpServer()` still fails internally.

---

**Question for the Cloudflare team:** Is there a workaround, or does the SDK need to be fixed to properly handle setName for internal MCP connection Durable Objects?
