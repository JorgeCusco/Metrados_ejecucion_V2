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
        console.log("Connected to Supabase. Inspecting columns and timestamps in the 'partidas' table...\n");

        // 1. Check all column names in the 'partidas' table
        const resCols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'partidas';
        `);
        console.log("--- Columnas en la tabla 'partidas' ---");
        console.table(resCols.rows);

        // Check if there is a created_at or similar column
        const hasCreatedAt = resCols.rows.some(r => r.column_name === 'created_at');
        
        if (hasCreatedAt) {
            console.log("\n--- Distribución de Fechas/Horas de Inserción (created_at) ---");
            const resTimestamps = await client.query(`
                SELECT created_at::date as fecha,
                       EXTRACT(HOUR FROM created_at) as hora,
                       COUNT(*) as total
                FROM partidas
                GROUP BY fecha, hora
                ORDER BY fecha DESC, hora DESC
                LIMIT 30;
            `);
            console.table(resTimestamps.rows);
            
            const resExtremes = await client.query(`
                SELECT MIN(created_at) as primer_registro,
                       MAX(created_at) as ultimo_registro
                FROM partidas;
            `);
            console.log("\n--- Rango Extremo de created_at ---");
            console.table(resExtremes.rows);
        } else {
            console.log("\nNo se detectó la columna 'created_at' en la tabla 'partidas'.");
            console.log("Veamos si existen metadatos o registros históricos que den indicios de la fecha.");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

main();
