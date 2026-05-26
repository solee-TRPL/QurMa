const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env.local to get supabase credentials
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value.length) {
        env[key.trim()] = value.join('=').trim().replace(/['"]/g, '');
    }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data, error } = await supabase.from('students').select('full_name, father_phone, mother_phone, parent_id');
    console.log(data.find(s => s.full_name.includes('Fadhil')));
}

main();
