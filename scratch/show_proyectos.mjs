import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function show() {
    const { data, error } = await supabase.from('proyectos').select('*');
    if (error) {
        console.error("Error fetching projects:", error);
    } else {
        console.log("PROYECTOS DATA:", JSON.stringify(data, null, 2));
    }
}
show();
