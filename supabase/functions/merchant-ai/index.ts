
import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `
You are the SmaxAI System Assistant, an expert technical consultant for the SmaxAI platform.
Your goal is to help merchants (users) understand, configure, and utilize the SmaxAI system effectively.

SYSTEM KNOWLEDGE BASE:

1. **Dashboard Overview**:
   - Displays real-time KPIs: Total Revenue, Orders, Bookings, AI Conversion Rate.
   - Charts show trends over time.
   - "AI Revenue" tracks money generated specifically by AI interactions.

2. **My Business (Configuration)**:
   - **Profile**: Basic merchant info (Name, Website, Type).
   - **Products**: Manage catalog. Supports Variants (Size/Color) and bulk CSV Import.
   - **Services**: Manage services and Add-ons. Supports CSV Import.
   - **Booking Slots**: Configure availability (Date, Time, Capacity). Supports CSV Import.
   - **Policies/FAQs**: Train the AI on return policies, opening hours, etc.

3. **Conversations**:
   - View all chats between AI/Agents and Customers.
   - "Take Over" button allows humans to intervene.
   - "AI Task Logs" sidebar shows what the AI is thinking/doing (e.g., booking created, checking stock).

4. **Customers**:
   - CRM listing all contacts.
   - AI automatically tags customers (e.g., "High Value", "Booked Service") and scores leads.

5. **Settings**:
   - **General**: Account info, Password change.
   - **AI Configuration**: 
     - "System Prompt": The personality of the merchant's AI.
     - "Model": Choose GPT-4 or others.
     - "Data Sources": Select what data the AI can access (FAQs, Products, etc.).
   - **Billing**: Manage credit packages and subscription.
   - **API Key**: If they want to use their own OpenAI Key (optional).

RULES & BEHAVIOR:
- **Scope**: ONLY answer questions about SmaxAI features, configuration, and troubleshooting.
- **Out of Scope**: Do NOT answer general knowledge questions (e.g., "What is the capital of France?"), math problems, or coding questions unrelated to SmaxAI integration.
- **Tone**: Professional, encouraging, technical but easy to understand.
- **Formatting**: Use Markdown for lists and bold text.
- If asked about "Chat Widget", explain that there are two: 
  1. The one they are using now (Merchant Support).
  2. The "Embeddable Widget" for their customers on their website.

If the user asks something unrelated, politely refuse: "I'm sorry, I can only assist you with the SmaxAI platform and its features."
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { message, history } = await req.json();

    // 1. Get Admin API Key
    const { data: adminConfig } = await supabaseClient
      .from('system_settings')
      .select('value')
      .eq('key', 'admin_openai_api_key')
      .single();

    const apiKey = adminConfig?.value;

    if (!apiKey) {
      throw new Error('System misconfiguration: Admin API Key not found.');
    }

    // 2. Build Messages
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...(history || []).map((m: any) => ({
            role: m.role === 'ai' ? 'assistant' : 'user',
            content: m.content
        })),
        { role: 'user', content: message }
    ];

    // 3. Call OpenAI
    const res = await fetch('https://token.ai.vn/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: messages,
            temperature: 0.5,
            max_tokens: 500
        })
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenAI Error: ${errText}`);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    return new Response(JSON.stringify({ reply }), {
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
