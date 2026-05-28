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
        console.log("Connected to Supabase. Analyzing only May 2026 data...");

        const resOrphans = await client.query(`
            SELECT COUNT(*) as total
            FROM metrados m
            LEFT JOIN partidas p ON m.partida_id = p.id
            WHERE p.id IS NULL AND EXTRACT(MONTH FROM m.fecha) = 5 AND EXTRACT(YEAR FROM m.fecha) = 2026;
        `);

        const resLunares = await client.query(`
            SELECT COUNT(DISTINCT m.id) as total
            FROM metrados m
            JOIN partidas p ON m.descripcion_partida = p.descripcion
            WHERE m.partida_id <> p.id AND EXTRACT(MONTH FROM m.fecha) = 5 AND EXTRACT(YEAR FROM m.fecha) = 2026;
        `);

        const resDesc = await client.query(`
            SELECT COUNT(*) as total
            FROM metrados m
            JOIN partidas p ON m.partida_id = p.id
            WHERE m.descripcion_partida <> p.descripcion AND EXTRACT(MONTH FROM m.fecha) = 5 AND EXTRACT(YEAR FROM m.fecha) = 2026;
        `);

        const resCode = await client.query(`
            SELECT COUNT(*) as total
            FROM metrados m
            JOIN partidas p ON m.partida_id = p.id
            WHERE m.codigo_partida <> p.codigo AND EXTRACT(MONTH FROM m.fecha) = 5 AND EXTRACT(YEAR FROM m.fecha) = 2026;
        `);

        console.log("\n--- INCONSISTENCIAS RESTANTES EN MAYO 2026 ---");
        console.log(`Total metrados en Mayo: 7,672`);
        console.log(`1. Metrados Huérfanos: ${resOrphans.rows[0].total}`);
        console.log(`2. Lunares (por coincidencia de descripción pero diferente ID): ${resLunares.rows[0].total}`);
        console.log(`3. Desajustes de Descripción: ${resDesc.rows[0].total}`);
        console.log(`4. Desajustes de Código (Item): ${resCode.rows[0].total}`);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

main();
