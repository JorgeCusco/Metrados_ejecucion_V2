import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function inspect() {
  console.log('Inspecting Supabase REST API...');
  
  // Try to list tables by querying common tables
  const tables = [
    'catalogo_partidas',
    'metrados',
    'partidas_personalizadas',
    'personal',
    'metrados_personal',
    'hvac_catalogo_accesorios',
    'metrados_liquidaciones',
    'ecosistema_usuarios',
    'logs_maestro_presupuesto',
    'insumos_master',
    'insumos_comprado',
    'insumo_mapping',
    'tipos_movimiento',
    'proyecto',
    'especialidad',
    'vista_analisis_presupuesto',
    'vista_metrados_mensuales_valorizados'
  ];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`- ${table}: Error (${error.message})`);
    } else {
      console.log(`- ${table}: ${count} rows`);
    }
  }
}

inspect();
