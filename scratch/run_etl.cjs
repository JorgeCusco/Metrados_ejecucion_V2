const { Client } = require('pg');

async function runETL() {
    const client = new Client({ 
        connectionString: 'postgresql://postgres.tvallyxjyhubcvzpnivg:Jo.9839514500respaldo@aws-1-us-east-2.pooler.supabase.com:6543/postgres' 
    });

    try {
        await client.connect();
        console.log('Conectado a la BD de RESPALDO (Destino). Iniciando ETL...');

        const etlScript = `
        -- 1. Setup FDW
        SET statement_timeout = 0;
        CREATE EXTENSION IF NOT EXISTS postgres_fdw;

        DROP SERVER IF EXISTS old_supabase CASCADE;
        CREATE SERVER old_supabase FOREIGN DATA WRAPPER postgres_fdw OPTIONS (host 'aws-0-us-west-2.pooler.supabase.com', dbname 'postgres', port '6543');

        CREATE USER MAPPING IF NOT EXISTS FOR current_user SERVER old_supabase OPTIONS (user 'postgres.cdinoxmyukpasihkkkmd', password 'SxucXihjIVEMUCAD');

        DROP SCHEMA IF EXISTS old_db CASCADE;
        CREATE SCHEMA old_db;
        IMPORT FOREIGN SCHEMA public FROM SERVER old_supabase INTO old_db;

        -- 2. Truncate target tables
        TRUNCATE TABLE public.metrado_trabajador CASCADE;
        TRUNCATE TABLE public.metrados CASCADE;
        TRUNCATE TABLE public.partidas CASCADE;
        TRUNCATE TABLE public.factores_hvac CASCADE;
        TRUNCATE TABLE public.usuarios CASCADE;
        TRUNCATE TABLE public.trabajadores CASCADE;
        TRUNCATE TABLE public.proyectos CASCADE;

        -- 3. Transform and Load

        -- Proyectos
        INSERT INTO public.proyectos SELECT * FROM old_db.proyectos;
        
        -- Trabajadores
        INSERT INTO public.trabajadores (id, dni, nombre_original, nombre_formateado, especialidad)
        SELECT id, dni, nombre_original, nombre_formateado, especialidad FROM old_db.personal;

        -- Usuarios
        INSERT INTO public.usuarios (id, dni_username, password, correo, nombre_completo, especialidad, roles_apps, is_active, created_at, last_login, cargo, es_administrador_presupuesto, es_gerencia, area)
        SELECT id, dni_username, password, correo, nombre_completo, especialidad, roles_apps, is_active, created_at, last_login, cargo, es_administrador_presupuesto, es_gerencia, area FROM old_db.ecosistema_usuarios;

        -- Factores HVAC
        INSERT INTO public.factores_hvac (id, categoria, label, factor)
        SELECT id, categoria, label, factor FROM old_db.hvac_catalogo_accesorios;

        -- Partidas (Standard)
        INSERT INTO public.partidas (id, codigo, descripcion, unidad, parent_id, proyecto_id, tipo_metrado, metrado_programado, valorizacion_programada, metrado_anterior_acumulado, valorizacion_anterior, pu_actual, precio_unitario, cantidad_presupuesto, acumulado_anterior_qty, is_title, jerarquia, nivel_jerarquia, se_valoriza, modificacion)
        SELECT id, codigo, descripcion, unidad, parent_id, proyecto_id, tipo_metrado, metrado_programado, valorizacion_programada, metrado_anterior_acumulado, valorizacion_anterior, pu_actual, precio_unitario, cantidad_presupuesto, acumulado_anterior_qty, is_title, jerarquia, nivel_jerarquia, se_valoriza, 'SM' FROM old_db.catalogo_partidas;

        -- Partidas (Custom) -> modificacion = 'PC'
        INSERT INTO public.partidas (id, codigo, descripcion, unidad, modificacion, tipo_metrado, is_title, jerarquia, nivel_jerarquia, se_valoriza)
        SELECT id, codigo, descripcion, unidad, 'PC', tipo_metrado, false, ARRAY[]::text[], 1, se_valoriza FROM old_db.partidas_personalizadas;

        -- OPTIMIZACION DE FDW: Descargar tablas pesadas a memoria temporal local
        CREATE TEMP TABLE tmp_metrados AS SELECT * FROM old_db.metrados;
        CREATE TEMP TABLE tmp_metrados_personal AS SELECT * FROM old_db.metrados_personal;

        -- Metrados -> Antihuérfanos aplicado en FK
        INSERT INTO public.metrados (
            id, fecha, frente, bloque, nivel, cuadrilla, partida_id, elemento, detalle, diametro, 
            cantidad, longitud_area, ancho_empalme, altura_gancho, parcial, nro_veces, total, 
            hvac_item_id, autor_usuario, created_at, proyecto, codigo_partida, descripcion_partida, 
            unidad, hvac_factor, hvac_item_type, especialidad, grado, user_id, plano_sist, 
            plano_num, sin_plano, obs_motivo, obs_detalle
        )
        SELECT 
            id, fecha, frente, bloque, nivel, cuadrilla, 
            CASE 
                WHEN EXISTS (SELECT 1 FROM public.partidas WHERE id = COALESCE(tmp_metrados.partida_id, tmp_metrados.custom_partida_id)) 
                THEN COALESCE(tmp_metrados.partida_id, tmp_metrados.custom_partida_id)
                ELSE NULL 
            END,
            elemento, detalle, diametro, 
            cantidad, longitud_area, ancho_empalme, altura_gancho, parcial, nro_veces, total, 
            hvac_item_id, autor_usuario, created_at, proyecto, codigo_partida, descripcion_partida, 
            unidad, hvac_factor, hvac_item_type, especialidad, grado, user_id, plano_sist, 
            plano_num, sin_plano, obs_motivo, obs_detalle
        FROM tmp_metrados;

        -- Metrado Trabajador -> Antihuérfanos
        INSERT INTO public.metrado_trabajador (metrado_id, trabajador_id)
        SELECT m.metrado_id, m.personal_id FROM tmp_metrados_personal m
        WHERE EXISTS (SELECT 1 FROM public.metrados WHERE id = m.metrado_id)
          AND EXISTS (SELECT 1 FROM public.trabajadores WHERE id = m.personal_id);

        -- 4. Clean up FDW
        DROP SCHEMA old_db CASCADE;
        DROP USER MAPPING FOR current_user SERVER old_supabase;
        DROP SERVER old_supabase CASCADE;

        -- 5. Notify cache reload
        NOTIFY pgrst, 'reload schema';
        `;

        await client.query(etlScript);
        console.log('Migración completada exitosamente.');

        // Verificar el resultado
        const { rows } = await client.query('SELECT COUNT(*) FROM public.metrados');
        console.log('Total de metrados migrados:', rows[0].count);

    } catch (err) {
        console.error('Error durante la migración ETL:', err);
    } finally {
        await client.end();
    }
}

runETL();
