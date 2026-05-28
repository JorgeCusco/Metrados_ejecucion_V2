import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';

const idbStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        return (await get(name)) || null;
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await set(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        await del(name);
    },
};
import { Metrado, Partida } from '../types';
import { supabase } from '../lib/supabase';

import { usePersonalStore } from './usePersonalStore';
import { getEspecialidadPorCodigo } from '../constants/especialidades';
import { useAuthStore } from './useAuthStore';

interface MetradosContext {
    frente: string;
    bloque: string;
    nivel: string;
    cuadrilla: string;
    obreros_ids?: string[];
    obrero_nombre?: string;
    proyecto: 'hospital' | 'contingencia';
    especialidad?: string;
    isModoPC?: boolean;
}

interface MetradosState {
    // A) Contexto actual
    context: MetradosContext;

    // B) Array temporal de metrados
    metrados: Metrado[];

    // C) Partidas personalizadas
    customPartidas: Partida[];

    // D) Catálogos vivos (Supabase)
    catalogoHospital: Partida[];
    catalogoContingencia: Partida[];
    hvacCatalog: { id: string; categoria: string; label: string; factor: number }[];

    // Acciones
    setContext: (context: Partial<MetradosContext>) => void;
    addMetrado: (metrado: Omit<Metrado, 'id' | 'created_at'>) => Promise<{success: boolean, error?: string}>;
    fetchMetrados: () => Promise<void>;
    updateMetrado: (id: string, payload: Partial<Metrado>) => Promise<void>;
    deleteMetrado: (id: string) => Promise<void>;
    updateGroup: (codigo_partida: string, old_elemento: string, new_elemento: string) => Promise<void>;
    addCustomPartida: (partida: Partida) => Promise<Partida | null>;
    fetchCustomPartidas: () => Promise<void>;
    fetchHvacCatalog: () => Promise<void>;
    fetchCatalogoMaestro: () => Promise<void>;
    updateCatalogoPartida: (id: string, payload: Partial<Partida>, proyecto: 'hospital' | 'contingencia') => Promise<boolean>;
    addCatalogoPartida: (partida: Omit<Partida, 'id'>, proyecto: 'hospital' | 'contingencia') => Promise<boolean>;
    clearAll: () => void;
}

