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

        console.log("\n--- ANALIZANDO MÁXIMOS Y MÍNIMOS DE 'created_at' EN METRADOS DE MAYO 2026 ---");
        const resExtremes = await client.query(`
            SELECT MIN(created_at) as primer_created_at,
                   MAX(created_at) as ultimo_created_at,
                   COUNT(*) as total
            FROM metrados
            WHERE EXTRACT(MONTH FROM fecha) = 5 AND EXTRACT(YEAR FROM fecha) = 2026;
        `);
        console.table(resExtremes.rows);

        console.log("\n--- DISTRIBUCIÓN DE INSERCIONES POR DÍA EN MAYO (created_at) ---");
        const resDays = await client.query(`
            SELECT created_at::date as fecha_insercion,
                   COUNT(*) as cantidad_insertada,
                   MIN(created_at) as hora_inicio,
                   MAX(created_at) as hora_fin
            FROM metrados
            WHERE EXTRACT(MONTH FROM fecha) = 5 AND EXTRACT(YEAR FROM fecha) = 2026
            GROUP BY fecha_insercion
            ORDER BY fecha_insercion DESC;
        `);
        console.table(resDays.rows);

        console.log("\n--- DETECCION DE FECHA QUIEBRE (Inserción de metrados desajustados por fecha) ---");
        console.log("Veamos cuándo se registraron metrados con desajustes de descripción o código en Mayo:");
        const resQuiebre = await client.query(`
            SELECT m.created_at::date as fecha_insercion,
                   EXTRACT(HOUR FROM m.created_at) as hora_insercion,
                   COUNT(*) as total_registrados,
                   COUNT(CASE WHEN m.codigo_partida <> p.codigo OR m.descripcion_partida <> p.descripcion THEN 1 END) as con_desajuste
            FROM metrados m
            LEFT JOIN partidas p ON m.partida_id = p.id
            WHERE EXTRACT(MONTH FROM m.fecha) = 5 AND EXTRACT(YEAR FROM m.fecha) = 2026
            GROUP BY fecha_insercion, hora_insercion
            HAVING COUNT(CASE WHEN m.codigo_partida <> p.codigo OR m.descripcion_partida <> p.descripcion THEN 1 END) > 0
            ORDER BY fecha_insercion DESC, hora_insercion DESC
            LIMIT 15;
        `);
        console.table(resQuiebre.rows);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

main();
