import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function analyze() {
    const tables = [
        'proyectos',
        'catalogo_partidas',
        'personal',
        'usuarios_ap',
        'metrados_obrasprovisionales',
        'metrados_arquitectura',
        'liquidaciones' // adivinando
    ];

    let report = "# Análisis de Supabase a través de API REST\n\n";

    for (const t of tables) {
        try {
            console.log("Analyzing table:", t);
            // Hacer query de conteo y limite 1
            const { data, count, error } = await supabase
                .from(t)
                .select('*', { count: 'exact', head: false })
                .limit(2);

            if (error) {
                if (error.code === 'PGRST116') {
                    // La tabla no existe o sin permisos
                    report += `## Tabla: ${t}\n*Error o no existe/sin permisos*\n\n`;
                } else {
                    report += `## Tabla: ${t}\n*Error: ${error.message}*\n\n`;
                }
                continue;
            }

            report += `## Tabla: ${t}\n`;
            report += `*Total de filas estimadas: ${count}*\n\n`;

            if (data && data.length > 0) {
                // Inferir columnas de la primera fila
                const cols = Object.keys(data[0]);
                report += `**Columnas Detectadas (${cols.length}):**\n`;
                report += cols.map(c => `- ${c}`).join('\n') + '\n\n';
                
                report += `**Muestra de datos:**\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n\n`;
            } else {
                report += `*Tabla vacía.*\n\n`;
            }
            
        } catch (e) {
            report += `## Tabla: ${t}\n*Exception: ${e.message}*\n\n`;
        }
    }

    fs.writeFileSync('scratch/supabase_report.md', report, 'utf-8');
    console.log("Report generated at scratch/supabase_report.md");
}

analyze();
