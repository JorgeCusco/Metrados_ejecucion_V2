const { Client } = require('pg');

async function createIndexes() {
    const client = new Client({ 
        connectionString: 'postgresql://postgres.tvallyxjyhubcvzpnivg:Jo.9839514500respaldo@aws-1-us-east-2.pooler.supabase.com:6543/postgres' 
    });

    try {
        await client.connect();
        console.log('Conectado a la BD.');

        // Crear índice B-Tree para la columna fecha en orden descendente
        // Esto optimizará brutalmente el "order=fecha.desc&offset=X"
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_metrados_fecha_desc ON metrados(fecha DESC);
        `);
        console.log('Índice en fecha DESC creado exitosamente.');

        // Crear índice para optimizar los JOINs con metrado_trabajador
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_metrado_trabajador_metrado_id ON metrado_trabajador(metrado_id);
        `);
        console.log('Índice en metrado_id (FK) creado exitosamente.');

        // Crear índice en partida_id para el join
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_metrados_partida_id ON metrados(partida_id);
        `);
        console.log('Índice en partida_id (FK) creado exitosamente.');

        // Refrescar caché de nuevo por si acaso
        await client.query(`NOTIFY pgrst, 'reload schema';`);
        console.log('Caché refrescada.');

    } catch (err) {
        console.error('Error creando índices:', err);
    } finally {
        await client.end();
    }
}

createIndexes();
