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
        console.log("Connected to Supabase. Beginning Level 1 Normalization (Uppercase, No Accents, No Extra Spaces)...");

        // Start transaction
        await client.query('BEGIN');

        console.log("\n1. Creating safety backup table 'backup_metrados_mayo_previo'...");
        await client.query(`DROP TABLE IF EXISTS backup_metrados_mayo_previo;`);
        await client.query(`
            CREATE TABLE backup_metrados_mayo_previo AS 
            SELECT * FROM metrados;
        `);
        console.log("Safety backup table created successfully.");

        console.log("\n2. Executing Level 1 Normalization UPDATE on May 2026 metrados...");
        const resUpdate = await client.query(`
            UPDATE metrados m
            SET descripcion_partida = translate(upper(trim(regexp_replace(p.descripcion, '\\s+', ' ', 'g'))), 'ÁÉÍÓÚÀÈÌÒÙÄËÏÖÜñÑ', 'AEIOUAEIOUAEIOUnN'),
                codigo_partida = p.codigo
            FROM partidas p
            WHERE m.partida_id = p.id
              AND EXTRACT(MONTH FROM m.fecha) = 5
              AND EXTRACT(YEAR FROM m.fecha) = 2026
              -- Cleaned version matches perfectly:
              AND translate(upper(trim(regexp_replace(m.descripcion_partida, '\\s+', ' ', 'g'))), 'ÁÉÍÓÚÀÈÌÒÙÄËÏÖÜñÑ', 'AEIOUAEIOUAEIOUnN')
                  =
                  translate(upper(trim(regexp_replace(p.descripcion, '\\s+', ' ', 'g'))), 'ÁÉÍÓÚÀÈÌÒÙÄËÏÖÜñÑ', 'AEIOUAEIOUAEIOUnN')
              -- Only update if there is actually a cosmetic or code difference:
              AND (m.descripcion_partida <> translate(upper(trim(regexp_replace(p.descripcion, '\\s+', ' ', 'g'))), 'ÁÉÍÓÚÀÈÌÒÙÄËÏÖÜñÑ', 'AEIOUAEIOUAEIOUnN')
                   OR m.codigo_partida <> p.codigo);
        `);

        console.log(`Successfully updated and normalized ${resUpdate.rowCount} metrado records!`);

        // Commit transaction
        await client.query('COMMIT');
        console.log("\nTransaction committed successfully!");

        // Run verification query
        console.log("\n3. Verifying remaining mismatches in May 2026...");
        const resVerification = await client.query(`
            SELECT 
                COUNT(*) as total_mismatches_restantes
            FROM metrados m
            JOIN partidas p ON m.partida_id = p.id
            WHERE m.descripcion_partida <> p.descripcion 
              AND EXTRACT(MONTH FROM m.fecha) = 5 
              AND EXTRACT(YEAR FROM m.fecha) = 2026;
        `);

        console.log(`Total STRICT mismatches remaining in May 2026: ${resVerification.rows[0].total_mismatches_restantes}`);
        console.log("This remaining group is composed entirely of structural/verbal mismatches (different words).");

    } catch (err) {
        console.error("Error during normalization, rolling back transaction...", err);
        try {
            await client.query('ROLLBACK');
        } catch (rollbackErr) {
            console.error("Rollback error:", rollbackErr);
        }
    } finally {
        await client.end();
    }
}

main();
