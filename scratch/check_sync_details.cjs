const { Client } = require('pg');
const fs = require('fs');

const client = new Client({ connectionString: 'postgresql://postgres.tvallyxjyhubcvzpnivg:Jo.9839514500respaldo@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
    await client.connect();
    
    // Fetch current workers from DB
    const dbRes = await client.query('SELECT id, dni, nombre_formateado, especialidad, cuadrilla FROM trabajadores');
    const dbWorkers = dbRes.rows;
    const dbById = new Map(dbWorkers.map(w => [w.id, w]));
    const dbByDni = new Map(dbWorkers.map(w => [w.dni, w]));
    
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
    
    console.log(`DB Workers: ${dbWorkers.length}`);
    console.log(`JSON Workers: ${jsonWorkers.length}`);
    
    let idCollisions = 0;
    let dniCollisions = 0;
    let newById = 0;
    let newByDni = 0;
    
    jsonWorkers.forEach(jw => {
        const matchId = dbById.get(jw.id);
        const matchDni = dbByDni.get(jw.dni);
        
        if (matchId) {
            idCollisions++;
        } else {
            newById++;
        }
        
        if (matchDni) {
            dniCollisions++;
        } else {
            newByDni++;
        }
    });
    
    console.log(`\nMatching stats:`);
    console.log(` - JSON workers with ID already in DB: ${idCollisions}`);
    console.log(` - JSON workers with DNI already in DB: ${dniCollisions}`);
    console.log(` - JSON workers with NEW ID: ${newById}`);
    console.log(` - JSON workers with NEW DNI: ${newByDni}`);
    
    // Check if there are cases where ID matches but DNI differs, or DNI matches but ID differs
    let idMatchDniMismatch = 0;
    let dniMatchIdMismatch = 0;
    
    jsonWorkers.forEach(jw => {
        const matchId = dbById.get(jw.id);
        if (matchId && matchId.dni !== jw.dni) {
            idMatchDniMismatch++;
            console.log(`ID Match DNI Mismatch: DB has DNI ${matchId.dni} for ID ${jw.id}, JSON has DNI ${jw.dni}`);
        }
        
        const matchDni = dbByDni.get(jw.dni);
        if (matchDni && matchDni.id !== jw.id) {
            dniMatchIdMismatch++;
        }
    });
    
    console.log(`\nIntegrity anomalies:`);
    console.log(` - ID matches but DNI differs: ${idMatchDniMismatch}`);
    console.log(` - DNI matches but ID differs: ${dniMatchIdMismatch}`);
    
    await client.end();
}

run().catch(console.error);
