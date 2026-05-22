import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Personal {
    id: string;
    dni: string;
    nombre_original: string;
    nombre_formateado: string;
    sexo: string;
    especialidad: string;
    cuadrilla: string;
    categoria: string;
    telefono: string;
    condicion: string;
    oficio: string;
    fecha_ingreso: string;
}

interface PersonalState {
    personal: Personal[];
    fetchPersonal: () => Promise<void>;
    addWorker: (worker: Omit<Personal, 'id' | 'nombre_formateado'>) => Promise<void>;
    updateWorker: (id: string, field: keyof Personal, value: any) => Promise<void>;
    deleteWorker: (id: string) => Promise<void>;
}

const formatName = (nombre_original: string) => {
    let nombre_formateado = nombre_original;
    if (nombre_original.includes(',')) {
        const parts = nombre_original.split(',');
        nombre_formateado = `${parts[1].trim()} ${parts[0].trim()}`.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    } else {
        nombre_formateado = nombre_original.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }
    return nombre_formateado;
};

export const usePersonalStore = create<PersonalState>()((set) => ({
    personal: [],
    
    fetchPersonal: async () => {
        const { data, error } = await supabase.from('personal').select('*').order('nombre_formateado');
        if (!error && (data as any)) {
            const personal = data as any[];
            set({ personal });

            // Sync formatted names in metrados if already loaded
            try {
                const { useMetradosStore } = await import('./useMetradosStore');
                const metradosStore = useMetradosStore.getState();
                if (metradosStore.metrados.length > 0) {
                    let updated = false;
                    const newMetrados = metradosStore.metrados.map(m => {
                        if (m.obreros_ids && m.obreros_ids.length > 0 && !m.obrero_nombre) {
                            const workers = m.obreros_ids
                                .map(id => personal.find(p => p.id === id))
                                .filter(Boolean);
                            if (workers.length > 0) {
                                updated = true;
                                return {
                                    ...m,
                                    obrero_nombre: workers
                                        .map(p => p.categoria ? `${p.nombre_formateado} (${p.categoria})` : p.nombre_formateado)
                                        .join(' / ')
                                };
                            }
                        }
                        return m;
                    });
                    if (updated) {
                        useMetradosStore.setState({ metrados: newMetrados });
                    }
                }
            } catch (err) {
                console.error('Error in lazy sync in fetchPersonal:', err);
            }
        }
    },

    addWorker: async (worker) => {
        const nombre_formateado = formatName(worker.nombre_original);
        const { data, error } = await (supabase.from('personal') as any).insert([{ ...worker, nombre_formateado } as any]).select().single();
        if (!error && (data as any)) {
            set((state) => ({ personal: [...state.personal, data as any] }));
        }
    },

    updateWorker: async (id, field, value) => {
        let updatePayload: any = { [field]: value };
        if (field === 'nombre_original') {
            updatePayload.nombre_formateado = formatName(value);
        }
        
        const { error } = await (supabase.from('personal') as any).update(updatePayload as any).eq('id', id);
        if (!error) {
            set((state) => ({
                personal: state.personal.map(p => p.id === id ? { ...p, ...updatePayload } : p)
            }));
        }
    },

    deleteWorker: async (id) => {
        const { error } = await (supabase.from('personal') as any).delete().eq('id', id);
        if (!error) {
            set((state) => ({
                personal: state.personal.filter(p => p.id !== id)
            }));
        }
    }
}));
