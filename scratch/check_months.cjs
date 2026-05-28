const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected to Supabase!");

        const res = await client.query(`
            SELECT EXTRACT(YEAR FROM fecha) as anio,
                   EXTRACT(MONTH FROM fecha) as mes,
                   COUNT(*) as total,
                   MIN(fecha) as min_fecha,
                   MAX(fecha) as max_fecha
            FROM metrados
            GROUP BY anio, mes
            ORDER BY anio, mes;
        `);

        console.log("\n--- DISTRIBUCIÓN DE METRADOS POR AÑO Y MES ---");
        console.table(res.rows);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

main();
