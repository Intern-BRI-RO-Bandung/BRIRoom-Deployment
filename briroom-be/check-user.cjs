const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'db_briroom',
  password: '12345678',
  port: 5432
});

pool.query('SELECT email, password FROM users WHERE email = $1', ['user@bri.co.id'], (err, res) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    if (res.rows.length > 0) {
      const user = res.rows[0];
      console.log('Email:', user.email);
      console.log('Password length:', user.password.length);
      console.log('Password starts with $2b:', user.password.startsWith('$2b$'));
    } else {
      console.log('User not found');
    }
  }
  pool.end();
});
