const { getSecurityLog, getBlockedIPs, getStats, sendDiscordAlert } = require('./middleware/securityGuard');

// MCP Server implementation over stdio
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// MCP tool definitions
const tools = {
  get_security_stats: {
    description: 'Get overall MedMove security statistics — total events, blocked IPs, event breakdown by type',
    parameters: {},
    handler: () => getStats()
  },

  get_recent_attacks: {
    description: 'Get the last N security events detected by MedMove Security Guardian',
    parameters: {
      limit: { type: 'number', description: 'Number of recent events to return (default 10)' }
    },
    handler: ({ limit = 10 }) => {
      const log = getSecurityLog();
      return { events: log.slice(-limit), total: log.length };
    }
  },

  get_blocked_ips: {
    description: 'Get list of currently blocked IP addresses and when they will be unblocked',
    parameters: {},
    handler: () => ({ blocked_ips: getBlockedIPs() })
  },

  send_security_alert: {
    description: 'Manually send a security alert to the MedMove owner via Discord',
    parameters: {
      type: { type: 'string', description: 'Type of alert' },
      severity: { type: 'string', description: 'LOW, MEDIUM, HIGH, or CRITICAL' },
      details: { type: 'string', description: 'Alert details' }
    },
    handler: async ({ type, severity, details }) => {
      await sendDiscordAlert({ type, severity, details, action: 'Manual alert from MCP' });
      return { sent: true, message: 'Alert sent to Discord' };
    }
  },

  check_ip_status: {
    description: 'Check if a specific IP address is currently blocked',
    parameters: {
      ip: { type: 'string', description: 'IP address to check' }
    },
    handler: ({ ip }) => {
      const blocked = getBlockedIPs();
      const found = blocked.find(b => b.ip === ip);
      return found
        ? { blocked: true, ...found }
        : { blocked: false, ip, status: 'clean' };
    }
  }
};

// Handle MCP protocol messages
rl.on('line', async (line) => {
  try {
    const message = JSON.parse(line);

    if (message.method === 'initialize') {
      console.log(JSON.stringify({
        jsonrpc: '2.0', id: message.id,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: { name: 'medmove-security-mcp', version: '1.0.0' },
          capabilities: { tools: {} }
        }
      }));
    }

    else if (message.method === 'tools/list') {
      console.log(JSON.stringify({
        jsonrpc: '2.0', id: message.id,
        result: {
          tools: Object.entries(tools).map(([name, tool]) => ({
            name,
            description: tool.description,
            inputSchema: {
              type: 'object',
              properties: tool.parameters || {}
            }
          }))
        }
      }));
    }

    else if (message.method === 'tools/call') {
      const { name, arguments: args } = message.params;
      const tool = tools[name];

      if (!tool) {
        console.log(JSON.stringify({
          jsonrpc: '2.0', id: message.id,
          error: { code: -32601, message: `Tool not found: ${name}` }
        }));
        return;
      }

      const result = await tool.handler(args || {});
      console.log(JSON.stringify({
        jsonrpc: '2.0', id: message.id,
        result: {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        }
      }));
    }

  } catch (err) {
    console.error('[MCP] Error:', err.message);
  }
});

console.error('[MedMove Security MCP] Server started on stdio');
