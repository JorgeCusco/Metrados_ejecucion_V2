import pg from 'pg';
const { Client } = pg;

const prodConnectionString = "postgresql://postgres.cdinoxmyukpasihkkkmd:SxucXihjIVEMUCAD@aws-0-us-west-2.pooler.supabase.com:6543/postgres";

async function main() {
    console.log("=== Checking Views in Production ===");
    const client = new Client({ connectionString: prodConnectionString });
    try {
        await client.connect();
        
        const viewsRes = await client.query(`
            SELECT table_name, table_type
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'VIEW';
        `);
        console.log("VIEWS:");
        console.log(viewsRes.rows);

        // Let's also check if they can select from trabajadores or metrado_trabajador directly on prod!
        try {
            const res = await client.query("select count(*) from trabajadores");
            console.log("trabajadores count on Prod:", res.rows[0].count);
        } catch (err) {
            console.log("trabajadores select failed on Prod:", err.message);
        }

        try {
            const res = await client.query("select count(*) from metrado_trabajador");
            console.log("metrado_trabajador count on Prod:", res.rows[0].count);
        } catch (err) {
            console.log("metrado_trabajador select failed on Prod:", err.message);
        }

        try {
            const res = await client.query("select count(*) from partidas");
            console.log("partidas count on Prod:", res.rows[0].count);
        } catch (err) {
            console.log("partidas select failed on Prod:", err.message);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

main();
