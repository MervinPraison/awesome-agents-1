export function renderDashboard(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent Console</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0a0a0a;
      --surface: #141414;
      --border: #262626;
      --text: #e5e5e5;
      --text-muted: #737373;
      --accent: #3b82f6;
    }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      min-height: 100vh;
    }
    .mono { font-family: 'JetBrains Mono', monospace; font-size: 13px; }
    .container { max-width: 1200px; margin: 0 auto; padding: 48px 24px; }
    header { margin-bottom: 48px; }
    header h1 { font-size: 20px; font-weight: 600; letter-spacing: -0.02em; }
    header p { color: var(--text-muted); font-size: 14px; margin-top: 4px; }
    .controls { display: flex; gap: 12px; align-items: center; margin-bottom: 40px; }
    button {
      font-family: inherit;
      font-size: 13px;
      font-weight: 500;
      padding: 8px 16px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--surface);
      color: var(--text);
      cursor: pointer;
      transition: all 0.15s;
    }
    button:hover { border-color: #404040; background: #1a1a1a; }
    button.primary { background: var(--accent); border-color: var(--accent); }
    button.primary:hover { background: #2563eb; }
    #status { color: var(--text-muted); font-size: 12px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
    }
    .card.full { grid-column: span 2; }
    @media (max-width: 768px) { .card.full { grid-column: span 1; } }
    .card-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-title span { font-weight: 400; text-transform: none; letter-spacing: normal; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: var(--text-muted); }
    .scroll-area { max-height: 400px; overflow-y: auto; }
    .scroll-area::-webkit-scrollbar { width: 6px; }
    .scroll-area::-webkit-scrollbar-track { background: transparent; }
    .scroll-area::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
    .message {
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 8px;
      border-left: 2px solid var(--border);
      background: rgba(255,255,255,0.02);
    }
    .message.user { border-left-color: #3b82f6; }
    .message.assistant { border-left-color: #10b981; }
    .message.tool { border-left-color: #8b5cf6; }
    .message-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .message-role { font-weight: 500; }
    .message.user .message-role { color: #3b82f6; }
    .message.assistant .message-role { color: #10b981; }
    .message.tool .message-role { color: #8b5cf6; }
    .message-id { color: var(--text-muted); font-family: 'JetBrains Mono', monospace; }
    .message-content { color: #d4d4d4; white-space: pre-wrap; word-break: break-word; }
    .block { background: rgba(255,255,255,0.02); border-radius: 6px; padding: 16px; margin-bottom: 12px; }
    .block:last-child { margin-bottom: 0; }
    .block-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .block-label { font-weight: 500; color: var(--text); }
    .block-meta { font-size: 11px; color: var(--text-muted); }
    .block-desc { font-size: 13px; color: var(--text-muted); margin-bottom: 12px; }
    .block-value {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 12px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .empty { color: var(--text-muted); font-style: italic; padding: 20px 0; text-align: center; }
    .mcp-form { display: flex; gap: 8px; margin-bottom: 16px; }
    .mcp-form input {
      flex: 1;
      font-family: inherit;
      font-size: 13px;
      padding: 8px 12px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--bg);
      color: var(--text);
    }
    .mcp-form input::placeholder { color: var(--text-muted); }
    .mcp-form input:focus { outline: none; border-color: var(--accent); }
    .server-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: rgba(255,255,255,0.02);
      border-radius: 6px;
      margin-bottom: 8px;
    }
    .server-item:last-child { margin-bottom: 0; }
    .server-info { flex: 1; }
    .server-name { font-weight: 500; margin-bottom: 2px; }
    .server-url { font-size: 12px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; }
    .server-state { font-size: 11px; padding: 2px 8px; border-radius: 4px; margin-left: 12px; }
    .server-state.ready { background: rgba(16,185,129,0.2); color: #10b981; }
    .server-state.authenticating { background: rgba(245,158,11,0.2); color: #f59e0b; }
    .server-state.connecting, .server-state.discovering { background: rgba(59,130,246,0.2); color: #3b82f6; }
    .server-state.failed { background: rgba(239,68,68,0.2); color: #ef4444; }
    .btn-remove {
      padding: 4px 8px;
      font-size: 11px;
      background: transparent;
      border-color: #ef4444;
      color: #ef4444;
    }
    .btn-remove:hover { background: rgba(239,68,68,0.1); }
    .tool-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
    .tool-tag {
      font-size: 11px;
      padding: 4px 8px;
      background: rgba(139,92,246,0.15);
      color: #a78bfa;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Agent Console</h1>
      <p>Discord Agent — State & Memory Inspector</p>
    </header>

    <div class="controls">
      <button id="startBtn" class="primary">Start Gateway</button>
      <button id="refreshBtn">Refresh</button>
      <span id="status"></span>
    </div>

    <div class="grid">
      <div class="card">
        <div class="card-title">Agent Info</div>
        <div id="info" class="mono">Loading...</div>
      </div>

      <div class="card">
        <div class="card-title">Storage</div>
        <div id="stats" class="mono">Loading...</div>
      </div>

      <div class="card full">
        <div class="card-title">MCP Servers</div>
        <div class="mcp-form">
          <input type="text" id="mcpName" placeholder="Server name">
          <input type="text" id="mcpUrl" placeholder="https://mcp-server.example.com/mcp">
          <button id="addMcpBtn">Connect</button>
        </div>
        <div id="mcpServers">Loading...</div>
        <div id="mcpTools"></div>
      </div>

      <div class="card full">
        <div class="card-title">Memory Blocks</div>
        <div id="blocks">Loading...</div>
      </div>

      <div class="card full">
        <div class="card-title">
          Context Window
          <span id="contextSize"></span>
        </div>
        <div id="context" class="scroll-area">Loading...</div>
      </div>

      <div class="card full">
        <div class="card-title">
          Message History
          <span id="totalMessages"></span>
        </div>
        <div id="messages" class="scroll-area">Loading...</div>
      </div>
    </div>
  </div>

  <script>
    const esc = s => s ? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '';

    const renderMsg = m => {
      const c = m.content || (m.tool_calls ? JSON.stringify(m.tool_calls, null, 2) : '');
      const sum = m.id?.startsWith('summary_') ? ' (summary)' : '';
      return \`<div class="message \${m.role}">
        <div class="message-header">
          <span class="message-role">\${m.role}\${sum}</span>
          <span class="message-id">\${m.id?.slice(0,12) || ''}</span>
        </div>
        <div class="message-content mono">\${esc(c)}</div>
      </div>\`;
    };

    const renderBlock = b => \`<div class="block">
      <div class="block-header">
        <span class="block-label">\${esc(b.label)}</span>
        <span class="block-meta">\${b.value?.length || 0}/\${b.limit}</span>
      </div>
      <div class="block-desc">\${esc(b.description)}</div>
      <div class="block-value mono">\${esc(b.value)}</div>
    </div>\`;

    async function loadMcp() {
      try {
        const mcp = await (await fetch('/api/mcp/servers')).json();
        const servers = Object.entries(mcp.servers || {});
        if (servers.length === 0) {
          document.getElementById('mcpServers').innerHTML = '<div class="empty">No MCP servers connected</div>';
        } else {
          document.getElementById('mcpServers').innerHTML = servers.map(([id, srv]) => \`
            <div class="server-item">
              <div class="server-info">
                <div class="server-name">\${esc(srv.name)}</div>
                <div class="server-url">\${esc(srv.server_url)}</div>
              </div>
              <span class="server-state \${srv.state}">\${srv.state}</span>
              \${srv.state === 'authenticating' ? \`<a href="\${srv.auth_url}" target="_blank"><button>Authenticate</button></a>\` : ''}
              <button class="btn-remove" onclick="removeMcp('\${id}')">Remove</button>
            </div>
          \`).join('');
        }
        const tools = mcp.tools || [];
        if (tools.length > 0) {
          document.getElementById('mcpTools').innerHTML = \`
            <div style="margin-top: 12px; font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Available Tools (\${tools.length})</div>
            <div class="tool-list">\${tools.map(t => \`<span class="tool-tag">\${esc(t.name)}</span>\`).join('')}</div>
          \`;
        } else {
          document.getElementById('mcpTools').innerHTML = '';
        }
      } catch (e) { console.error('MCP load error:', e); }
    }

    async function load() {
      try {
        const s = await (await fetch('/api/state')).json();
        document.getElementById('info').innerHTML = \`
          <div class="info-row"><span class="info-label">User ID</span><span>\${s.info.userId || '—'}</span></div>
          <div class="info-row"><span class="info-label">DM Channel</span><span>\${s.info.dmChannel || '—'}</span></div>\`;
        document.getElementById('stats').innerHTML = \`
          <div class="info-row"><span class="info-label">Messages stored</span><span>\${s.storage.totalMessages}</span></div>
          <div class="info-row"><span class="info-label">Context usage</span><span>\${s.context.bufferSize} / \${s.context.maxSize}</span></div>\`;
        document.getElementById('contextSize').textContent = \`\${s.context.bufferSize}/\${s.context.maxSize}\`;
        document.getElementById('totalMessages').textContent = \`\${s.storage.totalMessages} messages\`;
        const bl = s.memory.blocks || [];
        document.getElementById('blocks').innerHTML = bl.length ? bl.map(renderBlock).join('') : '<div class="empty">No memory blocks</div>';
        const ctx = s.context.messages || [];
        document.getElementById('context').innerHTML = ctx.length ? ctx.map(renderMsg).join('') : '<div class="empty">Empty context</div>';
        const all = s.storage.allMessages || [];
        document.getElementById('messages').innerHTML = all.length ? all.map(renderMsg).join('') : '<div class="empty">No messages</div>';
        document.getElementById('status').textContent = new Date().toLocaleTimeString();
        await loadMcp();
      } catch (e) { document.getElementById('status').textContent = 'Error: ' + e.message; }
    }

    document.getElementById('startBtn').onclick = async () => {
      document.getElementById('status').textContent = 'Starting...';
      const ok = (await fetch('/start', { method: 'POST' })).ok;
      document.getElementById('status').textContent = ok ? 'Gateway started' : 'Failed';
    };
    document.getElementById('refreshBtn').onclick = load;

    document.getElementById('addMcpBtn').onclick = async () => {
      const name = document.getElementById('mcpName').value.trim();
      const url = document.getElementById('mcpUrl').value.trim();
      if (!name || !url) return alert('Please enter both name and URL');
      document.getElementById('addMcpBtn').textContent = 'Connecting...';
      try {
        const res = await fetch('/api/mcp/servers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, url })
        });
        const result = await res.json();
        if (result.state === 'authenticating') {
          window.open(result.authUrl, '_blank');
        }
        document.getElementById('mcpName').value = '';
        document.getElementById('mcpUrl').value = '';
        await loadMcp();
      } catch (e) { alert('Failed: ' + e.message); }
      document.getElementById('addMcpBtn').textContent = 'Connect';
    };

    window.removeMcp = async (id) => {
      if (!confirm('Remove this MCP server?')) return;
      await fetch('/api/mcp/servers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      await loadMcp();
    };

    load();
    setInterval(load, 5000);
  </script>
</body>
</html>`;
}