export const useMetradosStore = create<MetradosState>()(
    persist(
        (set) => ({
            context: {
                frente: '',
                bloque: '',
                nivel: '',
                cuadrilla: '',
                obreros_ids: [],
                obrero_nombre: '',
                proyecto: 'hospital',
                isModoPC: false
            },
            metrados: [],
            customPartidas: [],
            catalogoHospital: [],
            catalogoContingencia: [],
            hvacCatalog: [],

            setContext: (newContext) =>
                set((state) => ({
                    context: { ...state.context, ...newContext }
                })),

            addMetrado: async (metrado) => {
                try {
                    // Si el metrado viene sin ID porque es del JSON genérico, buscar su UUID en la nube
                    // RESOLUCIÓN DE IDs (Priorizar los pasados por el UI, si no buscar por código)
                    let resolvedPartidaId = metrado.partida_id;
                    

                    // V7.2.4: Validación de UUID Ultra-Resiliente
                    const isUUID = (id: any) => {
                        if (typeof id !== 'string') return false;
                        // Acepta formato con guiones (8-4-4-4-12) o sin guiones (32 hex)
                        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || /^[0-9a-f]{32}$/i.test(id);
                    };
                    
                    if (resolvedPartidaId && !isUUID(resolvedPartidaId)) {
                        console.warn(`[V7.2.4] Purgando partida_id inválido: "${resolvedPartidaId}"`);
                        resolvedPartidaId = undefined;
                    }
                    

                    // Si el metrado viene sin ID real (ej. era de un mock), intentar buscarlo en la nube por su CÓDIGO
                    if (!resolvedPartidaId) {
                        const isCustom = metrado.modificacion === 'PC'; 
                        if (isCustom) {
                            const { data: catData } = await (supabase.from('partidas') as any).select('id').eq('codigo', metrado.codigo_partida).eq('modificacion', 'PC').maybeSingle();
                            if (catData) resolvedPartidaId = catData.id;
                        } else {
                            // Fetch de catálogo maestro usando el código y el proyecto
                            const projCode = (metrado.proyecto || 'hospital').toUpperCase().substring(0, 4);
                            const { data: proj } = await (supabase.from('proyectos') as any).select('id').eq('codigo', projCode).maybeSingle();
                            if (proj) {
                                const { data: catData } = await (supabase.from('partidas') as any).select('id')
                                    .eq('codigo', metrado.codigo_partida).eq('proyecto_id', proj.id).maybeSingle();
                                if (catData) resolvedPartidaId = catData.id;
                            }
                        }
                    }

                    // LOG DE DEPURACIÓN CRÍTICO (Ver en F12)
                    console.log(`[V7.2.4 Insert] codigo: ${metrado.codigo_partida} | p_id: ${resolvedPartidaId || 'null'} | c_id: null`);

                    // Payload único para insert y reintento (V8.1.2)
                    const payloadToInsert = {
                        fecha: metrado.fecha,
                        frente: metrado.frente,
                        bloque: metrado.bloque,
                        nivel: metrado.nivel,
                        cuadrilla: metrado.cuadrilla,
                        partida_id: resolvedPartidaId || null,
                        
                        codigo_partida: metrado.codigo_partida,
                        descripcion_partida: metrado.descripcion_partida,
                        unidad: metrado.unidad,
                        proyecto: metrado.proyecto,
                        elemento: metrado.elemento,
                        detalle: metrado.detalle,
                        diametro: metrado.diametro,
                        cantidad: typeof metrado.cantidad === 'number' ? metrado.cantidad : null,
                        longitud_area: typeof metrado.longitud_area === 'number' ? metrado.longitud_area : null,
                        ancho_empalme: typeof metrado.ancho_empalme === 'number' ? metrado.ancho_empalme : null,
                        altura_gancho: typeof metrado.altura_gancho === 'number' ? metrado.altura_gancho : null,
                        parcial: metrado.parcial,
                        nro_veces: typeof metrado.nro_veces === 'number' ? metrado.nro_veces : null,
                        total: metrado.total,
                        autor_usuario: metrado.autor_usuario,
                        especialidad: metrado.especialidad,
                        hvac_factor: metrado.hvac_factor,
                        hvac_item_type: metrado.hvac_item_type
                    };

                    // 1. Insertamos el Metrado (V8.1.3: Nombres únicos para evitar redéclarations)
                    const tableName = 'metrados';
                    
                    const { data: insertData, error: insertError } = await (supabase.from(tableName) as any).insert([payloadToInsert]).select().single();

                    // V8.1: Reintento Agresivo. Si falla por FK, intentar insertar sin IDs (solo data denormalizada)
                    if (insertError && insertError.code === '23503') {
                        console.warn('[V8.1] FK Error detectado. Reintentando insertar sin referencias de catálogo para salvar el dato...');
                        const fallbackPayload = { ...payloadToInsert };
                        delete (fallbackPayload as any).partida_id;
                        
                        const { data: retryData, error: retryError } = await (supabase.from(tableName) as any).insert([fallbackPayload]).select().single();
                        
                        if (retryError) {
                            return { success: false, error: 'Database Error [' + retryError.code + ']: ' + retryError.message };
                        } else {
                            // Actualización local exitosa tras reintento
                            const dbMetrado: Metrado = { 
                                ...metrado, 
                                id: (retryData as any).id,
                                created_at: (retryData as any).created_at || new Date().toISOString()
                            };
                            set((state) => ({ metrados: [dbMetrado, ...state.metrados] }));
                            return { success: true };
                        }
                    }

                    if (insertError) {
                        console.error('Error insertando metrado en Supabase:', insertError);
                        return { success: false, error: 'Database Error [' + insertError.code + ']: ' + insertError.message };
                    }

                    // 2. Vinculación Many-to-Many de Cuadrilla (Personal)
                    // V7.2.3: Filtrar solo IDs que sean UUIDs válidos para evitar errores de integridad con personal local (mock)
                    const validObrerosIds = (metrado.obreros_ids || []).filter(id => isUUID(id));

                    if (validObrerosIds.length > 0) {
                        const personalLinks = validObrerosIds.map((id: string) => ({
                            metrado_id: (insertData as any).id,
                            trabajador_id: id
                        }));
                        
                        const { error: errorLinks } = await (supabase.from('metrado_trabajador') as any).insert(personalLinks as any);
                        if (errorLinks) console.error('Error bindeando personal a metrado (FK Error):', errorLinks);
                    }

                    const dbMetrado: Metrado = { 
                        ...metrado, 
                        id: (insertData as any).id, 
                        // obrero_nombre ya viene estructurado correctamente en 'metrado' desde useMetradosForm.ts
                        created_at: (insertData as any).created_at || new Date().toISOString() 
                    };
                    set((state) => ({ metrados: [...state.metrados, dbMetrado] }));
                    return { success: true };
                } catch (err: any) {
                    console.error('Error inesperado insertando metrado:', err);
                    return { success: false, error: 'System Error: ' + (err.message || String(err)) };
                }
            },

            fetchMetrados: async () => {
                try {
                    const tableName = 'metrados';

                    // 1. Obtener conteo total en una consulta ultraligera
                    const { count, error: countError } = await supabase
                        .from(tableName)
                        .select('*', { count: 'exact', head: true });

                    if (countError) throw countError;
                    
                    const totalRows = count || 0;
                    console.log(`[V18 Parallel] Metrados totales en ${tableName}: ${totalRows}`);

                    // 2. Crear promesas para cada página de forma concurrente
                    const step = 1000;
                    const pages = Math.ceil(totalRows / step);
                    
                    // V18 Optimization: Join ligero recuperando sólo personal_id (reducción payload ~80%)
                    const selectQuery = '*, metrado_trabajador(trabajador_id), partidas(modificacion)';

                    // V18.1 Optimization: Concurrency limit (Batching) to prevent 500 Errors / Pool exhaustion
                    const batchSize = 5;
                    const results = [];
                    for (let i = 0; i < pages; i += batchSize) {
                        const batchPromises = [];
                        for (let j = 0; j < batchSize && (i + j) < pages; j++) {
                            const fromRange = (i + j) * step;
                            const toRange = fromRange + step - 1;
                            batchPromises.push(
                                supabase
                                    .from(tableName)
                                    .select(selectQuery)
                                    .order('fecha', { ascending: false })
                                    .order('created_at', { ascending: false })
                                    .range(fromRange, toRange)
                            );
                        }
                        const batchResults = await Promise.all(batchPromises);
                        results.push(...batchResults);
                    }
                    
                    // 4. Concatenar resultados
                    let allMetrados: any[] = [];
                    for (const res of results) {
                        if (res.error) throw res.error;
                        if (res.data) {
                            allMetrados = allMetrados.concat(res.data);
                        }
                    }
                    console.log(`[V18 Parallel] Metrados TOTAL cargados de Supabase: ${allMetrados.length} registros.`);

                    const fetchedMetrados: Metrado[] = allMetrados.map((dbRow: any) => {
                        let formattedCuadrilla = undefined;
                        let obrerosIds: string[] = [];

                        const allPersonal = usePersonalStore.getState().personal;
                        
                        // Extraer IDs bindeados en metrados_personal
                        let personalIds = (dbRow.metrado_trabajador || [])
                            .map((rel: any) => rel.trabajador_id)
                            .filter(Boolean);
                        
                        obrerosIds = personalIds;
                        const personalList = personalIds
                            .map((id: string) => allPersonal.find((p: any) => p.id === id))
                            .filter(Boolean);

                        formattedCuadrilla = personalList
                            .map((p: any) => p.categoria ? `${p.nombre_formateado} (${p.categoria})` : p.nombre_formateado)
                            .join(' / ');

                        return {
                            modificacion: dbRow.partidas?.modificacion || undefined,
                            id: dbRow.id,
                            fecha: dbRow.fecha,
                            frente: dbRow.frente,
                            bloque: dbRow.bloque,
                            nivel: dbRow.nivel,
                            cuadrilla: dbRow.cuadrilla || undefined,
                            obrero_nombre: formattedCuadrilla || undefined, 
                            obreros_ids: obrerosIds,
                            partida_id: dbRow.partida_id || undefined,
                            
                            codigo_partida: dbRow.codigo_partida || '',
                            descripcion_partida: dbRow.descripcion_partida || '',
                            elemento: dbRow.elemento,
                            detalle: dbRow.detalle || '',
                            diametro: dbRow.diametro || undefined,
                            cantidad: dbRow.cantidad !== null ? dbRow.cantidad : '',
                            longitud_area: dbRow.longitud_area !== null ? dbRow.longitud_area : '',
                            ancho_empalme: dbRow.ancho_empalme !== null ? dbRow.ancho_empalme : '',
                            altura_gancho: dbRow.altura_gancho !== null ? dbRow.altura_gancho : '',
                            parcial: dbRow.parcial || 0,
                            nro_veces: dbRow.nro_veces !== null ? dbRow.nro_veces : '',
                            total: dbRow.total || 0,
                            unidad: dbRow.unidad || 'und', 
                            proyecto: (dbRow.proyecto || 'hospital').trim().toLowerCase(),
                            autor_usuario: dbRow.autor_usuario || 'UserWeb',
                            created_at: dbRow.created_at || new Date().toISOString(),
                            especialidad: dbRow.especialidad || undefined,
                            hvac_factor: dbRow.hvac_factor,
                            hvac_item_type: dbRow.hvac_item_type
                        };
                    });
                    set({ metrados: fetchedMetrados });
                } catch (error) {
                    console.error('Error masivo obteniendo metrados:', error);
                }
            },

            updateMetrado: async (id, payload) => {
                // Optimistic update local
                set((state) => ({
                    metrados: state.metrados.map((m) =>
                        m.id === id ? { ...m, ...payload } : m
                    ),
                }));
                // Remote update
                const dbPayload = { ...payload };
                // Limpiar campos sintéticos
                delete (dbPayload as any).obrero_nombre; 
                delete (dbPayload as any).obrero_categoria;
                delete (dbPayload as any).descripcion_partida;

                // V7.2.3: Validación de IDs en Update para evitar Error 23503
                const isUUID = (id: any) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
                if ((dbPayload as any).partida_id && !isUUID((dbPayload as any).partida_id)) delete (dbPayload as any).partida_id;
                

                const tableName = 'metrados';
                const { error } = await (supabase.from(tableName) as any).update(dbPayload as any).eq('id', id);
                if (error) console.error('Error Supabase Update Metrado:', error);
            },

            deleteMetrado: async (id) => {
                set((state) => ({
                    metrados: state.metrados.filter((m) => m.id !== id),
                }));
                const tableName = 'metrados';
                const { error } = await (supabase.from(tableName) as any).delete().eq('id', id);
                if (error) console.error('Error Supabase Delete Metrado:', error);
            },

            updateGroup: async (codigo_partida, old_elemento, new_elemento) => {
                set((state) => ({
                    metrados: state.metrados.map((m) =>
                        m.codigo_partida === codigo_partida && m.elemento === old_elemento
                            ? { ...m, elemento: new_elemento }
                            : m
                    ),
                }));
                const tableName = 'metrados';
                const { error } = await (supabase.from(tableName) as any)
                    .update({ elemento: new_elemento } as any)
                    .eq('codigo_partida', codigo_partida)
                    .match({ elemento: old_elemento });
                if (error) console.error('Error Supabase Update Agrupador:', error);
            },

            addCustomPartida: async (partida) => {
                try {
                    // 1. Insertar en Supabase
                    const { data, error } = await (supabase
                        .from('partidas') as any)
                        .insert([{
                            codigo: partida.codigo,
                            descripcion: partida.descripcion,
                            unidad: partida.unidad,
                            modificacion: partida.modificacion || 'PC',
                            especialidad: partida.especialidad,
                            tipo_metrado: partida.tipo_metrado
                        } as any])
                        .select()
                        .single() as any;

                    if (error) {
                        console.error('Error insertando partida personalizada en Supabase:', error);
                        return null; // Indicamos falla al UI
                    }

                    // 2. Transforrmarlo al modelo `Partida` del frontend
                    // Usamos el id real de la BD
                    const dbPartida: Partida = {
                        id: data.id,
                        codigo: data.codigo,
                        descripcion: data.descripcion,
                        unidad: data.unidad,
                        modificacion: data.modificacion || 'PC',
                        especialidad: data.especialidad,
                        tipo_metrado: data.tipo_metrado,
                        is_template: true,
                        es_titulo: false,
                        jerarquia: [],
                        nivel_jerarquia: 1
                    };

                    // 3. Actuaizar el Store localmente para reflejo instantáneo
                    set((state) => ({
                        customPartidas: [...state.customPartidas, dbPartida]
                    }));

                    return dbPartida;
                } catch (err) {
                    console.error('Error innesperado al guardar partida personalizada', err);
                    return null;
                }
            },

            fetchCustomPartidas: async () => {
                try {
                    const { data, error } = await (supabase
                        .from('partidas') as any)
                        .select('*').eq('modificacion', 'PC').order('codigo') as any;

                    if (error) {
                        console.error('Error fetching custom partidas:', error);
                        return;
                    }

                    if (data) {
                        const parsedPartidas: Partida[] = (data as any[]).map((dbRow: any) => ({
                            id: dbRow.id,
                            codigo: dbRow.codigo,
                            descripcion: dbRow.descripcion,
                            unidad: dbRow.unidad,
                            modificacion: dbRow.modificacion || 'PC',
                            especialidad: dbRow.especialidad,
                            tipo_metrado: dbRow.tipo_metrado,
                            is_template: true,
                            es_titulo: false,
                            jerarquia: [],
                            nivel_jerarquia: 1,
                            se_valoriza: dbRow.se_valoriza ?? true
                        }));

                        set({ customPartidas: parsedPartidas });
                    }
                } catch (e) {
                    console.error('Error cargando inicial de partidas:', e);
                }
            },

            fetchHvacCatalog: async () => {
                try {
                    const { data, error } = await supabase
                        .from('factores_hvac')
                        .select('*')
                        .order('categoria', { ascending: true })
                        .order('label', { ascending: true });
                    
                    if (error) throw error;
                    set({ hvacCatalog: data || [] });
                } catch (e) {
                    console.error('Error cargando catalogo HVAC:', e);
                }
            },

            fetchCatalogoMaestro: async () => {
                try {
                    const { data: proyectos, error: errProj } = await supabase.from('proyectos').select('id, codigo') as any;
                    
                    if (errProj || !proyectos || proyectos.length === 0) {
                        console.warn('No hay proyectos en BD o falló la conexión.');
                        return;
                    }

                    const hospId = proyectos.find((p: any) => p.codigo === 'HOSP')?.id;
                    const contId = proyectos.find((p: any) => p.codigo === 'CONT')?.id;

                    // MOTOR DE CARGA MASIVA V18: Paralelismo para Catálogo (Bypass límite 1000)
                    const { count, error: countError } = await supabase
                        .from('partidas')
                        .select('*', { count: 'exact', head: true });

                    if (countError) throw countError;
                    
                    const totalRows = count || 0;
                    const step = 1000;
                    const pages = Math.ceil(totalRows / step);

                    // MOTOR DE CARGA MASIVA V18.1: Loteador Concurrente
                    const batchSize = 5;
                    const results = [];
                    for (let i = 0; i < pages; i += batchSize) {
                        const batchPromises = [];
                        for (let j = 0; j < batchSize && (i + j) < pages; j++) {
                            const fromRange = (i + j) * step;
                            const toRange = fromRange + step - 1;
                            batchPromises.push(
                                supabase
                                    .from('partidas')
                                    .select('*')
                                    .order('codigo', { ascending: true })
                                    .range(fromRange, toRange)
                            );
                        }
                        const batchResults = await Promise.all(batchPromises);
                        results.push(...batchResults);
                    }
                    let allCatalogo: any[] = [];
                    for (const res of results) {
                        if (res.error) throw res.error;
                        if (res.data) allCatalogo = allCatalogo.concat(res.data);
                    }

                    console.log(`[V16] Catálogo TOTAL cargado: ${allCatalogo.length} registros.`);
                    
                    const mapPartidas = (rows: any[]): Partida[] => rows.map((r: any) => ({
                        id: r.id,
                        codigo: r.codigo,
                        descripcion: r.descripcion,
                        unidad: r.unidad || 'und',
                        modificacion: r.modificacion || 'SM',
                        especialidad: r.especialidad_deducida || getEspecialidadPorCodigo(r.codigo),
                        tipo_metrado: r.tipo_metrado || 'ESTANDAR',
                        is_template: true,
                        es_titulo: r.is_title || false,
                        jerarquia: r.jerarquia || [],
                        nivel_jerarquia: r.nivel_jerarquia || 1,
                        precio_unitario: r.pu_actual || r.precio_unitario || 0,
                        cantidad_presupuesto: r.metrado_programado || r.cantidad_presupuesto || 0,
                        acumulado_anterior_qty: r.metrado_anterior_acumulado || r.acumulado_anterior_qty || 0,
                        // Mapeo explícito de los nuevos campos
                        metrado_anterior_acumulado: r.metrado_anterior_acumulado || 0,
                        valorizacion_anterior: r.valorizacion_anterior || 0,
                        pu_actual: r.pu_actual || 0,
                        metrado_programado: r.metrado_programado || 0,
                        valorizacion_programada: r.valorizacion_programada || 0,
                        metrado_anterior: r.metrado_anterior || 0,
                        presupuesto_anterior: r.presupuesto_anterior || 0,
                        se_valoriza: r.se_valoriza ?? true
                    }));

                    let hosp = mapPartidas(allCatalogo.filter((c: any) => c.proyecto_id === hospId));
                    let cont = mapPartidas(allCatalogo.filter((c: any) => c.proyecto_id === contId));

                    set({ 
                        catalogoHospital: hosp,
                        catalogoContingencia: cont
                    });
                } catch (e) {
                    console.error('Error cargando catálogo maestro (Masivo V16):', e);
                }
            },

            updateCatalogoPartida: async (id, payload, proyecto) => {
                const user = useAuthStore.getState().user;
                if (!user) return false;

                try {
                    const catalogKey = proyecto === 'hospital' ? 'catalogoHospital' : 'catalogoContingencia';

                    // 2. Update en Supabase
                    const { error } = await (supabase
                        .from('partidas') as any)
                        .update(payload as any)
                        .eq('id', id);

                    if (error) throw error;



                    // 4. Update local
                    set((state: any) => ({
                        [catalogKey]: state[catalogKey].map((p: any) => 
                            p.id === id ? { ...p, ...payload } : p
                        )
                    }));

                    return true;
                } catch (e) {
                    console.error('Error actualizando catálogo:', e);
                    return false;
                }
            },

            addCatalogoPartida: async (partida, proyecto) => {
                const user = useAuthStore.getState().user;
                if (!user) return false;

                try {
                    const catalogKey = proyecto === 'hospital' ? 'catalogoHospital' : 'catalogoContingencia';
                    
                    // Obtener proyecto_id
                    const { data: projData } = await (supabase.from('proyectos') as any).select('id').eq('codigo', proyecto === 'hospital' ? 'HOSP' : 'CONT').single() as any;
                    if (!projData) throw new Error('Proyecto no encontrado');

                    const payload = { ...partida, proyecto_id: projData.id };
                    delete (payload as any).is_template;

                    const { data, error } = await (supabase
                        .from('partidas') as any)
                        .insert([payload as any])
                        .select()
                        .single();

                    if (error) throw error;



                    // Update local
                    set((state: any) => ({
                        [catalogKey]: [...state[catalogKey], { ...partida, id: (data as any).id, is_template: true }]
                    }));

                    return true;
                } catch (e) {
                    console.error('Error añadiendo al catálogo:', e);
                    return false;
                }
            },

            clearAll: () => set({ metrados: [] }), // No borramos las custom partidas aquí, solo metrados
        }),
        {
            name: 'inkaia-metrados-storage',
            storage: createJSONStorage(() => idbStorage),
            partialize: (state) => ({ 
                context: state.context,
                metrados: state.metrados
            }),
        }
    )
);
