const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.tvallyxjyhubcvzpnivg:Jo.9839514500respaldo@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });
client.connect()
  .then(() => client.query(`NOTIFY pgrst, 'reload schema';`))
  .then(() => { console.log('Cache Reloaded'); client.end(); })
  .catch(e => console.error(e));
