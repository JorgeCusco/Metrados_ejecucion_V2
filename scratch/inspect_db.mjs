import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function inspect() {
    console.log("Fetching metrados summary from database...");
    
    // Fetch all frentes, bloques, niveles from metrados
    const { data: metrados, error: err } = await supabase
        .from('metrados')
        .select('frente, bloque, nivel, autor_usuario')
        .limit(10000);
        
    if (err) {
        console.error("Error fetching metrados:", err);
        return;
    }

    console.log(`Fetched ${metrados.length} metrados from table 'metrados'.`);

    const frentes = {};
    const bloques = {};
    const niveles = {};
    const truncatedF = [];
    const truncatedB = [];
    const truncatedN = [];

    metrados.forEach((m, idx) => {
        frentes[m.frente] = (frentes[m.frente] || 0) + 1;
        bloques[m.bloque] = (bloques[m.bloque] || 0) + 1;
        niveles[m.nivel] = (niveles[m.nivel] || 0) + 1;

        if (m.frente === 'F' || m.frente === 'N' || m.frente === 'B') {
            truncatedF.push({ index: idx, val: m.frente, user: m.autor_usuario });
        }
        if (m.bloque === 'F' || m.bloque === 'N' || m.bloque === 'B') {
            truncatedB.push({ index: idx, val: m.bloque, user: m.autor_usuario });
        }
        if (m.nivel === 'F' || m.nivel === 'N' || m.nivel === 'B') {
            truncatedN.push({ index: idx, val: m.nivel, user: m.autor_usuario });
        }
    });

    console.log("\n--- Unique Frentes ---");
    console.log(JSON.stringify(frentes, null, 2));

    console.log("\n--- Unique Bloques ---");
    console.log(JSON.stringify(bloques, null, 2));

    console.log("\n--- Unique Niveles ---");
    console.log(JSON.stringify(niveles, null, 2));

    console.log(`\nFound truncated values in 'metrados':`);
    console.log(`Frente is 'F', 'B' or 'N': ${truncatedF.length} records`);
    console.log(`Bloque is 'F', 'B' or 'N': ${truncatedB.length} records`);
    console.log(`Nivel is 'F', 'B' or 'N': ${truncatedN.length} records`);

    // Let's do the same for metrados_liquidaciones
    const { data: liq, error: liqErr } = await supabase
        .from('metrados_liquidaciones')
        .select('frente, bloque, nivel, autor_usuario')
        .limit(10000);

    if (liqErr) {
        console.error("Error fetching metrados_liquidaciones:", liqErr);
        return;
    }

    console.log(`\nFetched ${liq.length} metrados from table 'metrados_liquidaciones'.`);
    const liqFrentes = {};
    const liqBloques = {};
    const liqNiveles = {};

    liq.forEach(m => {
        liqFrentes[m.frente] = (liqFrentes[m.frente] || 0) + 1;
        liqBloques[m.bloque] = (liqBloques[m.bloque] || 0) + 1;
        liqNiveles[m.nivel] = (liqNiveles[m.nivel] || 0) + 1;
    });

    console.log("\n--- Unique Frentes in Liquidaciones ---");
    console.log(JSON.stringify(liqFrentes, null, 2));

    console.log("\n--- Unique Bloques in Liquidaciones ---");
    console.log(JSON.stringify(liqBloques, null, 2));

    console.log("\n--- Unique Niveles in Liquidaciones ---");
    console.log(JSON.stringify(liqNiveles, null, 2));
}

inspect();
