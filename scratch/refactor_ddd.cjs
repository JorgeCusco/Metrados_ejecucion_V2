const fs = require('fs');
const path = require('path');

const storePath = path.join(__dirname, '../src/store/useMetradosStore.ts');
let content = fs.readFileSync(storePath, 'utf8');

// 1. Eliminar referencias a custom_partida_id en la lógica de addMetrado
content = content.replace(/let resolvedCustomId = metrado\.custom_partida_id;/g, '');
content = content.replace(/if \(resolvedCustomId && !isUUID\(resolvedCustomId\)\) \{\s*console\.warn\(`\[V7\.2\.4\] Purgando custom_id inválido: "\$\{resolvedCustomId\}"`\);\s*resolvedCustomId = undefined;\s*\}/g, '');
content = content.replace(/if \(!resolvedPartidaId && !resolvedCustomId\) \{/g, 'if (!resolvedPartidaId) {');
content = content.replace(/c_id: \$\{resolvedCustomId \|\| 'null'\}/g, 'c_id: null');
content = content.replace(/custom_partida_id: resolvedCustomId \|\| null,/g, '');
content = content.replace(/delete \(fallbackPayload as any\)\.custom_partida_id;/g, '');
content = content.replace(/custom_partida_id: dbRow\.custom_partida_id \|\| undefined,/g, '');
content = content.replace(/if \(\(dbPayload as any\)\.custom_partida_id && !isUUID\(\(dbPayload as any\)\.custom_partida_id\)\) delete \(dbPayload as any\)\.custom_partida_id;/g, '');

// 2. Renombrar las consultas a tablas
content = content.replace(/\.from\('partidas_personalizadas'\)( as any)?\.select\('id'\)\.eq\('codigo', metrado\.codigo_partida\)/g, ".from('partidas')$1.select('id').eq('codigo', metrado.codigo_partida).eq('modificacion', 'PC')");
content = content.replace(/\.from\('catalogo_partidas'\)/g, ".from('partidas')");
content = content.replace(/\.from\('partidas_personalizadas'\)/g, ".from('partidas')");

// 3. Renombrar metrados_personal a metrado_trabajador
content = content.replace(/\.from\('metrados_personal'\)/g, ".from('metrado_trabajador')");
content = content.replace(/personal_id: id/g, 'trabajador_id: id');
content = content.replace(/\*, metrados_personal\(personal_id\), catalogo_partidas\(modificacion\)/g, '*, metrado_trabajador(trabajador_id), partidas(modificacion)');
content = content.replace(/dbRow\.metrados_personal/g, 'dbRow.metrado_trabajador');
content = content.replace(/rel\.personal_id/g, 'rel.trabajador_id');

// 4. Otras tablas del DDD
content = content.replace(/\.from\('hvac_catalogo_accesorios'\)/g, ".from('factores_hvac')");
content = content.replace(/dbRow\.catalogo_partidas\?\.modificacion/g, 'dbRow.partidas?.modificacion');

// 5. Ajustar fetchCustomPartidas para que traiga solo las 'PC' de la nueva tabla 'partidas'
content = content.replace(/\.select\('\*'\)\s*\.order\('codigo'\) as any;/g, ".select('*').eq('modificacion', 'PC').order('codigo') as any;");

// 6. Eliminar el custom_partida_id de la interfaz Metrado si existe en tipos... bueno, no tocamos types.ts aquí, pero el store ya no lo enviará.

fs.writeFileSync(storePath, content);
console.log('useMetradosStore.ts actualizado correctamente.');

// AHORA actualizamos usePersonalStore.ts
const personalStorePath = path.join(__dirname, '../src/store/usePersonalStore.ts');
if (fs.existsSync(personalStorePath)) {
    let pContent = fs.readFileSync(personalStorePath, 'utf8');
    pContent = pContent.replace(/\.from\('personal'\)/g, ".from('trabajadores')");
    fs.writeFileSync(personalStorePath, pContent);
    console.log('usePersonalStore.ts actualizado correctamente.');
}

// AHORA actualizamos useAuthStore.ts y useSystemUsersStore.ts
const authStorePath = path.join(__dirname, '../src/store/useAuthStore.ts');
if (fs.existsSync(authStorePath)) {
    let aContent = fs.readFileSync(authStorePath, 'utf8');
    aContent = aContent.replace(/\.from\('ecosistema_usuarios'\)/g, ".from('usuarios')");
    fs.writeFileSync(authStorePath, aContent);
    console.log('useAuthStore.ts actualizado correctamente.');
}

const sysStorePath = path.join(__dirname, '../src/store/useSystemUsersStore.ts');
if (fs.existsSync(sysStorePath)) {
    let sContent = fs.readFileSync(sysStorePath, 'utf8');
    sContent = sContent.replace(/\.from\('ecosistema_usuarios'\)/g, ".from('usuarios')");
    fs.writeFileSync(sysStorePath, sContent);
    console.log('useSystemUsersStore.ts actualizado correctamente.');
}

// GestionPartidasPC.tsx
const gestionPCPath = path.join(__dirname, '../src/components/GestionPartidasPC.tsx');
if (fs.existsSync(gestionPCPath)) {
    let gContent = fs.readFileSync(gestionPCPath, 'utf8');
    gContent = gContent.replace(/\.from\('partidas_personalizadas'\)/g, ".from('partidas')");
    gContent = gContent.replace(/\.from\('catalogo_partidas'\)/g, ".from('partidas')");
    // Al listar las partidas PC, ahora hay que filtrar por 'PC' en la tabla 'partidas'
    gContent = gContent.replace(/supabase\.from\('partidas'\) as any\)\s*\.select\('\*'\)\s*\.order\('codigo'\);/g, "supabase.from('partidas') as any)\n                .select('*')\n                .eq('modificacion', 'PC')\n                .order('codigo');");
    fs.writeFileSync(gestionPCPath, gContent);
    console.log('GestionPartidasPC.tsx actualizado correctamente.');
}

