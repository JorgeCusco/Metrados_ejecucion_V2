import fs from 'fs';

async function fetchSchema() {
    const url = "https://cdinoxmyukpasihkkkmd.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkaW5veG15dWtwYXNpaGtra21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjEwNTgsImV4cCI6MjA4OTU5NzA1OH0.giZrcjXwrcKzQSzA9qMDGqMSUOvsvj8TMWToe-1O_hs";
    
    try {
        console.log("Fetching schema...");
        const res = await fetch(url);
        const data = await res.json();
        
        let report = "# Análisis de Esquema de Supabase (REST API)\n\n";
        
        const schemas = (data.components && data.components.schemas) || data.definitions || {};
        
        for (const [tableName, tableDef] of Object.entries(schemas)) {
            report += `## Tabla: ${tableName}\n`;
            if (tableDef.description) {
                report += `*Descripción*: ${tableDef.description}\n\n`;
            }
            report += `| Columna | Tipo | Requerido | Descripción |\n`;
            report += `|---|---|---|---|\n`;
            
            const requiredFields = tableDef.required || [];
            
            for (const [colName, colDef] of Object.entries(tableDef.properties || {})) {
                const isRequired = requiredFields.includes(colName) ? "Sí" : "No";
                const typeStr = colDef.format || colDef.type || "string";
                const desc = colDef.description || "";
                report += `| ${colName} | \`${typeStr}\` | ${isRequired} | ${desc.replace(/\n/g, " ")} |\n`;
            }
            report += "\n";
        }
        
        fs.writeFileSync('scratch/schema_report.md', report, 'utf-8');
        console.log("Report generated at scratch/schema_report.md with " + Object.keys(schemas).length + " tables");
    } catch (e) {
        console.error("Error:", e);
    }
}

fetchSchema();
