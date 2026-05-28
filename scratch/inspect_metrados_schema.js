import pg from 'pg';
const { Client } = pg;

const prodConnectionString = "postgresql://postgres.cdinoxmyukpasihkkkmd:SxucXihjIVEMUCAD@aws-0-us-west-2.pooler.supabase.com:6543/postgres";
const backupConnectionString = "postgresql://postgres.tvallyxjyhubcvzpnivg:Jo.9839514500respaldo@aws-1-us-east-2.pooler.supabase.com:6543/postgres";

async function inspectSchema(name, connectionString, tableName, junctionTableName) {
    console.log(`=== DB: ${name} (${tableName}) ===`);
    const client = new Client({ connectionString });
    try {
        await client.connect();
        
        // 1. Get Columns of Metrados table
        const colsRes = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = '${tableName}'
            ORDER BY column_name;
        `);
        console.log(`Columns of ${tableName}:`, colsRes.rows.map(r => `${r.column_name} (${r.data_type})` + (r.is_nullable === 'NO' ? ' NOT NULL' : '')));

        // 2. Get Foreign Keys and Constraints of Junction Table
        if (junctionTableName) {
            console.log(`\nForeign keys of ${junctionTableName}:`);
            const fkRes = await client.query(`
                SELECT
                    tc.constraint_name, 
                    kcu.column_name, 
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name,
                    rc.delete_rule
                FROM 
                    information_schema.table_constraints AS tc 
                    JOIN information_schema.key_column_usage AS kcu
                      ON tc.constraint_name = kcu.constraint_name
                      AND tc.table_schema = kcu.table_schema
                    JOIN information_schema.constraint_column_usage AS ccu
                      ON ccu.constraint_name = tc.constraint_name
                      AND ccu.table_schema = tc.table_schema
                    JOIN information_schema.referential_constraints AS rc
                      ON rc.constraint_name = tc.constraint_name
                      AND rc.constraint_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = '${junctionTableName}';
            `);
            console.log(fkRes.rows);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

async function main() {
    await inspectSchema("Production (cdinoxmyukpasihkkkmd)", prodConnectionString, "metrados", "metrados_personal");
    await inspectSchema("Backup (tvallyxjyhubcvzpnivg)", backupConnectionString, "metrados", "metrado_trabajador");
}

main();
