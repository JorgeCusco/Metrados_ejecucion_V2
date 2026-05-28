const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.tvallyxjyhubcvzpnivg:Jo.9839514500respaldo@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
    await client.connect();
    console.log("Connected successfully!");
    
    // Check columns
    const colsRes = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'trabajadores';
    `);
    console.log("COLUMNS IN trabajadores:");
    console.log(colsRes.rows);
    
    // Check some sample rows
    const rowsRes = await client.query(`
        SELECT id, dni, nombre_formateado, especialidad, cuadrilla, categoria, oficio 
        FROM trabajadores 
        LIMIT 5;
    `);
    console.log("SAMPLE ROWS IN trabajadores:");
    console.log(rowsRes.rows);
    
    // Let's count records
    const countRes = await client.query(`
        SELECT COUNT(*), COUNT(cuadrilla), COUNT(especialidad) FROM trabajadores;
    `);
    console.log("COUNTS IN trabajadores:");
    console.log(countRes.rows);
    
    await client.end();
}

run().catch(console.error);
