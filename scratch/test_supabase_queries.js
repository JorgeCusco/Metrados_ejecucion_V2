import { createClient } from '@supabase/supabase-js';

const prodUrl = "https://cdinoxmyukpasihkkkmd.supabase.co";
const prodKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkaW5veG15dWtwYXNpaGtra21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjEwNTgsImV4cCI6MjA4OTU5NzA1OH0.giZrcjXwrcKzQSzA9qMDGqMSUOvsvj8TMWToe-1O_hs";

const backupUrl = "https://tvallyxjyhubcvzpnivg.supabase.co";
const backupKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2YWxseXhqeWh1YmN2enBuaXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NjUwNTEsImV4cCI6MjA5NTA0MTA1MX0.miCw8uYI1LlBx4r4t_-De1D9X39tJDH6KhQ_oYPvHR8";

const selectQuery = '*, metrado_trabajador(trabajador_id), partidas(modificacion)';

async function testSupabase(name, url, key) {
    console.log(`\n=== Testing Supabase Client: ${name} ===`);
    const supabase = createClient(url, key);
    
    // 1. Fetch personal
    const { data: personal, error: personalErr } = await supabase.from('trabajadores').select('*').limit(5);
    if (personalErr) {
        console.error("- trabajadores query failed:", personalErr.message);
    } else {
        console.log("- trabajadores query successful, count returned:", personal?.length);
    }

    // 2. Fetch metrados with selectQuery
    const { data: metrados, error: metradosErr } = await supabase
        .from('metrados')
        .select(selectQuery)
        .limit(5);
    
    if (metradosErr) {
        console.error("- metrados selectQuery failed:", metradosErr.message);
    } else {
        console.log("- metrados selectQuery successful, count returned:", metrados?.length);
        if (metrados && metrados.length > 0) {
            console.log("Sample metrado record:", JSON.stringify(metrados[0], null, 2));
        }
    }
}

async function main() {
    await testSupabase("Production (cdinoxmyukpasihkkkmd)", prodUrl, prodKey);
    await testSupabase("Backup (tvallyxjyhubcvzpnivg)", backupUrl, backupKey);
}

main();
