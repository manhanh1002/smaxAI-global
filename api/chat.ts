import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define Tools
const tools = [
  {
    type: "function",
    function: {
      name: "create_booking",
      description: "Create a new booking appointment for the user",
      parameters: {
        type: "object",
        properties: {
          customer_name: { type: "string", description: "Name of the customer" },
          service_name: { type: "string", description: "Name of the service to book" },
          date: { type: "string", description: "Date of booking (YYYY-MM-DD)" },
          time: { type: "string", description: "Time of booking (HH:MM)" }
        },
        required: ["customer_name", "service_name", "date", "time"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_order",
      description: "Create a new product order for the user",
      parameters: {
        type: "object",
        properties: {
          customer_name: { type: "string", description: "Name of the customer" },
          product_name: { type: "string", description: "Name of the product" },
          quantity: { type: "integer", description: "Quantity to order" }
        },
        required: ["customer_name", "product_name", "quantity"]
      }
    }
  }
];

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { conversation_id, message_content, merchant_id } = await req.json();

    if (!conversation_id || !merchant_id) {
        throw new Error('Missing conversation_id or merchant_id');
    }

    console.log(`[Edge Chat] Processing for convo: ${conversation_id}`);

    // 1. Fetch Context
    const { data: merchant } = await supabaseClient.from('merchants').select('*').eq('id', merchant_id).single();
    const { data: products } = await supabaseClient.from('products').select('*').eq('merchant_id', merchant_id);
    const { data: faqs } = await supabaseClient.from('faqs').select('*').eq('merchant_id', merchant_id);
    const { data: aiConfig } = await supabaseClient.from('ai_configs').select('*').eq('merchant_id', merchant_id).single();
    
    const today = new Date().toISOString().split('T')[0];
    const { data: slots } = await supabaseClient.from('booking_slots')
        .select('*')
        .eq('merchant_id', merchant_id)
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(20);

    // 2. Fetch History
    const { data: historyData } = await supabaseClient.from('messages')
        .select('*')
        .eq('conversation_id', conversation_id)
        .order('created_at', { ascending: true })
        .limit(20);

    // 3. Build Prompt
    const productsList = (products || []).map((p) => `- ${p.name}: $${p.price}`).join('\n');
    const slotsList = (slots || []).map((s) => `- ${s.date} at ${s.time}`).join('\n');
    const faqsList = (faqs || []).map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');

    const systemPrompt = `
You are a helpful assistant for ${merchant?.name}.
Business Type: ${merchant?.business_type}

PRODUCTS:
${productsList}

AVAILABLE SLOTS:
${slotsList}

FAQs:
${faqsList}

Refuse to answer questions unrelated to this business.
Be concise.
If the user wants to book or buy, use the appropriate function.
`;

    // 4. Call OpenAI
    const apiKey = aiConfig?.openai_api_key 
      || process.env.OPENAI_API_KEY 
      || process.env.VITE_OPENAI_API_KEY
      || process.env['Token.api.ai_API_KEY']; 
    const baseUrl = aiConfig?.openai_base_url || 'https://api.token.ai.vn/v1';

    if (!apiKey) {
        throw new Error('No OpenAI API Key found. Please set OPENAI_API_KEY in Vercel Environment Variables.');
    }

    const messages = [
        { role: 'system', content: systemPrompt },
        ...(historyData || []).map((m) => ({
            role: (m.role === 'visitor') ? 'user' : 'assistant',
            content: m.content
        })),
        { role: 'user', content: message_content }
    ];

    const openAIReqBody = {
        model: aiConfig?.model || 'gpt-4o-mini',
        messages: messages,
        temperature: aiConfig?.temperature || 0.7,
        tools: tools,
        tool_choice: "auto"
    };

    const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(openAIReqBody)
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenAI API Error: ${res.status} ${errText}`);
    }

    const data = await res.json();
    const responseMessage = data.choices[0].message;
    let aiContent = responseMessage.content;
    let toolCalls = responseMessage.tool_calls;

    // 5. Handle Tool Calls
    if (toolCalls && toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
            const fnName = toolCall.function.name;
            const fnArgs = JSON.parse(toolCall.function.arguments);
            
            console.log(`[Edge Chat] Tool Call: ${fnName}`, fnArgs);

            if (fnName === 'create_booking') {
                const { error: bookingError } = await supabaseClient.from('bookings').insert({
                    merchant_id,
                    customer_name: fnArgs.customer_name,
                    service_name: fnArgs.service_name,
                    date: fnArgs.date,
                    time: fnArgs.time,
                    status: 'pending'
                });
                
                if (bookingError) {
                    console.error('Booking Error:', bookingError);
                    aiContent = `I tried to book that for you, but there was an error: ${bookingError.message}`;
                } else {
                    aiContent = `I've booked ${fnArgs.service_name} for you on ${fnArgs.date} at ${fnArgs.time}. Is there anything else?`;
                    
                    // Log to task logs
                    await supabaseClient.from('ai_task_logs').insert({
                        conversation_id,
                        action: 'booking_created',
                        details: fnArgs,
                        status: 'success'
                    });
                }
            } else if (fnName === 'create_order') {
                const { error: orderError } = await supabaseClient.from('orders').insert({
                    merchant_id,
                    customer_name: fnArgs.customer_name,
                    product_name: fnArgs.product_name,
                    quantity: fnArgs.quantity,
                    channel: 'website',
                    created_by_ai: true,
                    status: 'pending'
                });

                if (orderError) {
                    console.error('Order Error:', orderError);
                    aiContent = `I tried to place that order, but there was an error: ${orderError.message}`;
                } else {
                    aiContent = `I've placed an order for ${fnArgs.quantity}x ${fnArgs.product_name}. We'll process it shortly!`;
                    
                     // Log to task logs
                     await supabaseClient.from('ai_task_logs').insert({
                        conversation_id,
                        action: 'order_created',
                        details: fnArgs,
                        status: 'success'
                    });
                }
            }
        }
    }

    // 6. Save AI Response (Content)
    if (aiContent) {
        await supabaseClient.from('messages').insert({
            conversation_id,
            role: 'ai',
            content: aiContent,
            merchant_id
        });
    }

    return new Response(JSON.stringify({ success: true, reply: aiContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
