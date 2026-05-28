const fetch = require('node-fetch');

async function testFetch() {
    const url = 'https://tvallyxjyhubcvzpnivg.supabase.co/rest/v1/metrados?select=*,metrado_trabajador(trabajador_id),partidas(modificacion)&order=fecha.desc&offset=19000&limit=1000';
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2YWxseXhqeWh1YmN2enBuaXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NjUwNTEsImV4cCI6MjA5NTA0MTA1MX0.miCw8uYI1LlBx4r4t_-De1D9X39tJDH6KhQ_oYPvHR8';
    
    try {
        const response = await fetch(url, {
            headers: {
                'apikey': anonKey,
                'Authorization': `Bearer ${anonKey}`
            }
        });
        
        const status = response.status;
        const text = await response.text();
        console.log(`STATUS: ${status}`);
        console.log(`BODY: ${text}`);
    } catch (err) {
        console.error('Fetch failed:', err);
    }
}

testFetch();
