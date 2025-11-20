import { Agent } from 'agents';

/**
 * Minimal reproduction case for addMcpServer setName bug
 *
 * This agent demonstrates the issue where addMcpServer() throws:
 * "Attempting to read .name on Agent before it was set"
 *
 * Even though the agent itself is accessed correctly using getAgentByName()
 */

interface Env {
  // MCP Server URL
  MCP_SERVER_URL: string;
}

interface AgentState {
  initialized: boolean;
}

export class ReproAgent extends Agent<Env, AgentState> {
  initialState: AgentState = {
    initialized: false,
  };

  async onStart(): Promise<void> {
    console.log('[ReproAgent] onStart() called - MCP will be initialized on first request');
  }

  async fetch(request: Request): Promise<Response> {
    // Initialize MCP on first request (within request context)
    if (!this.state.initialized) {
      console.log('[ReproAgent] First fetch - initializing MCP within request context');

      try {
        console.log('[ReproAgent] Calling addMcpServer...');

        // Extract callback host from the request
        const url = new URL(request.url);
        const callbackHost = `${url.protocol}//${url.host}`;
        console.log('[ReproAgent] Using callbackHost:', callbackHost);

        const { id } = await this.addMcpServer(
          'TestServer',
          this.env.MCP_SERVER_URL,
          callbackHost  // Explicitly pass callback host
        );
        console.log('[ReproAgent] Successfully added MCP server:', id);

        // Mark as initialized
        this.setState({ initialized: true });

      } catch (error) {
        console.error('[ReproAgent] addMcpServer failed:', error);
        return Response.json({
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to initialize MCP server'
        }, { status: 500 });
      }
    }

    return Response.json({
      message: 'Hello from ReproAgent',
      initialized: this.state.initialized,
    });
  }
}

export default ReproAgent;
