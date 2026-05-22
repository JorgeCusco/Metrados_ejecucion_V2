import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function analyze() {
    const tables = [
        'metrados',
        'metrados_historico',
        'usuarios'
    ];

    let report = "";

    for (const t of tables) {
        try {
            const { data, count, error } = await supabase
                .from(t)
                .select('*', { count: 'exact', head: false })
                .limit(1);

            if (error) {
                continue; // Skip silently if not exists
            }

            report += `## Tabla: ${t}\n`;
            report += `*Total de filas estimadas: ${count}*\n\n`;

            if (data && data.length > 0) {
                const cols = Object.keys(data[0]);
                report += `**Columnas Detectadas (${cols.length}):**\n`;
                report += cols.map(c => `- ${c}`).join('\n') + '\n\n';
            }
        } catch (e) {}
    }

    fs.appendFileSync('scratch/supabase_report.md', report, 'utf-8');
}

analyze();
