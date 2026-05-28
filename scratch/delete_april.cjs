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
        console.log("Connected to Supabase. Starting deletion process for April 2026 inside a transaction...");

        // Start transaction
        await client.query('BEGIN');

        console.log("1. Deleting workers assignments (metrado_trabajador) for April 2026 metrados...");
        const resWorkers = await client.query(`
            DELETE FROM metrado_trabajador
            WHERE metrado_id IN (
                SELECT id FROM metrados
                WHERE EXTRACT(MONTH FROM fecha) = 4 AND EXTRACT(YEAR FROM fecha) = 2026
            );
        `);
        console.log(`Deleted ${resWorkers.rowCount} worker assignment links.`);

        console.log("2. Deleting metrados for April 2026...");
        const resMetrados = await client.query(`
            DELETE FROM metrados
            WHERE EXTRACT(MONTH FROM fecha) = 4 AND EXTRACT(YEAR FROM fecha) = 2026;
        `);
        console.log(`Deleted ${resMetrados.rowCount} metrados from April 2026.`);

        // Commit transaction
        await client.query('COMMIT');
        console.log("\nTransaction committed successfully! All April 2026 data has been removed from the backup database.");

    } catch (err) {
        console.error("Error during deletion, rolling back transaction...", err);
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
