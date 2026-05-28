const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.tvallyxjyhubcvzpnivg:Jo.9839514500respaldo@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });
client.connect()
  .then(() => client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'partidas';`))
  .then(res => { console.log(res.rows.map(r => r.column_name).join(', ')); client.end(); })
  .catch(e => console.error(e));
