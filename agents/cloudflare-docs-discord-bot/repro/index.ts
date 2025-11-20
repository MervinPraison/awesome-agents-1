import { getAgentByName } from 'agents';
import type { ReproAgent } from './agent';

export { ReproAgent } from './agent';

interface Env {
  REPRO_AGENT: DurableObjectNamespace<ReproAgent>;
  MCP_SERVER_URL: string;
}

/**
 * Minimal reproduction worker
 *
 * This demonstrates the correct usage pattern:
 * - Uses getAgentByName() to access the agent ✅
 * - Agent is properly exported ✅
 * - Durable Object binding is configured ✅
 *
 * But addMcpServer() still fails with setName error ❌
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    console.log('[Worker] Received request:', url.pathname);

    if (url.pathname === '/test') {
      try {
        console.log('[Worker] Using getAgentByName() - CORRECT USAGE');

        // This is the correct way to access an agent
        const agent = await getAgentByName(env.REPRO_AGENT, 'test-agent');

        console.log('[Worker] Successfully got agent, calling fetch...');

        // Call the agent - this will trigger onStart() which calls addMcpServer()
        const response = await agent.fetch(
          new Request('http://agent/test', {
            method: 'GET',
          })
        );

        const data = await response.json();

        return Response.json({
          success: true,
          message: 'Agent accessed correctly using getAgentByName()',
          agentResponse: data,
        });
      } catch (error) {
        console.error('[Worker] Error:', error);

        return Response.json(
          {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            message:
              'addMcpServer() failed even though getAgentByName() was used correctly',
          },
          { status: 500 }
        );
      }
    }

    return Response.json({
      message: 'Minimal reproduction for addMcpServer setName bug',
      usage: 'GET /test - Trigger the bug',
      note: 'This correctly uses getAgentByName() but addMcpServer() still fails',
    });
  },
};
