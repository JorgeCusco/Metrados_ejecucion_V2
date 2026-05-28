const { Client } = require('pg');
const fs = require('fs');

const client = new Client({ connectionString: 'postgresql://postgres.tvallyxjyhubcvzpnivg:Jo.9839514500respaldo@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
    await client.connect();
    
    // Fetch current workers from DB
    const dbRes = await client.query('SELECT id, dni, nombre_formateado, especialidad, cuadrilla, categoria, oficio, condicion, sexo, telefono, fecha_ingreso FROM trabajadores');
    const dbWorkers = dbRes.rows;
    const dbById = new Map(dbWorkers.map(w => [w.id, w]));
    
    // Read JSON
    const jsonData = JSON.parse(fs.readFileSync('C:\\Users\\Legion\\Downloads\\cuadrillas_export.json', 'utf8'));
    
    const jsonWorkers = [];
    for (const specialty in jsonData) {
        for (const cuadrilla in jsonData[specialty]) {
            const list = jsonData[specialty][cuadrilla];
            list.forEach(w => {
                jsonWorkers.push({
                    ...w,
                    json_specialty: specialty === 'SIN_ESPECIALIDAD' ? null : specialty,
                    json_cuadrilla: cuadrilla === 'SIN_CUADRILLA' ? null : cuadrilla
                });
            });
        }
    }
    
    let diffCount = 0;
    let nullSpecialtyInDb = 0;
    let diffSpecialty = 0;
    let diffCuadrilla = 0;
    let diffOtherFields = 0;
    
    const updates = [];
    
    jsonWorkers.forEach(jw => {
        const dbw = dbById.get(jw.id);
        if (!dbw) return;
        
        let hasDiff = false;
        
        // Normalize values
        const dbSpec = dbw.especialidad || null;
        const jsonSpec = jw.json_specialty || null;
        
        const dbCuad = dbw.cuadrilla || null;
        const jsonCuad = jw.json_cuadrilla || null;
        
        if (dbSpec !== jsonSpec) {
            diffSpecialty++;
            hasDiff = true;
            if (dbSpec === null) nullSpecialtyInDb++;
        }
        
        if (dbCuad !== jsonCuad) {
            diffCuadrilla++;
            hasDiff = true;
        }
        
        // Check other fields
        const fieldsToCheck = ['categoria', 'oficio', 'condicion', 'sexo', 'telefono', 'fecha_ingreso'];
        let otherDiff = false;
        fieldsToCheck.forEach(f => {
            const dbVal = dbw[f] === 'nan' ? null : (dbw[f] || null);
            const jsonVal = jw[f] === 'nan' ? null : (jw[f] || null);
            if (dbVal !== jsonVal) {
                otherDiff = true;
            }
        });
        
        if (otherDiff) {
            diffOtherFields++;
            hasDiff = true;
        }
        
        if (hasDiff) {
            diffCount++;
            updates.push({
                id: jw.id,
                dni: jw.dni,
                nombre: jw.nombre_formateado,
                dbSpec, jsonSpec,
                dbCuad, jsonCuad,
                jw
            });
        }
    });
    
    console.log(`Total workers with differences: ${diffCount}`);
    console.log(` - Specialty differences: ${diffSpecialty} (of which DB has null: ${nullSpecialtyInDb})`);
    console.log(` - Cuadrilla differences: ${diffCuadrilla}`);
    console.log(` - Other fields differences: ${diffOtherFields}`);
    
    if (updates.length > 0) {
        console.log("\nSample differences:");
        updates.slice(0, 5).forEach(u => {
            console.log(`Worker: ${u.nombre} (ID: ${u.id})`);
            console.log(`  - DB Specialty: ${u.dbSpec} | JSON Specialty: ${u.jsonSpec}`);
            console.log(`  - DB Cuadrilla: ${u.dbCuad} | JSON Cuadrilla: ${u.jsonCuad}`);
        });
    }
    
    await client.end();
}

run().catch(console.error);
