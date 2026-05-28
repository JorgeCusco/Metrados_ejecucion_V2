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
        console.log("Connected to Supabase. Running cosmetic mismatch analysis for May 2026...");

        // Query to check mismatches ignoring casing, accents, and trailing spaces
        const res = await client.query(`
            SELECT 
                COUNT(*) as total_mismatches_estrictos,
                COUNT(CASE WHEN 
                    translate(upper(trim(regexp_replace(m.descripcion_partida, '\\s+', ' ', 'g'))), 'ÁÉÍÓÚÀÈÌÒÙÄËÏÖÜñÑ', 'AEIOUAEIOUAEIOUnN')
                    <>
                    translate(upper(trim(regexp_replace(p.descripcion, '\\s+', ' ', 'g'))), 'ÁÉÍÓÚÀÈÌÒÙÄËÏÖÜñÑ', 'AEIOUAEIOUAEIOUnN')
                THEN 1 END) as total_mismatches_verbales_reales
            FROM metrados m
            JOIN partidas p ON m.partida_id = p.id
            WHERE m.descripcion_partida <> p.descripcion 
              AND EXTRACT(MONTH FROM m.fecha) = 5 
              AND EXTRACT(YEAR FROM m.fecha) = 2026;
        `);

        const estrictos = parseInt(res.rows[0].total_mismatches_estrictos);
        const reales = parseInt(res.rows[0].total_mismatches_verbales_reales);
        const cosmeticos = estrictos - reales;

        console.log("\n--- RESULTADO DEL ANÁLISIS PROPUESTO ---");
        console.log(`Desajustes Estrictos Actuales en Mayo: ${estrictos}`);
        console.log(`Desajustes PUREMENTE Cosméticos (Casing/Tildes/Espacios): ${cosmeticos} (${((cosmeticos/estrictos)*100).toFixed(1)}%)`);
        console.log(`Desajustes Verbales Reales (Palabras distintas): ${reales} (${((reales/estrictos)*100).toFixed(1)}%)`);

        // If there are real verbal mismatches, show some examples to understand "what is failing"
        if (reales > 0) {
            console.log("\n--- EJEMPLOS DE DESAJUSTES VERBALES REALES (Top 5) ---");
            const resExamples = await client.query(`
                SELECT 
                    m.codigo_partida,
                    m.descripcion_partida as metrado_original,
                    p.descripcion as catalogo_oficial
                FROM metrados m
                JOIN partidas p ON m.partida_id = p.id
                WHERE 
                    translate(upper(trim(regexp_replace(m.descripcion_partida, '\\s+', ' ', 'g'))), 'ÁÉÍÓÚÀÈÌÒÙÄËÏÖÜñÑ', 'AEIOUAEIOUAEIOUnN')
                    <>
                    translate(upper(trim(regexp_replace(p.descripcion, '\\s+', ' ', 'g'))), 'ÁÉÍÓÚÀÈÌÒÙÄËÏÖÜñÑ', 'AEIOUAEIOUAEIOUnN')
                  AND EXTRACT(MONTH FROM m.fecha) = 5 
                  AND EXTRACT(YEAR FROM m.fecha) = 2026
                LIMIT 5;
            `);
            console.table(resExamples.rows);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

main();
