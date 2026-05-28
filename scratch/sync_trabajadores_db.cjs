const { Client } = require('pg');
const fs = require('fs');

const client = new Client({ connectionString: 'postgresql://postgres.tvallyxjyhubcvzpnivg:Jo.9839514500respaldo@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
    console.log("Starting personnel synchronization from JSON...");
    
    // Read JSON
    const jsonPath = 'C:\\Users\\Legion\\Downloads\\cuadrillas_export.json';
    if (!fs.existsSync(jsonPath)) {
        console.error(`Error: File not found at ${jsonPath}`);
        process.exit(1);
    }
    
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    const jsonWorkers = [];
    for (const specialty in jsonData) {
        for (const cuadrilla in jsonData[specialty]) {
            const list = jsonData[specialty][cuadrilla];
            list.forEach(w => {
                jsonWorkers.push({
                    ...w,
                    especialidad: specialty === 'SIN_ESPECIALIDAD' ? null : specialty,
                    cuadrilla: cuadrilla === 'SIN_CUADRILLA' ? null : cuadrilla
                });
            });
        }
    }
    
    console.log(`Successfully parsed ${jsonWorkers.length} workers from JSON.`);
    
    await client.connect();
    console.log("Connected to Supabase PostgreSQL.");
    
    // Start transaction
    await client.query('BEGIN');
    
    let updatedCount = 0;
    
    try {
        for (const w of jsonWorkers) {
            // Normalize fields
            const id = w.id;
            const dni = w.dni;
            const nombre_original = w.nombre_original;
            const nombre_formateado = w.nombre_formateado;
            const especialidad = w.especialidad;
            const cuadrilla = w.cuadrilla;
            
            const categoria = (w.categoria === 'nan' || !w.categoria) ? null : w.categoria;
            const condicion = (w.condicion === 'nan' || w.condicion === '_' || !w.condicion) ? null : w.condicion;
            const oficio = (w.oficio === 'nan' || w.oficio === '---' || !w.oficio) ? null : w.oficio;
            const sexo = (w.sexo === 'nan' || !w.sexo) ? null : w.sexo;
            const telefono = (w.telefono === 'nan' || w.telefono === '' || !w.telefono) ? null : w.telefono;
            const fecha_ingreso = (w.fecha_ingreso === 'nan' || w.fecha_ingreso === '' || !w.fecha_ingreso) ? null : w.fecha_ingreso;
            
            // Execute update
            const queryText = `
                UPDATE trabajadores
                SET 
                    dni = $1,
                    nombre_original = $2,
                    nombre_formateado = $3,
                    especialidad = $4,
                    cuadrilla = $5,
                    categoria = $6,
                    condicion = $7,
                    oficio = $8,
                    sexo = $9,
                    telefono = $10,
                    fecha_ingreso = $11
                WHERE id = $12
            `;
            
            const res = await client.query(queryText, [
                dni, nombre_original, nombre_formateado, especialidad, cuadrilla,
                categoria, condicion, oficio, sexo, telefono, fecha_ingreso,
                id
            ]);
            
            if (res.rowCount > 0) {
                updatedCount++;
            }
        }
        
        await client.query('COMMIT');
        console.log(`Transaction committed. Successfully updated ${updatedCount} workers.`);
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Error during transaction, rolled back.", e);
        throw e;
    } finally {
        await client.end();
    }
}

run().catch(console.error);
