const db = require('../models');

async function exportSeed() {
  try {
    await db.sequelize.authenticate();
    console.log('-- ================================================================');
    console.log('-- MEDMOVE LOCAL DATABASE EXPORT SEED SCRIPT');
    console.log('-- ================================================================\n');

    // 1. Export Providers
    const providers = await db.Provider.findAll({ raw: true });
    console.log('-- Providers Export');
    providers.forEach(p => {
      const keys = Object.keys(p).filter(k => k !== 'createdAt' && k !== 'updatedAt');
      const cols = keys.join(', ');
      const vals = keys.map(k => {
        const val = p[k];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
        if (typeof val === 'number') return val;
        return `'${String(val).replace(/'/g, "''")}'`;
      }).join(', ');
      console.log(`INSERT INTO providers (${cols}) VALUES (${vals});`);
    });

    console.log('\n-- Ambulances Export');
    // 2. Export Ambulances
    const ambulances = await db.Ambulance.findAll({ raw: true });
    ambulances.forEach(a => {
      const keys = Object.keys(a).filter(k => k !== 'createdAt' && k !== 'updatedAt');
      const cols = keys.join(', ');
      const vals = keys.map(k => {
        let val = a[k];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
        if (typeof val === 'number') return val;
        if (typeof val === 'object') val = JSON.stringify(val);
        return `'${String(val).replace(/'/g, "''")}'`;
      }).join(', ');
      console.log(`INSERT INTO ambulances (${cols}) VALUES (${vals});`);
    });

    console.log('\n-- Users Export (Limit 5 Demo Users, Password Excluded)');
    // 3. Export Users
    const users = await db.User.findAll({ limit: 5, raw: true });
    users.forEach(u => {
      delete u.password_hash; // Exclude password
      const keys = Object.keys(u).filter(k => k !== 'createdAt' && k !== 'updatedAt');
      const cols = keys.join(', ');
      const vals = keys.map(k => {
        const val = u[k];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
        if (typeof val === 'number') return val;
        return `'${String(val).replace(/'/g, "''")}'`;
      }).join(', ');
      console.log(`INSERT INTO users (${cols}) VALUES (${vals});`);
    });

    process.exit(0);
  } catch (error) {
    console.error('-- Export failed:', error);
    process.exit(1);
  }
}

exportSeed();
