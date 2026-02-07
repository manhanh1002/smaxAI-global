import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { merchant_id } = await req.json();

    if (!merchant_id) {
        throw new Error('Missing merchant_id');
    }

    // 1. Fetch Merchant Data
    const { data: merchant } = await supabaseClient.from('merchants').select('*').eq('id', merchant_id).single();
    const { data: products } = await supabaseClient.from('products').select('name, description, price').eq('merchant_id', merchant_id);
    const { data: services } = await supabaseClient.from('services').select('name, description, price').eq('merchant_id', merchant_id);
    const { data: faqs } = await supabaseClient.from('faqs').select('question, answer').eq('merchant_id', merchant_id);
    const { data: aiConfig } = await supabaseClient.from('ai_configs').select('*').eq('merchant_id', merchant_id).single();

    if (!merchant) throw new Error('Merchant not found');

    // 2. Prepare Context for AI
    const context = {
        name: merchant.name,
        type: merchant.business_type,
        description: merchant.description,
        products: products?.map(p => `${p.name} ($${p.price})`).join(', ') || 'None',
        services: services?.map(s => `${s.name} ($${s.price})`).join(', ') || 'None',
        faqs: faqs?.map(f => `Q: ${f.question} A: ${f.answer}`).join('\n') || 'None'
    };

    const promptEngineeringRequest = `
    You are an expert AI Persona Designer. Your goal is to create a detailed, highly effective "System Prompt" for an AI assistant that works for a specific business.
    
    BUSINESS INFORMATION:
    - Name: ${context.name}
    - Type: ${context.type}
    - Description: ${context.description}
    - Key Services: ${context.services}
    - Key Products: ${context.products}
    
    REFERENCE STYLE (Use this structure):
    1. Personality & Tone: Define how the AI refers to itself (e.g., "Em/Mình" for Vietnam context or professional "We") and the customer ("Anh/Chị"). Tone should match the business (e.g., Spa = soothing, Tech = precise).
    2. Service Principles: Key rules like "Listen first", "Personalize", "Professionalism".
    3. Constraints: What NOT to do (e.g., no medical advice, stick to the menu).
    4. Sales Workflow: 
       - Discovery (Ask questions)
       - Presentation (Benefit -> Service -> Price)
       - Closing (Ask for booking)
    5. Formatting Rules: Mobile-friendly, bullet points, short paragraphs.
    6. Example Dialogue: A short sample Q&A.

    OUTPUT:
    Return ONLY the System Prompt text. Do not include introductory text like "Here is the prompt". Write the prompt in VIETNAMESE (unless the business description implies English).
    `;

    // 3. Call AI to generate prompt
    // Use the admin API key from system_settings
    const { data: adminConfig } = await supabaseClient
        .from('system_settings')
        .select('value')
        .eq('key', 'admin_openai_api_key')
        .single();
    
    const apiKey = adminConfig?.value || aiConfig?.openai_api_key;
    const baseUrl = 'https://token.ai.vn/v1'; // Default for admin key
    const model = 'gpt-4o-mini'; // Default model for generation

    if (!apiKey) {
        throw new Error('No Admin API Key configured in system_settings.');
    }

    const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: 'system', content: "You are an expert prompt engineer." },
                { role: 'user', content: promptEngineeringRequest }
            ],
            temperature: 0.7
        })
    });

    const aiData = await res.json();
    const generatedPrompt = aiData.choices?.[0]?.message?.content;

    if (!generatedPrompt) {
        throw new Error('Failed to generate prompt from AI');
    }

    // 4. Save to DB
    const { error: updateError } = await supabaseClient
        .from('ai_configs')
        .update({ system_prompt: generatedPrompt })
        .eq('merchant_id', merchant_id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, system_prompt: generatedPrompt }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
