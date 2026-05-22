import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configurar entorno
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function sync() {
    console.log("Iniciando sincronización de mockDB_1.ts...");

    // 1. Obtener ID del proyecto Hospital
    const { data: projData, error: projErr } = await supabase
        .from('proyectos')
        .select('id')
        .eq('codigo', 'HOSP')
        .single();

    if (projErr || !projData) {
        console.error("No se encontró el proyecto HOSP en Supabase.", projErr);
        return;
    }
    const hospId = projData.id;
    console.log(`ID Proyecto HOSP: ${hospId}`);

    // 2. Extraer todo el catálogo (paginación de 1000 en 1000)
    let allCatalogo = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('catalogo_partidas')
            .select('*')
            .eq('proyecto_id', hospId)
            .order('codigo', { ascending: true })
            .range(from, from + step - 1);

        if (error) {
            console.error("Error obteniendo catálogo:", error);
            return;
        }

        if (!data || data.length === 0) {
            hasMore = false;
        } else {
            allCatalogo = [...allCatalogo, ...data];
            console.log(`Cargados ${allCatalogo.length} registros...`);
            from += step;
            if (data.length < step) hasMore = false;
        }
    }

    console.log(`Total de partidas recuperadas: ${allCatalogo.length}`);

    // 3. Formatear datos al modelo Partida
    const formattedData = allCatalogo.map(r => ({
        id: r.id,
        codigo: r.codigo,
        descripcion: r.descripcion,
        unidad: r.unidad || 'und',
        modificacion: r.modificacion || 'SM',
        especialidad: r.especialidad_deducida || 'hospital',
        tipo_metrado: r.tipo_metrado || 'ESTANDAR',
        is_template: true,
        es_titulo: r.is_title || false,
        jerarquia: r.jerarquia || [],
        nivel_jerarquia: r.nivel_jerarquia || 1,
        precio_unitario: r.pu_actual || r.precio_unitario || 0,
        cantidad_presupuesto: r.metrado_programado || r.cantidad_presupuesto || 0,
        acumulado_anterior_qty: r.metrado_anterior_acumulado || r.acumulado_anterior_qty || 0,
        metrado_anterior_acumulado: r.metrado_anterior_acumulado || 0,
        valorizacion_anterior: r.valorizacion_anterior || 0,
        pu_actual: r.pu_actual || 0,
        metrado_programado: r.metrado_programado || 0,
        valorizacion_programada: r.valorizacion_programada || 0,
        metrado_anterior: r.metrado_anterior || 0,
        presupuesto_anterior: r.presupuesto_anterior || 0,
        se_valoriza: r.se_valoriza ?? true,
        parent_id: r.parent_id || null,
        apu: r.apu || null
    }));

    // 4. Escribir el archivo
    const fileHeader = `import type { Partida } from "../types";\n\nexport const mockPartidas: Partida[] = `;
    const fileContent = fileHeader + JSON.stringify(formattedData, null, 4) + ";\n";
    
    const outputPath = path.resolve('src/data/mockDB_1.ts');
    fs.writeFileSync(outputPath, fileContent, 'utf8');

    console.log(`\n¡Éxito! Archivo mockDB_1.ts actualizado correctamente en:`);
    console.log(outputPath);
}

sync();
