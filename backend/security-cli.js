const http = require('http');
const secret = process.env.SECURITY_SECRET || 'medmove_security_2026';

const fetchSecurity = (path) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 5000,
      path: `/api/security/${path}`,
      method: 'GET',
      headers: { 'x-security-key': secret }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
};

const printBanner = () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   MedMove Security Guardian — CLI      ║');
  console.log('╚════════════════════════════════════════╝\n');
};

const printStats = (stats) => {
  console.log('📊 SECURITY OVERVIEW');
  console.log('─'.repeat(40));
  console.log(`Total events logged : ${stats.total_events}`);
  console.log(`IPs currently blocked: ${stats.blocked_ips}`);
  console.log('\n📋 Events by type:');
  Object.entries(stats.events_by_type || {}).forEach(([type, count]) => {
    const bar = '█'.repeat(Math.min(count, 20));
    console.log(`  ${type.padEnd(30)} ${bar} ${count}`);
  });
  if (stats.last_event) {
    console.log(`\n⏰ Last event: ${stats.last_event.type} at ${stats.last_event.timestamp}`);
  }
};

const printLog = (events) => {
  console.log('\n📜 RECENT SECURITY EVENTS (last 10)');
  console.log('─'.repeat(40));
  if (!events || !events.length) {
    console.log('  No events recorded yet.');
    return;
  }
  events.slice(-10).forEach(e => {
    const icon = e.type.includes('BRUTE') ? '🔴' :
                 e.type.includes('INJECT') ? '🚨' :
                 e.type.includes('SCRAP') ? '🟡' : '🟠';
    console.log(`  ${icon} ${e.type}`);
    console.log(`     IP: ${e.ip} | Time: ${e.timestamp}`);
  });
};

const printBlocked = (ips) => {
  console.log('\n🚫 CURRENTLY BLOCKED IPs');
  console.log('─'.repeat(40));
  if (!ips || !ips.length) {
    console.log('  No IPs currently blocked. ✅');
    return;
  }
  ips.forEach(b => {
    console.log(`  ${b.ip} — blocked until ${b.blocked_until} (${b.remaining_minutes} min left)`);
  });
};

const command = process.argv[2] || 'status';

(async () => {
  printBanner();

  try {
    if (command === 'status' || command === 'stats') {
      const data = await fetchSecurity('stats');
      printStats(data.stats);

    } else if (command === 'log') {
      const data = await fetchSecurity('log');
      printLog(data.events);

    } else if (command === 'blocked') {
      const data = await fetchSecurity('blocked');
      printBlocked(data.blocked_ips);

    } else if (command === 'all') {
      const [statsData, logData, blockedData] = await Promise.all([
        fetchSecurity('stats'),
        fetchSecurity('log'),
        fetchSecurity('blocked')
      ]);
      printStats(statsData.stats);
      printLog(logData.events);
      printBlocked(blockedData.blocked_ips);

    } else {
      console.log('Usage: node security-cli.js [status|log|blocked|all]');
      console.log('  status  — show security overview');
      console.log('  log     — show recent security events');
      console.log('  blocked — show currently blocked IPs');
      console.log('  all     — show everything');
    }

  } catch (err) {
    console.error('❌ Could not connect to MedMove backend.');
    console.error('   Make sure the server is running: node server.js');
  }

  console.log('\n');
})();
