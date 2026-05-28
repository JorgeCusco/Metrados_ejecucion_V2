import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.cdinoxmyukpasihkkkmd:SxucXihjIVEMUCAD@aws-0-us-west-2.pooler.supabase.com:6543/postgres";

async function main() {
    const client = new Client({
        connectionString
    });
    try {
        await client.connect();
        
        const metrados = await client.query("select count(*) from metrados");
        console.log("Metrados en cdinoxmyukpasihkkkmd:", metrados.rows[0].count);

        const personal = await client.query("select count(*) from personal");
        console.log("Personal en cdinoxmyukpasihkkkmd:", personal.rows[0].count);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

main();
