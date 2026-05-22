import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface SystemUsersState {
    systemUsers: User[];
    fetchSystemUsers: () => Promise<void>;
}

export const useSystemUsersStore = create<SystemUsersState>()((set) => ({
    systemUsers: [],
    
    fetchSystemUsers: async () => {
        const { data, error } = await supabase
            .from('usuarios')
            .select('id, dni_username, nombre_completo, especialidad, roles_apps')
            .eq('dni_username', 'SISTEMA')
            .maybeSingle();
            
        if (!error && data) {
            set({ systemUsers: [data] as User[] });
            if (typeof window !== 'undefined') {
                (window as any).__systemUsersCache = [data];
            }
        }
    }
}));

