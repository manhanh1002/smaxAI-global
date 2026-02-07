
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySetup() {
  console.log('🔍 Starting AI Setup Verification...\n');

  try {
    // 1. Get a Merchant (Demo)
    const { data: merchants, error: merchantError } = await supabase
      .from('merchants')
      .select('id, name')
      .limit(1);

    if (merchantError) {
      console.error('❌ Failed to fetch merchants:', merchantError.message);
      return;
    }

    if (!merchants || merchants.length === 0) {
      console.error('❌ No merchants found in database.');
      return;
    }

    const merchant = merchants[0];
    console.log(`✅ Found Merchant: ${merchant.name} (${merchant.id})`);

    // 2. Check AI Config
    const { data: config, error: configError } = await supabase
      .from('ai_configs')
      .select('*')
      .eq('merchant_id', merchant.id)
      .single();

    if (configError) {
      console.log(`⚠️  Could not fetch AI config (might be missing or RLS issue): ${configError.message}`);
      // Try to create/upsert one to test RLS
      console.log('   Attempting to create default config to test permissions...');
      const { error: upsertError } = await supabase
        .from('ai_configs')
        .upsert({ 
          merchant_id: merchant.id,
          model: 'gpt-4',
          openai_base_url: 'https://api.token.ai.vn/v1',
          temperature: 0.7
        })
        .select()
        .single();
      
      if (upsertError) {
        console.error(`❌ RLS Permission Denied: Cannot save AI Config. Please run the 'fix_rls.sql' script.`);
        return;
      }
      console.log('✅ Permissions working: Created default AI config.');
    } else {
      console.log('✅ AI Config found.');
    }

    // Reload config to get the key
    const { data: activeConfig } = await supabase
      .from('ai_configs')
      .select('*')
      .eq('merchant_id', merchant.id)
      .single();

    if (!activeConfig?.openai_api_key) {
      console.log('\n⚠️  No API Key saved in database.');
      console.log('   Please go to Settings > AI Configuration and save your API Key.');
      return;
    }

    const apiKey = activeConfig.openai_api_key;
    const baseUrl = activeConfig.openai_base_url || 'https://api.token.ai.vn/v1';
    
    console.log(`\n🧪 Testing API Connection...`);
    console.log(`   URL: ${baseUrl}`);
    console.log(`   Model (Configured): ${activeConfig.model}`);
    console.log(`   Key: ${apiKey.substr(0, 3)}...${apiKey.substr(-4)}`);

    // 1. List Models (if supported)
    console.log('\n📋 Fetching available models...');
    try {
        const modelsRes = await fetch(`${baseUrl}/models`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        
        if (modelsRes.ok) {
            const modelsData = await modelsRes.json();
            const modelIds = modelsData.data?.map((m: any) => m.id) || [];
            console.log(`   Found ${modelIds.length} models.`);
            console.log(`   Examples: ${modelIds.slice(0, 5).join(', ')}`);
        } else {
            console.log(`   Could not list models (Status: ${modelsRes.status})`);
        }
    } catch (e) {
        console.log('   Error listing models:', e.message);
    }

    // 2. Test Chat with gpt-4o-mini (Commonly available)
    const testModel = 'gpt-4o-mini'; 
    console.log(`\n🤖 Testing chat with model: ${testModel}...`);

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: testModel,
        messages: [
          { role: 'user', content: 'Hello! Are you online?' }
        ],
        max_tokens: 50
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`\n❌ API Request Failed for ${testModel}: ${response.status}`);
      console.error(`   Response: ${errText}`);
      return;
    }

    const data = await response.json();
    console.log(`\n✅ API Connection Successful with ${testModel}!`);
    console.log('   AI Reply:', data.choices[0]?.message?.content);

    // Update config to use this working model
    console.log(`\n💾 Updating database to use ${testModel}...`);
    await supabase
        .from('ai_configs')
        .update({ model: testModel })
        .eq('merchant_id', merchant.id);
    console.log('   Updated.');

  } catch (err: any) {
    console.error('\n❌ Unexpected Error:', err.message);
  }
}

verifySetup();
