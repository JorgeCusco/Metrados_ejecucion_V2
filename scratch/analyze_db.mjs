import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function analyze() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected successfully!");

        let report = "# Análisis de Tablas de Supabase\n\n";

        // Obtener tablas publicas
        const resTables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);

        for (const row of resTables.rows) {
            const t = row.table_name;
            report += `## Tabla: ${t}\n`;

            // Contar filas
            const resCount = await client.query(`SELECT COUNT(*) FROM "${t}"`);
            const count = resCount.rows[0].count;
            report += `*Total de filas: ${count}*\n\n`;

            // Obtener columnas
            const resCols = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1 
                AND table_schema = 'public'
                ORDER BY ordinal_position;
            `, [t]);

            report += `| Columna | Tipo |\n`;
            report += `|---|---|\n`;
            for (const col of resCols.rows) {
                report += `| ${col.column_name} | \`${col.data_type}\` |\n`;
            }
            report += "\n";

            // Obtener 2 resultados de muestra
            if (parseInt(count) > 0) {
                try {
                    const resSample = await client.query(`SELECT * FROM "${t}" LIMIT 2`);
                    report += `**Muestra de datos:**\n\`\`\`json\n${JSON.stringify(resSample.rows, null, 2)}\n\`\`\`\n\n`;
                } catch (e) {
                    report += `*Error obteniendo muestra: ${e.message}*\n\n`;
                }
            }
        }

        fs.writeFileSync('scratch/db_report.md', report, 'utf-8');
        console.log("Report generated at scratch/db_report.md");
    } catch (e) {
        console.error("Connection error:", e.message);
    } finally {
        await client.end();
    }
}

analyze();
