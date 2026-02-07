
import { createClient } from '@supabase/supabase-js';

const urlCom = 'https://ytcupqvwvqcesqcmucvv.supabase.com';
const urlCo = 'https://ytcupqvwvqcesqcmucvv.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0Y3VwcXZ3dnFjZXNxY211Y3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MjUwMTAsImV4cCI6MjA4NTQwMTAxMH0.F6WFTWJXV5wFMmydCyWUPGc3uKMCmf4iTGX2tEKhkoQ';

async function testConnection(url: string, label: string) {
    console.log(`Testing ${label}: ${url}`);
    try {
        const supabase = createClient(url, key);
        const { data, error } = await supabase.from('merchants').select('count', { count: 'exact', head: true });
        
        if (error) {
            console.error(`❌ ${label} Error:`, error.message);
        } else {
            console.log(`✅ ${label} Success! Connected.`);
        }
    } catch (e) {
        console.error(`❌ ${label} Exception:`, e);
    }
}

async function run() {
    await testConnection(urlCom, '.com URL');
    await testConnection(urlCo, '.co URL');
}

run();
