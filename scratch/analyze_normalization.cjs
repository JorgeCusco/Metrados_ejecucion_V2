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
        console.log("Connected to Supabase database successfully!\n");

        console.log("--- 1. ANALIZANDO HUÉRFANOS (Metrados sin Partida ID existente) ---");
        const resHuerfanos = await client.query(`
            SELECT COUNT(*) as total
            FROM metrados m
            LEFT JOIN partidas p ON m.partida_id = p.id
            WHERE p.id IS NULL;
        `);
        console.log(`Total metrados huérfanos (partida_id no existe en catálogo): ${resHuerfanos.rows[0].total}\n`);

        console.log("--- 2. ANALIZANDO DESAPUNTAMIENTOS DE CÓDIGO (ITEM) ---");
        console.log("Metrados donde el código registrado en la transacción es DIFERENTE al código actual de la partida:");
        const resCodigos = await client.query(`
            SELECT COUNT(*) as total,
                   MIN(m.fecha) as min_fecha,
                   MAX(m.fecha) as max_fecha
            FROM metrados m
            JOIN partidas p ON m.partida_id = p.id
            WHERE m.codigo_partida <> p.codigo;
        `);
        console.log(`Total desajustes de código: ${resCodigos.rows[0].total}`);
        console.log(`Rango de fechas afectado: desde ${resCodigos.rows[0].min_fecha} hasta ${resCodigos.rows[0].max_fecha}\n`);

        console.log("Ejemplo de desajustes de código (Top 5):");
        const resCodigosEjemplo = await client.query(`
            SELECT m.id as metrado_id, m.fecha, m.codigo_partida as metrado_codigo, p.codigo as catalogo_codigo,
                   m.descripcion_partida as metrado_desc, p.descripcion as catalogo_desc
            FROM metrados m
            JOIN partidas p ON m.partida_id = p.id
            WHERE m.codigo_partida <> p.codigo
            LIMIT 5;
        `);
        console.table(resCodigosEjemplo.rows);
        console.log("");

        console.log("--- 3. ANALIZANDO DESAPUNTAMIENTOS DE DESCRIPCIÓN ---");
        console.log("Metrados donde la descripción en la transacción es DIFERENTE a la descripción actual en el catálogo:");
        const resDescripciones = await client.query(`
            SELECT COUNT(*) as total,
                   MIN(m.fecha) as min_fecha,
                   MAX(m.fecha) as max_fecha
            FROM metrados m
            JOIN partidas p ON m.partida_id = p.id
            WHERE m.descripcion_partida <> p.descripcion;
        `);
        console.log(`Total desajustes de descripción: ${resDescripciones.rows[0].total}`);
        console.log(`Rango de fechas afectado: desde ${resDescripciones.rows[0].min_fecha} hasta ${resDescripciones.rows[0].max_fecha}\n`);

        console.log("Ejemplo de desajustes de descripción (Top 5):");
        const resDescEjemplo = await client.query(`
            SELECT m.id as metrado_id, m.fecha, m.codigo_partida, m.descripcion_partida as metrado_desc, p.descripcion as catalogo_desc
            FROM metrados m
            JOIN partidas p ON m.partida_id = p.id
            WHERE m.descripcion_partida <> p.descripcion
            LIMIT 5;
        `);
        console.table(resDescEjemplo.rows);
        console.log("");

        console.log("--- 4. DETECTANDO LUNARES (Descripción coincide pero código/id difiere) ---");
        console.log("Casos donde el texto de descripción del metrado existe en el catálogo, pero apunta a un partida_id distinto:");
        const resLunares = await client.query(`
            SELECT COUNT(*) as total
            FROM metrados m
            JOIN partidas p ON m.descripcion_partida = p.descripcion
            WHERE m.partida_id <> p.id;
        `);
        console.log(`Total de 'lunares' (por coincidencia exacta de descripción pero diferente id): ${resLunares.rows[0].total}\n`);

        console.log("Ejemplo de 'lunares' detectados (Top 5):");
        const resLunaresEjemplo = await client.query(`
            SELECT m.id as metrado_id, m.fecha, 
                   m.codigo_partida as metrado_codigo, p.codigo as catalogo_codigo,
                   m.descripcion_partida as descripcion,
                   m.partida_id as metrado_partida_id, p.id as catalogo_partida_id
            FROM metrados m
            JOIN partidas p ON m.descripcion_partida = p.descripcion
            WHERE m.partida_id <> p.id
            LIMIT 5;
        `);
        console.table(resLunaresEjemplo.rows);
        console.log("");

        console.log("--- 5. METRADOS REGISTRADOS DESDE HACE 1 SEMANA Y MEDIA (~ 2026-05-14) ---");
        const resRecientes = await client.query(`
            SELECT COUNT(*) as total,
                   COUNT(CASE WHEN m.codigo_partida <> p.codigo OR m.descripcion_partida <> p.descripcion THEN 1 END) as con_desajuste
            FROM metrados m
            LEFT JOIN partidas p ON m.partida_id = p.id
            WHERE m.fecha >= '2026-05-14';
        `);
        console.log(`Total metrados registrados desde el 14 de Mayo: ${resRecientes.rows[0].total}`);
        console.log(`De los cuales tienen desajuste (código o descripción distinta al catálogo): ${resRecientes.rows[0].con_desajuste}`);

    } catch (err) {
        console.error("Database connection or execution error:", err);
    } finally {
        await client.end();
    }
}

main();
