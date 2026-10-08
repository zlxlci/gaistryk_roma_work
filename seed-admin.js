// seed-admin.js
const bcrypt = require('bcrypt');
const pool = require('./db');
(async () => {
  const hash = await bcrypt.hash('Demo77', 10);
  await pool.query(
    `UPDATE users SET password_hash = ? WHERE login = 'Conf2027'`, [hash]
  );
  console.log('Admin password set:', hash);
  process.exit(0);
})();
