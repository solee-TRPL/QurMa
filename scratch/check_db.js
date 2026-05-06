
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Manually read .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length === 2) {
        env[parts[0].trim()] = parts[1].trim();
    }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log("Checking columns for teacher_notes...");
    const { data, error } = await supabase
        .from('teacher_notes')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching notes:", error);
        return;
    }

    if (data && data.length > 0) {
        console.log("Columns found:", Object.keys(data[0]));
    } else {
        console.log("No data found in teacher_notes, trying to fetch schema info...");
        // Fallback: try to update a non-existent ID to see the error message
        const { error: updateError } = await supabase
            .from('teacher_notes')
            .update({ reply_content: 'test' })
            .eq('id', '00000000-0000-0000-0000-000000000000');
        
        if (updateError) {
            console.log("Update test error:", updateError.message);
        } else {
            console.log("Column reply_content exists!");
        }
    }
}

checkColumns();
