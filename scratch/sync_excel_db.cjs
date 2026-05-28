const { Client } = require('pg');
const xlsx = require('xlsx');

function extractNumbers(text) {
    if (!text) return '';
    const matches = text.match(/\d+[\.,]?\d*|\d+\/\d+/g);
    return matches ? matches.join('|') : '';
}

async function runSync() {
    const client = new Client({ 
        connectionString: 'postgresql://postgres.tvallyxjyhubcvzpnivg:Jo.9839514500respaldo@aws-1-us-east-2.pooler.supabase.com:6543/postgres' 
    });

    try {
        await client.connect();
        const HOSP_ID = 'a0d14189-f8c5-40ff-9d90-975f22f4b6fd';
        console.log('1. Conectado a METRADOS_RESPALDO (Filtro estricto: HOSPITAL)');

        // Leer DB Solo de Hospital
        const res = await client.query('SELECT id, codigo, descripcion, unidad, cantidad_presupuesto, precio_unitario, modificacion FROM public.partidas WHERE proyecto_id = $1', [HOSP_ID]);
        const dbPartidas = res.rows;
        
        // Mapa rápido para encontrar por código
        const dbMap = new Map(dbPartidas.map(p => [p.codigo.trim(), p]));
        console.log(`2. Catálogo DB HOSPITAL cargado: ${dbPartidas.length} registros`);

        // Leer Excel
        const workbook = xlsx.readFile('E:\\00_OFI_PRESUPUESTOS_progra\\3_Entregable_web_buscador_de_metrados\\A_A_A_A_A_presupuesto.xlsx');
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        const rows = excelData.filter(r => r.length > 0 && r[0] !== 'Item' && r[0]);
        console.log(`3. Excel cargado: ${rows.length} registros útiles`);

        let updates = [];
        let inserts = [];
        let numericalMismatch = [];

        // Función para buscar el ID padre más cercano en la jerarquía
        const findParentId = (codigo) => {
            const parts = codigo.split('.');
            while (parts.length > 1) {
                parts.pop(); // quitar el último nivel
                const parentCode = parts.join('.');
                if (dbMap.has(parentCode)) {
                    return dbMap.get(parentCode).id;
                }
            }
            return null; // Si no encuentra nada, va a la raíz
        };

        for (const row of rows) {
            const codigo = String(row[0]).trim();
            const descripcion = String(row[1]).trim();
            const unidad = row[2] ? String(row[2]).trim() : 'und';
            const cantidad = parseFloat(row[3]) || 0;
            const precio = parseFloat(row[4]) || 0;
            const modificaciones = row[6] ? String(row[6]).trim() : 'SM';

            const dbPartida = dbMap.get(codigo);

            if (!dbPartida) {
                // NUEVO REGISTRO EN HOSPITAL
                inserts.push({
                    codigo,
                    descripcion,
                    unidad,
                    cantidad,
                    precio,
                    modificaciones,
                    parent_id: findParentId(codigo)
                });
                continue;
            }

            // ESCUDO NUMERICO
            const numExcel = extractNumbers(descripcion);
            const numDb = extractNumbers(dbPartida.descripcion);

            if (numExcel !== numDb) {
                numericalMismatch.push({ codigo, descExcel: descripcion, numExcel, descDb: dbPartida.descripcion, numDb });
                continue; // BLOQUEADO
            }

            // FORZAR UPDATE siempre para que pise las modificaciones y todo
            updates.push({
                id: dbPartida.id,
                codigo,
                descripcion,
                unidad,
                cantidad,
                precio,
                modificaciones
            });
        }

        console.log(`4. Análisis completado:`);
        console.log(`   - Encontrados para actualizar (Forzado): ${updates.length}`);
        console.log(`   - Nuevas partidas a insertar en Hospital: ${inserts.length}`);
        console.log(`   - Bloqueados por Escudo Numérico: ${numericalMismatch.length}`);

        await client.query('BEGIN');

        if (updates.length > 0) {
            console.log('\n5. Iniciando inyección SQL UPDATE...');
            let count = 0;
            for (const u of updates) {
                await client.query(
                    `UPDATE public.partidas 
                     SET descripcion = $1, unidad = $2, cantidad_presupuesto = $3, precio_unitario = $4, modificacion = $5
                     WHERE id = $6`,
                    [u.descripcion, u.unidad, u.cantidad, u.precio, u.modificaciones, u.id]
                );
                count++;
                if (count % 1000 === 0) console.log(`   ... ${count} updates ejecutados`);
            }
        }

        if (inserts.length > 0) {
            console.log('\n6. Iniciando inyección SQL INSERT...');
            for (const ins of inserts) {
                await client.query(
                    `INSERT INTO public.partidas 
                     (codigo, descripcion, unidad, cantidad_presupuesto, precio_unitario, modificacion, proyecto_id, parent_id, is_title, se_valoriza)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, true)`,
                    [ins.codigo, ins.descripcion, ins.unidad, ins.cantidad, ins.precio, ins.modificaciones, HOSP_ID, ins.parent_id]
                );
            }
            console.log(`   ... ${inserts.length} inserts ejecutados`);
        }

        await client.query('COMMIT');
        console.log(`\n¡Sincronización Hospital Completada Exitosamente!`);

    } catch (err) {
        await client.query('ROLLBACK').catch(()=>null);
        console.error('Error durante la sincronización:', err);
    } finally {
        await client.end();
    }
}

runSync();
