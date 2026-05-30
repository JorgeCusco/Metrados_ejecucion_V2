const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const matchUrl = env.match(/VITE_SUPABASE_URL_BACKUP=(.*)/);
const matchKey = env.match(/VITE_SUPABASE_ANON_KEY_BACKUP=(.*)/);
const supabase = createClient(matchUrl[1].trim(), matchKey[1].trim());

async function checkPC() {
    const { data, error } = await supabase.from('partidas').select('id, codigo, descripcion, proyecto_id, modificacion').eq('modificacion', 'PC');
    if (error) console.error(error);
    else console.log('PC Partidas:', data);
}
checkPC();
