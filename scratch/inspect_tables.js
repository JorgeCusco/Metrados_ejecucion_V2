import pg from 'pg';
const { Client } = pg;

const prodConnectionString = "postgresql://postgres.cdinoxmyukpasihkkkmd:SxucXihjIVEMUCAD@aws-0-us-west-2.pooler.supabase.com:6543/postgres";
const backupConnectionString = "postgresql://postgres.tvallyxjyhubcvzpnivg:Jo.9839514500respaldo@aws-1-us-east-2.pooler.supabase.com:6543/postgres";

async function inspectDb(name, connectionString) {
    console.log(`=== Inspecting DB: ${name} ===`);
    const client = new Client({ connectionString });
    try {
        await client.connect();
        
        // List tables
        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
        `);
        const tables = tablesRes.rows.map(r => r.table_name);
        console.log("Tables:", tables.join(', '));

        for (const table of tables) {
            try {
                const countRes = await client.query(`SELECT count(*) FROM "${table}"`);
                console.log(`- ${table}: ${countRes.rows[0].count} rows`);
            } catch (err) {
                console.log(`- ${table}: error reading count (${err.message})`);
            }
        }
    } catch (err) {
        console.error(`Error connecting to ${name}:`, err);
    } finally {
        await client.end();
    }
}

async function main() {
    await inspectDb("Production (cdinoxmyukpasihkkkmd)", prodConnectionString);
    await inspectDb("Backup (tvallyxjyhubcvzpnivg)", backupConnectionString);
}

main();
