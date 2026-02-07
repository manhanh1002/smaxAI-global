// Follows Supabase Edge Function pattern (Deno)
import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TOOLS = [
  {
    type: "function",
    function: {
      name: "create_booking",
      description: "Create a new booking for a service.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "The UUID of the customer. Use the ID from 'CUSTOMER CONTEXT' if available." },
          customer_name: { type: "string", description: "Name of the customer" },
          customer_phone: { type: "string", description: "Phone number of the customer (optional but recommended for auto-creation)" },
          customer_email: { type: "string", description: "Email of the customer (optional but recommended)" },
          date: { type: "string", description: "Date in YYYY-MM-DD format" },
          time: { type: "string", description: "Time in HH:MM format" },
          service_name: { type: "string", description: "Name of the service or product" },
          addons: { 
            type: "array", 
            items: { 
              type: "object",
              properties: {
                name: { type: "string" },
                price: { type: "number" }
              },
              required: ["name"]
            },
            description: "List of addons selected by the customer"
          }
        },
        required: ["customer_name", "date", "time", "service_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_availability",
      description: "Check available booking slots for a specific date.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "Date in YYYY-MM-DD format" }
        },
        required: ["date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_booking",
      description: "Update an existing booking (reschedule or change addons).",
      parameters: {
        type: "object",
        properties: {
          booking_id: { type: "string", description: "The ID of the booking to update" },
          service_name: { type: "string", description: "New service name (optional)" },
          date: { type: "string", description: "New date in YYYY-MM-DD format (optional)" },
          time: { type: "string", description: "New time in HH:MM format (optional)" },
          addons: { 
            type: "array", 
            items: { 
              type: "object",
              properties: {
                name: { type: "string" },
                price: { type: "number" }
              },
              required: ["name"]
            },
            description: "Updated list of addons (optional)"
          }
        },
        required: ["booking_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_bookings",
      description: "Get existing bookings for a customer to check status or cancel.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "The UUID of the customer" },
          customer_name: { type: "string", description: "Name of the customer" },
        },
        required: ["customer_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "cancel_booking",
      description: "Cancel an existing booking by ID.",
      parameters: {
        type: "object",
        properties: {
          booking_id: { type: "string", description: "The ID of the booking to cancel" }
        },
        required: ["booking_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_order",
      description: "Place a new order for products.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "The UUID of the customer" },
          customer_name: { type: "string", description: "Name of the customer" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product_name: { type: "string" },
                variant_name: { type: "string", description: "Name of the specific variant (e.g. Size/Color) if applicable" },
                quantity: { type: "number" }
              },
              required: ["product_name", "quantity"]
            }
          }
        },
        required: ["customer_name", "items"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_orders",
      description: "Get existing orders for a customer to check status.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "The UUID of the customer" },
          customer_name: { type: "string", description: "Name of the customer to filter by" }
        },
        required: ["customer_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "cancel_order",
      description: "Cancel an existing order by ID.",
      parameters: {
        type: "object",
        properties: {
          order_id: { type: "string", description: "The ID of the order to cancel" }
        },
        required: ["order_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_customer_insight",
      description: "Update customer profile with internal notes (private memory), tags, and lead score. ALWAYS call this when you learn something new about the customer or end a conversation.",
      parameters: {
        type: "object",
        properties: {
          internal_notes: { type: "string", description: "Private note summarizing the conversation, latest order, current needs, preferences, and key details. This serves as long-term memory." },
          tags: { type: "array", items: { type: "string" }, description: "List of tags based on customer quality/behavior (e.g. 'High Value', 'Potential', 'Window Shopper', 'Booked Service')" },
          lead_score: { type: "number", description: "Score from 0-100 indicating customer quality/intent" }
        },
        required: ["internal_notes", "tags", "lead_score"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_customer",
      description: "Create a new customer profile. Use this when you are talking to a new customer and have gathered their name and/or contact info.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Customer's full name" },
          phone: { type: "string", description: "Customer's phone number" },
          email: { type: "string", description: "Customer's email address" }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_customer",
      description: "Update customer's basic details (name, phone, email). Use this when a customer wants to change their name or contact info.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          phone: { type: "string" },
          email: { type: "string" }
        }
      }
    }
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      // Fallback to ANON key when service role is not configured; public tables are accessible
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { conversation_id, message_content, merchant_id } = await req.json();

    if (!conversation_id || !merchant_id) {
        throw new Error('Missing conversation_id or merchant_id');
    }

    console.log(`[Edge Chat] Processing for convo: ${conversation_id}`);

    // 1. Fetch Context (Merchant, Products, Services, Slots, FAQs, AI Config)
    const { data: merchant } = await supabaseClient.from('merchants').select('*').eq('id', merchant_id).single();
    const { data: products } = await supabaseClient.from('products').select('*').eq('merchant_id', merchant_id);
    const { data: services } = await supabaseClient.from('services').select('*').eq('merchant_id', merchant_id);
    
    // Fetch variants and addons
    const productIds = products?.map((p: any) => p.id) || [];
    let variants: any[] = [];
    if (productIds.length > 0) {
      const { data } = await supabaseClient.from('product_variants').select('*').in('product_id', productIds);
      variants = data || [];
    }

    const serviceIds = services?.map((s: any) => s.id) || [];
    let serviceAddons: any[] = [];
    if (serviceIds.length > 0) {
      const { data } = await supabaseClient.from('service_addons').select('*').in('service_id', serviceIds);
      serviceAddons = data || [];
    }

    const { data: faqs } = await supabaseClient.from('faqs').select('*').eq('merchant_id', merchant_id);
    const { data: policies } = await supabaseClient.from('merchant_policies').select('*').eq('merchant_id', merchant_id);
    const { data: aiConfig } = await supabaseClient.from('ai_configs').select('*').eq('merchant_id', merchant_id).single();
    
    // Slots (future only)
    const today = new Date().toISOString().split('T')[0];
    const { data: slots } = await supabaseClient.from('booking_slots')
        .select('*')
        .eq('merchant_id', merchant_id)
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(20);

    // 2. Fetch History & Customer Context
    const { data: historyData } = await supabaseClient.from('messages')
        .select('*')
        .eq('conversation_id', conversation_id)
        .order('created_at', { ascending: true })
        .limit(20);

    // Fetch Conversation to identify visitor
    const { data: conversation } = await supabaseClient.from('conversations')
        .select('*')
        .eq('id', conversation_id)
        .single();
    
    let customer: any = null;
    let visitorName = conversation?.visitor_name || 'Customer';

    // Try to find customer by email, phone, or name
    if (conversation) {
        let query = supabaseClient.from('customers').select('*').eq('merchant_id', merchant_id);
        const conditions = [];
        if (conversation.visitor_email) conditions.push(`email.eq.${conversation.visitor_email}`);
        if (conversation.visitor_phone) conditions.push(`phone.eq.${conversation.visitor_phone}`);
        // If we have no contact info, maybe search by name if it's not default 'Visitor'
        if (conversation.visitor_name && conversation.visitor_name !== 'Visitor' && conditions.length === 0) {
             conditions.push(`name.eq.${conversation.visitor_name}`);
        }

        if (conditions.length > 0) {
             query = query.or(conditions.join(','));
             const { data: customerData } = await query.maybeSingle();
             customer = customerData;
        }
    }
    
    if (customer) {
        visitorName = customer.name;
    }

    // 3. Build Prompt
    
    // Format Customer Memory
    let customerMemory = "";
    if (customer) {
        customerMemory = `
CUSTOMER CONTEXT (MEMORY):
- ID: ${customer.id}
- Name: ${customer.name}
- Phone: ${customer.phone || 'N/A'}
- Email: ${customer.email || 'N/A'}
- Lead Score: ${customer.lead_score || 0}
- Tags: ${customer.tags?.join(', ') || 'None'}
- Internal Notes (Private Memory): ${customer.internal_notes || 'None'}
`;
    }

    // Format products list with variants
    const productsList = (products || []).length > 0 ? (products || [])
    .map((p: any) => {
      const pVariants = variants.filter((v: any) => v.product_id === p.id);
      let info = `- ${p.name}: $${p.price} (${p.description || ''}, Stock: ${p.current_stock ?? p.total_quantity ?? 'N/A'})`;
      if (pVariants.length > 0) {
        info += '\n  Variants:';
        pVariants.forEach((v: any) => {
          info += `\n  * ${v.name}: $${v.price ?? p.price} (Stock: ${v.current_stock ?? v.total_quantity ?? 'N/A'})`;
        });
      }
      return info;
    })
    .join("\n") : "No products available";

    // Format services list with addons
    const servicesList = (services || []).length > 0 ? (services || [])
    .map((s: any) => {
      const sAddons = serviceAddons.filter((a: any) => a.service_id === s.id);
      let info = `- ${s.name}: $${s.price} (${s.description || ''})`;
      if (sAddons.length > 0) {
        info += '\n  Add-ons:';
        sAddons.forEach((a: any) => {
          info += `\n  * ${a.name}: +$${a.price} (${a.description || ''})`;
        });
      }
      return info;
    })
    .join("\n") : "No services available";

    const slotsList = (slots || []).map((s: any) => `- ${s.date} at ${s.time} (${s.duration_minutes || 60} min) - Slots left: ${s.capacity - s.booked_count}`).join('\n');
    const faqsList = (faqs || []).map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
    const policiesList = (policies || []).map((p: any) => `POLICY: ${p.title}\nCONTENT: ${p.content}`).join('\n\n');

    // User defined system prompt from settings
    const userSystemPrompt = aiConfig?.system_prompt || "";

    const systemPrompt = `
You are a professional sales and booking assistant for ${merchant?.name}.

TODAY'S DATE: ${new Date().toISOString().split('T')[0]}

MERCHANT INFORMATION:
- Business: ${merchant?.business_type}
- Website: ${merchant?.website}
${customerMemory}
- Current Customer: ${visitorName} (If "Customer", ask for their name)

AVAILABLE PRODUCTS:
${productsList}

AVAILABLE SERVICES:
${servicesList}

AVAILABLE BOOKING SLOTS (Only book these):
${slotsList || "No slots available"}

FREQUENTLY ASKED QUESTIONS:
${faqsList || "No FAQs available"}

BUSINESS POLICIES (Use these to answer policy questions):
${policiesList || "No specific policies found."}

MERCHANT INSTRUCTIONS (Strictly follow these behaviors):
${userSystemPrompt}

YOUR RESPONSIBILITIES:
1. **Customer Management**:
   - If you don't know the customer's name, ask for it politely.
   - If the customer provides their name or contact info, YOU MUST USE 'create_customer' (if new) or 'update_customer' (if correcting) IMMEDIATELY. Do not just reply with text.
   - ALWAYS use 'update_customer_insight' to save "Internal Notes" (Private Memory) about the customer's preferences, needs, and conversation summary. This is CRITICAL for future context.

2. **Booking & Orders**:
   - **Availability**: Use 'check_availability' if the customer asks about open slots or before creating a booking if you are unsure.
   - **Services**: BEFORE creating a booking, YOU MUST ASK specifically which service the customer wants to book. Do not assume. Describe available services if asked.
   - **Booking Creation**: Use 'create_booking' ONLY when you have Date, Time, AND Service Name. Always try to include 'customer_id' if you know it.
     - **IMPORTANT**: If you do not have a customer_id, pass the 'customer_phone' and 'customer_email' to the tool so it can auto-create the profile.
     - After creating, CONFIRM the booking details to the customer immediately.
     - **CRITICAL**: Create ONE booking per time slot. If the customer wants addons, pass them in the 'addons' array of the single 'create_booking' call. DO NOT create separate bookings for addons.
     - Example: If booking Service A with Addon B, call 'create_booking(service="Service A", addons=[{name: "Addon B"}])'. NOT two calls.
   - **Booking Updates**: Use 'update_booking' if the customer wants to change the time or addons of an existing booking.
   - **Products**: Check stock. Suggest variants if out of stock. Use 'create_order' for products.

3. **Consultation**:
   - Answer questions about products/services using the provided lists.
   - If the user asks "What services do you have?", list the items in the "AVAILABLE SERVICES" section above.
   - Be friendly and professional.

IMPORTANT RULES:
- **BIASED FOR ACTION**: If the user's request is clear (e.g., "Create profile", "Book at 10am", "Cancel order"), EXECUTE the tool IMMEDIATELY. Do not ask for confirmation unless critical details are missing.
- If a tool returns a 'failed' status with suggestions, present them to the customer.
- Never make up availability or services not listed above.
- If the "AVAILABLE SERVICES" list is empty or says "No services available", apologize and say you don't have the service list right now, but ask what they are looking for.
- **Handling Cancellations/Changes**: 
  - If the user wants to cancel a booking or order immediately after creating it, use the ID returned by the creation tool. 
  - If you don't have the ID in context, use 'get_bookings' or 'get_orders' to find the item first, then cancel it. 
  - ALWAYS confirm cancellation success to the user.
`;

    // 4. Call Token.ai.vn (OpenAI Compatible)
    const rawApiKey = aiConfig?.openai_api_key;
    const apiKey = rawApiKey ? rawApiKey.trim() : null;
    const baseUrl = (aiConfig?.openai_base_url || 'https://token.ai.vn/v1').replace(/\/$/, ''); 
    const model = aiConfig?.model || 'gpt-4o-mini';

    console.log(`[Edge Chat] AI Config - Model: ${model}, BaseURL: ${baseUrl}`);
    if (apiKey) {
        console.log(`[Edge Chat] API Key starts with: ${apiKey.substring(0, 10)}...`);
    } else {
        console.error('[Edge Chat] No API Key found!');
    }

    if (!apiKey) {
        throw new Error('No API Key found in Merchant AI Config. Please configure openai_api_key in ai_configs table.');
    }

    const messages: any[] = [
        { role: 'system', content: systemPrompt },
        ...(historyData || []).map((m: any) => ({
            role: (m.role === 'visitor') ? 'user' : 'assistant',
            content: m.content
        })),
        { role: 'user', content: message_content }
    ];

    // Tool Execution Loop (Max 5 turns)
    let turnCount = 0;
    const MAX_TURNS = 5;
    let finalReply = "";
    const executedActions: string[] = []; // Track actions for summary

    while (turnCount < MAX_TURNS) {
        turnCount++;
        console.log(`[Edge Chat] Turn ${turnCount}`);

        const res = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: 0.7,
                tools: TOOLS,
                tool_choice: "auto"
            })
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`OpenAI API Error ${res.status}: ${errText}`);
        }

        const aiData = await res.json();
        const choice = aiData.choices?.[0];
        const message = choice?.message;

        if (!message) break;

        // If content is present, it might be the final answer or a thought
        if (message.content) {
            finalReply = message.content;
        }

        // Check if there are tool calls
        if (message.tool_calls) {
            // Append assistant's message with tool calls
            messages.push(message);

            const toolCalls = message.tool_calls;
            for (const toolCall of toolCalls) {
                const fnName = toolCall.function.name;
                let args;
                try {
                    args = JSON.parse(toolCall.function.arguments);
                } catch (e) {
                    args = {};
                    console.error('Failed to parse args:', toolCall.function.arguments);
                }
                
                let toolResult = "";
                
                console.log(`[Edge Chat] Executing tool: ${fnName}`);

                // Log task pending
                await supabaseClient.from('ai_task_logs').insert({
                    conversation_id: conversation_id,
                    merchant_id: merchant_id,
                    task_type: fnName,
                    task_title: `Executing ${fnName}`,
                    task_details: args,
                    task_status: 'pending',
                    created_at: new Date().toISOString()
                });

                try {
                    // --- TOOL LOGIC START ---
                    if (fnName === 'check_availability') {
                        const { data: daySlots } = await supabaseClient.from('booking_slots')
                            .select('*')
                            .eq('merchant_id', merchant_id)
                            .eq('date', args.date);
                        
                        const available = (daySlots || []).filter((s: any) => (s.capacity - s.booked_count) > 0);
                        toolResult = JSON.stringify({
                            status: "success",
                            available_slots: available.map((s: any) => ({ time: s.time, slots_left: s.capacity - s.booked_count }))
                        });
                    } else if (fnName === 'update_booking') {
                         console.log('Processing update_booking:', args);
                         
                         // Fetch existing booking first to check old date/time for slot management
                         const { data: existingBooking, error: fetchError } = await supabaseClient.from('bookings')
                            .select('*')
                            .eq('id', args.booking_id)
                            .single();

                         if (fetchError || !existingBooking) {
                             toolResult = JSON.stringify({ status: "failed", message: "Booking not found." });
                         } else {
                             const updates: any = {};
                             if (args.service_name) updates.service_name = args.service_name;
                             
                             // Smart Merge for Addons
                             if (args.addons) {
                                 const existingAddons = existingBooking.addons || [];
                                 const newAddons = args.addons || [];
                                 const mergedAddons = [...existingAddons];
                                 
                                 // Append unique new addons
                                 newAddons.forEach((na: any) => {
                                     const naName = typeof na === 'string' ? na : na.name;
                                     // Check if already exists (case insensitive)
                                     const exists = existingAddons.some((ea: any) => {
                                         const eaName = typeof ea === 'string' ? ea : ea.name;
                                         return eaName.toLowerCase().trim() === naName.toLowerCase().trim();
                                     });
                                     if (!exists) {
                                         mergedAddons.push(na);
                                     }
                                 });
                                 updates.addons = mergedAddons;
                             }

                             // Recalculate Total Amount if Service or Addons changed
                             if (args.service_name || args.addons) {
                                 const finalServiceName = updates.service_name || existingBooking.service_name;
                                 const finalAddons = updates.addons || existingBooking.addons || [];
                                 
                                 let totalAmount = 0;
                                 // Fetch Service Price
                                 const { data: serviceData } = await supabaseClient.from('services')
                                    .select('id, price')
                                    .eq('merchant_id', merchant_id)
                                    .eq('name', finalServiceName)
                                    .maybeSingle(); // Use maybeSingle to avoid error
                                 
                                 if (serviceData) {
                                     totalAmount += (serviceData.price || 0);

                                     // Fetch Addon Prices
                                     if (finalAddons.length > 0) {
                                         const { data: dbAddons } = await supabaseClient.from('service_addons')
                                            .select('name, price')
                                            .eq('service_id', serviceData.id);
                                         
                                         const availableAddons = dbAddons || [];
                                         
                                         finalAddons.forEach((addon: any) => {
                                             const addonName = typeof addon === 'string' ? addon : addon.name;
                                             if (addonName) {
                                                 const match = availableAddons.find((a: any) => a.name.toLowerCase().trim() === addonName.toLowerCase().trim());
                                                 if (match) totalAmount += (Number(match.price) || 0);
                                             }
                                         });
                                     }
                                 }
                                 updates.total_amount = totalAmount;
                             }
                             
                             let slotChanged = false;
                             let oldSlotId = null;
                             let newSlotId = null;

                             if (args.date && args.time && (args.date !== existingBooking.date || args.time !== existingBooking.time)) {
                                 // Check availability for new slot
                                 // Try exact match first (HH:MM:SS)
                                 let { data: exactSlot } = await supabaseClient.from('booking_slots')
                                    .select('*')
                                    .eq('merchant_id', merchant_id)
                                    .eq('date', args.date)
                                    .eq('time', args.time) 
                                    .maybeSingle();

                                 if (!exactSlot) {
                                     // Try appending :00
                                      const { data: slotWithSeconds } = await supabaseClient.from('booking_slots')
                                         .select('*')
                                         .eq('merchant_id', merchant_id)
                                         .eq('date', args.date)
                                         .eq('time', args.time + ":00")
                                         .maybeSingle();
                                      exactSlot = slotWithSeconds;
                                 }
                                     
                                 // If exact slot not found via direct query, try finding in pre-fetched list or loose match
                                 let slot = exactSlot;
                                 if (!slot) {
                                      slot = (slots || []).find((s: any) => s.date === args.date && s.time.substring(0, 5) === args.time.substring(0, 5));
                                 }
                                 
                                 if (!slot || slot.booked_count >= slot.capacity) {
                                     toolResult = JSON.stringify({ status: "failed", message: "New slot is not available." });
                                 } else {
                                     updates.date = args.date;
                                     updates.time = args.time;
                                     newSlotId = slot.id;
                                     slotChanged = true;

                                     // Find old slot to decrement
                                     const { data: oldSlot } = await supabaseClient.from('booking_slots')
                                        .select('id')
                                        .eq('merchant_id', merchant_id)
                                        .eq('date', existingBooking.date)
                                        .eq('time', existingBooking.time) // Assuming close match
                                        .maybeSingle();
                                     oldSlotId = oldSlot?.id;
                                 }
                             }
        
                             if (!toolResult) { // No error yet
                                 const { data, error } = await supabaseClient.from('bookings')
                                     .update(updates)
                                     .eq('id', args.booking_id)
                                     .select().single();
                                 
                                 if (error) throw error;
                                 
                                 // Handle Slot Counts if changed
                                 if (slotChanged) {
                                     if (oldSlotId) await supabaseClient.rpc('decrement_slot_booked_count', { p_slot_id: oldSlotId });
                                     if (newSlotId) await supabaseClient.rpc('increment_slot_booked_count', { p_slot_id: newSlotId });
                                 }

                                 toolResult = JSON.stringify({ success: true, booking: data });
                                 executedActions.push(`Updated booking ${args.booking_id}: ${Object.keys(updates).join(', ')}`);
                             }
                         }
                    } else if (fnName === 'create_booking') {
                        let effectiveCustomerId = args.customer_id || customer?.id;
                        
                        // Auto-create/find customer if missing but info provided
                        if (!effectiveCustomerId && (args.customer_phone || args.customer_email || args.customer_name)) {
                            let query = supabaseClient.from('customers').select('*').eq('merchant_id', merchant_id);
                            const conditions = [];
                            if (args.customer_email) conditions.push(`email.eq.${args.customer_email}`);
                            if (args.customer_phone) conditions.push(`phone.eq.${args.customer_phone}`);
                            // Only search by name if it looks unique enough? Maybe risky. 
                            // Let's stick to phone/email for strong matching, name as fallback for creation.
                            
                            if (conditions.length > 0) {
                                query = query.or(conditions.join(','));
                                const { data: found } = await query.maybeSingle();
                                if (found) {
                                    effectiveCustomerId = found.id;
                                    customer = found; // Update context
                                }
                            }
                            
                            // If still not found, create new
                            if (!effectiveCustomerId && args.customer_name) {
                                const { data: created, error: createError } = await supabaseClient.from('customers').insert({
                                    merchant_id: merchant_id,
                                    name: args.customer_name,
                                    email: args.customer_email || null,
                                    phone: args.customer_phone || null,
                                    channel: 'website',
                                    created_by: 'ai_agent_booking'
                                }).select().single();
                                
                                if (!createError && created) {
                                    effectiveCustomerId = created.id;
                                    customer = created;
                                    executedActions.push(`Created new customer profile: ${args.customer_name}`);
                                }
                            }
                        }

                        // Sync conversation context if customer is identified
                        if (effectiveCustomerId && customer && conversation) {
                             const updates: any = {};
                             if (customer.name && (!conversation.visitor_name || conversation.visitor_name.startsWith('Visitor'))) updates.visitor_name = customer.name;
                             if (customer.email && !conversation.visitor_email) updates.visitor_email = customer.email;
                             if (customer.phone && !conversation.visitor_phone) updates.visitor_phone = customer.phone;
                             
                             if (Object.keys(updates).length > 0) {
                                 await supabaseClient.from('conversations').update(updates).eq('id', conversation_id);
                             }
                        }

                        // Smart Upsert: Check if booking exists for this customer/time to prevent duplicates
                        let existingBooking = null;
                        
                        // 1. Strict Check by ID
                        if (effectiveCustomerId) {
                             const { data: found } = await supabaseClient.from('bookings')
                                .select('*')
                                .eq('merchant_id', merchant_id)
                                .eq('customer_id', effectiveCustomerId)
                                .eq('date', args.date)
                                .eq('time', args.time)
                                .neq('status', 'cancelled')
                                .maybeSingle();
                             existingBooking = found;
                        }

                        // 2. Loose Check for "Name then Phone" scenario
                        // If we didn't find by ID (or don't have ID yet?), check by Name + Time created recently (e.g. last 15 mins)
                        // Also check if there is a recent booking with NO customer_id (anonymous) at the same time
                        if (!existingBooking) {
                            const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
                            
                            // Build query to find ANY potential duplicate
                            let looseQuery = supabaseClient.from('bookings')
                                .select('*')
                                .eq('merchant_id', merchant_id)
                                .eq('date', args.date)
                                .eq('time', args.time)
                                .neq('status', 'cancelled')
                                .gte('created_at', fifteenMinsAgo);

                            // Condition: Name matches OR (Customer ID is null AND created by AI)
                            // Supabase doesn't support complex OR groups easily in one go with JS client without raw SQL or 'or' filter
                            // We will fetch candidates and filter in memory (should be small result set, usually 0 or 1)
                            const { data: candidates } = await looseQuery;
                            
                            if (candidates && candidates.length > 0) {
                                // Find best match
                                const match = candidates.find((b: any) => {
                                    const nameMatch = args.customer_name && b.customer_name && b.customer_name.toLowerCase().trim() === args.customer_name.toLowerCase().trim();
                                    const anonymousMatch = !b.customer_id; // If previous booking has no ID, it's likely the initial "name only" booking
                                    return nameMatch || anonymousMatch;
                                });

                                if (match) {
                                    console.log(`[Edge Chat] Found loose match for booking ${match.id} (Name: ${args.customer_name}, ID: ${match.customer_id})`);
                                    existingBooking = match;
                                    // If we now have a better ID, link it?
                                    if (effectiveCustomerId && existingBooking.customer_id !== effectiveCustomerId) {
                                        await supabaseClient.from('bookings').update({ customer_id: effectiveCustomerId }).eq('id', existingBooking.id);
                                    }
                                }
                            }
                        }

                        if (existingBooking) {
                             console.log(`[Edge Chat] Found existing booking ${existingBooking.id}, merging addons.`);
                             
                             const existingAddons = existingBooking.addons || [];
                             const newAddons = args.addons || [];
                             const mergedAddons = [...existingAddons];
                             
                             // Append unique new addons
                             newAddons.forEach((na: any) => {
                                 const naName = typeof na === 'string' ? na : na.name;
                                 if (!existingAddons.some((ea: any) => (typeof ea === 'string' ? ea : ea.name) === naName)) {
                                     mergedAddons.push(na);
                                 }
                             });

                             // Recalculate Total
                             let totalAmount = 0;
                             const { data: serviceData } = await supabaseClient.from('services').select('id, price').eq('merchant_id', merchant_id).eq('name', existingBooking.service_name).single();
                             if (serviceData) totalAmount += (serviceData.price || 0);

                             if (mergedAddons.length > 0) {
                                 let dbAddons = [];
                                 if (serviceData?.id) {
                                     const { data } = await supabaseClient.from('service_addons').select('name, price').eq('service_id', serviceData.id);
                                     dbAddons = data || [];
                                 }
                                 mergedAddons.forEach((addon: any) => {
                                     const addonName = typeof addon === 'string' ? addon : addon.name;
                                     if (addonName) {
                                         const match = dbAddons?.find((a: any) => a.name.toLowerCase().trim() === addonName.toLowerCase().trim());
                                         if (match) totalAmount += (Number(match.price) || 0);
                                     }
                                 });
                             }

                             const { data: updated, error: upError } = await supabaseClient.from('bookings')
                                .update({ addons: mergedAddons, total_amount: totalAmount })
                                .eq('id', existingBooking.id)
                                .select().single();
                             
                             if (upError) throw upError;

                             toolResult = JSON.stringify({ success: true, message: "Booking updated with new addons.", booking: updated });
                             executedActions.push(`Updated booking: ${existingBooking.service_name} (Addons: ${mergedAddons.map((a:any)=>a.name).join(', ')})`);

                        } else {
                        // 1. Check specific slot availability
                        // Try exact match first (HH:MM:SS)
                        let { data: exactSlot } = await supabaseClient.from('booking_slots')
                            .select('*')
                            .eq('merchant_id', merchant_id)
                            .eq('date', args.date)
                            .eq('time', args.time) 
                            .maybeSingle();

                        if (!exactSlot) {
                            // Try appending :00
                             const { data: slotWithSeconds } = await supabaseClient.from('booking_slots')
                                .select('*')
                                .eq('merchant_id', merchant_id)
                                .eq('date', args.date)
                                .eq('time', args.time + ":00")
                                .maybeSingle();
                             exactSlot = slotWithSeconds;
                        }
                            
                        // If exact slot not found via direct query, try finding in pre-fetched list or loose match
                        let slot = exactSlot;
                        if (!slot) {
                             slot = (slots || []).find((s: any) => s.date === args.date && s.time.substring(0, 5) === args.time.substring(0, 5));
                        }
    
                        if (!slot || slot.booked_count >= slot.capacity) {
                             // Logic: Find nearest available slots (suggestions)
                             // Fetch slots for the same day
                             const { data: daySlots } = await supabaseClient.from('booking_slots')
                                .select('*')
                                .eq('merchant_id', merchant_id)
                                .eq('date', args.date);
    
                             const requestedDateTime = new Date(`${args.date}T${args.time}`);
                             
                             const suggestions = (daySlots || [])
                                .filter((s: any) => (s.capacity - s.booked_count) > 0)
                                .map((s: any) => {
                                    const slotTime = new Date(`${s.date}T${s.time}`);
                                    const diff = Math.abs(slotTime.getTime() - requestedDateTime.getTime());
                                    return { ...s, diff };
                                })
                                .sort((a: any, b: any) => a.diff - b.diff)
                                .slice(0, 3);
    
                             if (suggestions.length > 0) {
                                 toolResult = JSON.stringify({
                                     status: "failed",
                                     message: `Slot is full or unavailable. Here are the nearest available slots. Please ask the customer if they would like to switch to one of these times.`,
                                     suggested_slots: suggestions.map((s: any) => ({
                                         date: s.date,
                                         time: s.time,
                                         slots_left: s.capacity - s.booked_count
                                     }))
                             });
                         } else {
                                 toolResult = JSON.stringify({
                                     status: "failed",
                                     message: "Selected slot is full and no other slots are available on this date. Please apologize and ask for another date."
                                 });
                             }
                        } else {
                            // Calculate Total Amount
                            let totalAmount = 0;
                            // Fetch service price and ID
                            const { data: serviceData } = await supabaseClient.from('services').select('id, price').eq('merchant_id', merchant_id).eq('name', args.service_name).single();
                            if (serviceData) totalAmount += (serviceData.price || 0);

                            // Add addons price
                            if (args.addons && args.addons.length > 0) {
                                // Fetch DB addons - join with services or just fetch by service_id if possible
                                // If service_addons has no merchant_id, we must filter by service_id
                                let dbAddons = [];
                                if (serviceData?.id) {
                                    const { data } = await supabaseClient.from('service_addons').select('name, price').eq('service_id', serviceData.id);
                                    dbAddons = data || [];
                                } else {
                                    // Fallback: fetch all? No, unsafe. 
                                    // Try to fetch all addons for this merchant via join?
                                    // Or just don't filter by merchant_id if service_addons doesn't have it.
                                    // But checking 'service_id' is safer.
                                }
                                
                                console.log('DEBUG: DB Addons:', JSON.stringify(dbAddons));
                                console.log('DEBUG: Args Addons:', JSON.stringify(args.addons));

                                args.addons.forEach((addon: any) => {
                                    const addonName = typeof addon === 'string' ? addon : addon.name;
                                    if (addonName) {
                                        const match = dbAddons?.find((a: any) => a.name.toLowerCase().trim() === addonName.toLowerCase().trim());
                                        if (match) {
                                            console.log(`DEBUG: Matched addon ${addonName} with price ${match.price}`);
                                            totalAmount += (Number(match.price) || 0);
                                        }
                                    }
                                });
                            }

                            const { data: newBooking, error } = await supabaseClient.from('bookings').insert({
                                merchant_id: merchant_id,
                                customer_id: effectiveCustomerId, // Link to customer ID
                                customer_name: args.customer_name,
                                service_name: args.service_name,
                                date: args.date,
                                time: args.time,
                                status: 'confirmed',
                                addons: args.addons || [],
                                total_amount: totalAmount
                            }).select().single();
                            
                            if (error) throw error;

                            // Increment Slot booked_count
                            if (slot) {
                                await supabaseClient.rpc('increment_slot_booked_count', { p_slot_id: slot.id });
                            }

                            // Enrich task details for log
                            const logDetails = {
                                ...args,
                                addons_formatted: args.addons ? args.addons.map((a: any) => `${a.name} ($${a.price})`).join(', ') : 'None'
                            };
                            // Hack: Update the pending log or let the success log carry the details. 
                            // Since we insert a new 'success' log below, we can just ensure args is rich enough or rely on the toolResult.
                            // Better: Update the 'args' variable itself so the success log uses it? 
                            // Actually, the success log uses 'args' from the scope. Let's mutate args or create a new object.
                            args.rich_details = logDetails;

                            toolResult = JSON.stringify({ success: true, message: "Booking created successfully.", booking: newBooking });
                            executedActions.push(`Booked service: ${args.service_name} at ${args.time} on ${args.date} (Addons: ${args.addons?.map((a:any)=>a.name).join(', ') || 'None'})`);
                        }
                    }
                    } else if (fnName === 'get_bookings') {
                        let query = supabaseClient.from('bookings').select('*').eq('merchant_id', merchant_id);
                        
                        if (args.customer_id) {
                            query = query.eq('customer_id', args.customer_id);
                        } else {
                            query = query.ilike('customer_name', `%${args.customer_name}%`);
                        }
                        
                        const { data } = await query;
                        toolResult = JSON.stringify(data);
                    } else if (fnName === 'cancel_booking') {
                         // 1. Get booking to find date/time
                         const { data: booking } = await supabaseClient.from('bookings').select('*').eq('id', args.booking_id).single();
                         
                         if (!booking) {
                             toolResult = JSON.stringify({ success: false, message: "Booking not found." });
                         } else {
                             const { data: cancelledData, error } = await supabaseClient.from('bookings')
                                .update({ status: 'cancelled' })
                                .eq('id', args.booking_id)
                                .select();
                             
                             if (error) throw error;

                             // 2. Decrement slot count
                             // Find the slot
                             const { data: slot } = await supabaseClient.from('booking_slots')
                                .select('id')
                                .eq('merchant_id', merchant_id)
                                .eq('date', booking.date)
                                .eq('time', booking.time) // Assuming exact match or close enough for now
                                .maybeSingle();
                                
                             if (slot) {
                                 await supabaseClient.rpc('decrement_slot_booked_count', { p_slot_id: slot.id });
                             }

                             toolResult = JSON.stringify({ success: true, message: "Booking cancelled successfully." });
                         }
                    } else if (fnName === 'create_order') {
                        // Validation: Check product stock
                        let orderError = null;
                        
                        for (const item of args.items) {
                            const product = (products || []).find((p: any) => 
                                p.name.toLowerCase() === item.product_name.toLowerCase()
                            );
                            
                            if (!product) {
                                orderError = { status: "failed", message: `Product not found: ${item.product_name}` };
                                break;
                            }
    
                            let stock = product.current_stock ?? product.total_quantity;
                            let variantName = item.variant_name;
    
                            let variant = null;
                            // Check specific variant if provided
                            if (variantName) {
                                variant = variants.find((v: any) => 
                                    v.product_id === product.id && 
                                    v.name.toLowerCase().includes(variantName.toLowerCase())
                                );
                                if (!variant) {
                                    orderError = { status: "failed", message: `Variant '${variantName}' not found for ${item.product_name}` };
                                    break;
                                }
                                stock = variant.current_stock ?? variant.total_quantity;
                                // Update item name to include variant for the order record
                                item.product_name_full = `${product.name} (${variant.name})`;
                            } else {
                                item.product_name_full = product.name;
                            }
    
                            // Capture IDs
                            item.product_id = product.id;
                            item.variant_id = variant?.id;
    
                            // Stock check
                            if (stock !== undefined && stock !== null && stock < item.quantity) {
                                 // Find available variants for this product
                                 const availableVariants = variants
                                    .filter((v: any) => v.product_id === product.id && (v.current_stock ?? v.total_quantity) > 0)
                                    .map((v: any) => `${v.name} (Stock: ${v.current_stock ?? v.total_quantity})`);
                                 
                                 const message = availableVariants.length > 0 
                                    ? `Item '${item.product_name}' is out of stock. Please suggest these available variants to the customer: ${availableVariants.join(', ')}`
                                    : `Item '${item.product_name}' is out of stock and no variants are available.`;
    
                                 orderError = {
                                     status: "failed",
                                     message: message,
                                     available_variants: availableVariants
                                 };
                                 break; 
                            }
                        }
    
                        if (orderError) {
                            toolResult = JSON.stringify(orderError);
                        } else {
                            // Proceed with creation
                            const createdOrders = [];
                            for (const item of args.items) {
                                // Calculate Total Amount
                            let totalAmount = 0;
                            let unitPrice = 0;

                            if (item.variant_id) {
                                const { data: v } = await supabaseClient.from('product_variants').select('price').eq('id', item.variant_id).single();
                                unitPrice = v?.price || 0;
                            } else if (item.product_id) {
                                const { data: p } = await supabaseClient.from('products').select('price').eq('id', item.product_id).single();
                                unitPrice = p?.price || 0;
                            }
                            
                            totalAmount = unitPrice * item.quantity;

                            const { data, error } = await supabaseClient.from('orders').insert({
                                merchant_id: merchant_id,
                                customer_id: args.customer_id || customer?.id,
                                customer_name: args.customer_name,
                                product_name: item.product_name_full || item.product_name, // Use the full name with variant
                                quantity: item.quantity,
                                channel: 'website',
                                status: 'confirmed', // Trigger stock deduction
                                product_id: item.product_id,
                                variant_id: item.variant_id,
                                total_amount: totalAmount
                            }).select().single();
                                
                                if (error) throw error;
                                createdOrders.push(data);

                                // Decrement Stock
                                await supabaseClient.rpc('decrement_product_stock', {
                                    p_product_id: item.product_id,
                                    p_variant_id: item.variant_id || null,
                                    p_quantity: item.quantity
                                });
                            }
                            
                            // Enrich task details for log
                            args.rich_details = {
                                ...args,
                                items_formatted: createdOrders.map((o: any) => `${o.product_name} (x${o.quantity})`).join(', ')
                            };

                            toolResult = JSON.stringify({ success: true, message: "Orders created successfully.", orders: createdOrders });
                            executedActions.push(`Created order for: ${createdOrders.map((o:any) => `${o.product_name} x${o.quantity}`).join(', ')}`);
                        }
                    } else if (fnName === 'get_orders') {
                        let query = supabaseClient.from('orders').select('*').eq('merchant_id', merchant_id);
    
                        if (args.customer_id) {
                             query = query.eq('customer_id', args.customer_id);
                        } else {
                             query = query.ilike('customer_name', `%${args.customer_name}%`);
                        }
    
                        const { data } = await query;
                        toolResult = JSON.stringify(data);
                    } else if (fnName === 'cancel_order') {
                         const { data, error } = await supabaseClient.from('orders')
                            .update({ status: 'cancelled' })
                            .eq('id', args.order_id)
                            .select();
                            
                         if (error) throw error;
                         
                         if (!data || data.length === 0) {
                             toolResult = JSON.stringify({ success: false, message: "Order not found or already cancelled. Please check the Order ID using 'get_orders'." });
                         } else {
                             // Restore stock
                             await supabaseClient.rpc('restore_product_stock', { p_order_id: args.order_id });
                             
                             toolResult = JSON.stringify({ success: true, message: "Order cancelled successfully." });
                         }
                    } else if (fnName === 'create_customer') {
                        // Deduplicate by email/phone/name under the same merchant
                        let query = supabaseClient.from('customers').select('*').eq('merchant_id', merchant_id);
                        const conditions: string[] = [];
                        if (args.email) conditions.push(`email.eq.${args.email}`);
                        if (args.phone) conditions.push(`phone.eq.${args.phone}`);
                        if (args.name) conditions.push(`name.eq.${args.name}`);
                        if (conditions.length > 0) {
                            query = query.or(conditions.join(','));
                        }
                        const { data: existing } = await query.maybeSingle();
    
                        if (existing) {
                            // Sync with conversation
                            const updates: any = { visitor_name: existing.name };
                            if (existing.email) updates.visitor_email = existing.email;
                            if (existing.phone) updates.visitor_phone = existing.phone;
                            await supabaseClient.from('conversations').update(updates).eq('id', conversation_id);
                            
                            customer = existing;
                            toolResult = JSON.stringify({ success: true, message: "Customer already exists. Linked to conversation.", customer: existing });
                        } else {
                            const { data, error } = await supabaseClient.from('customers').insert({
                                merchant_id: merchant_id,
                                name: args.name,
                                email: args.email,
                                phone: args.phone,
                                channel: 'website',
                                created_by: 'ai_agent'
                            }).select().single();
                            if (error) throw error;
                            
                            // Sync with conversation
                            const updates: any = { visitor_name: args.name };
                            if (args.email) updates.visitor_email = args.email;
                            if (args.phone) updates.visitor_phone = args.phone;
                            await supabaseClient.from('conversations').update(updates).eq('id', conversation_id);
                            
                            customer = data; // Update local customer context
                            toolResult = JSON.stringify({ success: true, message: "Customer profile created.", customer: data });
                            executedActions.push(`Created new customer profile: ${args.name}`);
                        }
                    } else if (fnName === 'update_customer') {
                        let targetCustomerId = customer?.id;
    
                        // If no current customer context, try to find by provided contact info
                        if (!targetCustomerId && (args.email || args.phone)) {
                             let query = supabaseClient.from('customers').select('*').eq('merchant_id', merchant_id);
                             const conditions = [];
                             if (args.email) conditions.push(`email.eq.${args.email}`);
                             if (args.phone) conditions.push(`phone.eq.${args.phone}`);
                             if (conditions.length > 0) {
                                 query = query.or(conditions.join(','));
                                 const { data: found } = await query.maybeSingle();
                                 if (found) targetCustomerId = found.id;
                             }
                        }
    
                        if (targetCustomerId) {
                            const { data, error } = await supabaseClient.from('customers').update({
                                name: args.name,
                                email: args.email,
                                phone: args.phone
                            }).eq('id', targetCustomerId).select().single();
                            if (error) throw error;
                            
                            // Sync with conversation
                            const updates: any = { visitor_name: args.name };
                            if (args.name) updates.visitor_name = args.name;
                            if (args.email) updates.visitor_email = args.email;
                            if (args.phone) updates.visitor_phone = args.phone;
                            if (Object.keys(updates).length > 0) {
                                await supabaseClient.from('conversations').update(updates).eq('id', conversation_id);
                            }
                            
                            toolResult = JSON.stringify({ success: true, message: "Customer profile updated.", customer: data });
                            executedActions.push(`Updated customer profile: ${args.name || ''} ${args.phone || ''}`);
                        } else {
                             toolResult = JSON.stringify({ success: false, message: "No customer profile found to update. Use create_customer first." });
                        }
                    } else if (fnName === 'update_customer_insight') {
                        if (customer) {
                            const { error } = await supabaseClient.from('customers').update({
                                internal_notes: args.internal_notes,
                                tags: args.tags,
                                lead_score: args.lead_score
                            }).eq('id', customer.id);
                            if (error) throw error;
                            toolResult = JSON.stringify({ success: true, message: "Customer insights updated." });
                        } else {
                            // Create temporary customer if possible or just warn
                             toolResult = JSON.stringify({ success: false, message: "No customer profile found. Please ask for name and create profile first." });
                        }
                    }
                    // --- TOOL LOGIC END ---
    
                    // Log task success
                    await supabaseClient.from('ai_task_logs').insert({
                        conversation_id: conversation_id,
                        merchant_id: merchant_id,
                        task_type: fnName,
                        task_title: `Executed ${fnName}`,
                        task_details: args.rich_details || args,
                        task_status: 'success',
                        created_at: new Date().toISOString()
                    });
    
                } catch (err: any) {
                    console.error(`Tool execution error: ${err.message}`);
                    toolResult = JSON.stringify({ success: false, error: err.message });
    
                    // Log task failure
                    await supabaseClient.from('ai_task_logs').insert({
                        conversation_id: conversation_id,
                        merchant_id: merchant_id,
                        task_type: fnName,
                        task_title: `Failed ${fnName}`,
                        task_details: args,
                        task_status: 'failed',
                        created_at: new Date().toISOString()
                    });
                }
    
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: toolResult
                });
            } // End for loop over tool calls
            
            // Loop will continue to next turn to send tool outputs back to AI
            
        } else {
            // No tool calls, just a reply. We are done.
            break;
        }
    }

    // 5. Return response
    // Persist AI message to database for frontend real-time updates
    if (finalReply && finalReply.trim().length > 0) {
        try {
            await supabaseClient.from('messages').insert({
                conversation_id,
                merchant_id,
                role: 'ai',
                content: finalReply,
                created_at: new Date().toISOString()
            });
        } catch (_) {}
    }

    // Auto-write private notes (customer insights) after each assistant reply
    try {
        // Reload customer context if missing
        if (!customer) {
            const { data: conversationLatest } = await supabaseClient.from('conversations').select('*').eq('id', conversation_id).maybeSingle();
            if (conversationLatest) {
                let q = supabaseClient.from('customers').select('*').eq('merchant_id', merchant_id);
                const conds: string[] = [];
                if (conversationLatest.visitor_email) conds.push(`email.eq.${conversationLatest.visitor_email}`);
                if (conversationLatest.visitor_phone) conds.push(`phone.eq.${conversationLatest.visitor_phone}`);
                if (conversationLatest.visitor_name && conversationLatest.visitor_name !== 'Visitor' && conds.length === 0) {
                    conds.push(`name.eq.${conversationLatest.visitor_name}`);
                }
                if (conds.length > 0) {
                    q = q.or(conds.join(','));
                    const { data: found } = await q.maybeSingle();
                    if (found) customer = found;
                }
                // If still not found, try to extract name from current user message and upsert a minimal customer
                // DEPRECATED: Regex extraction removed. AI MUST use 'create_customer' tool.
            }
        }
        if (customer) {
            // Fetch existing tags/notes
            const { data: existingProfile } = await supabaseClient
                .from('customers')
                .select('tags, lead_score, internal_notes')
                .eq('id', customer.id)
                .single();
            const now = new Date().toISOString();
            const baseTags = Array.isArray(existingProfile?.tags) ? existingProfile!.tags : [];
            let computedTags = [...baseTags];
            
            // Robust Tagging based on Executed Actions (Tools)
            // Check if 'create_booking' or 'create_order' was successfully executed in this turn
            const hasBooking = executedActions.some(a => a.startsWith('Booked service'));
            const hasOrder = executedActions.some(a => a.startsWith('Created order'));

            if (hasBooking) {
                if (!computedTags.includes('Booked Service')) computedTags.push('Booked Service');
            }
            if (hasOrder) {
                if (!computedTags.includes('Ordered Product')) computedTags.push('Ordered Product');
            }
            
            // Generate concise summary for private note
            let newNoteEntry = `[${now}] Reply: ${finalReply.substring(0, 50)}...`;
            try {
                // Short timestamp
                const shortTime = new Date().toISOString().substring(11, 16); // HH:mm
                
                const summaryRes = await fetch(`${baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            { role: 'system', content: "You are a CRM assistant. Summarize the following interaction concisely in 1 sentence. Format: '[HH:mm] <User Request> -> <Outcome>'. Keep it under 20 words. Use Vietnamese." },
                            { role: 'user', content: `Time: ${shortTime}\nUser: ${message_content}\nAI: ${finalReply}\nSystem Actions: ${executedActions.join('; ')}` }
                        ],
                        temperature: 0.3,
                        max_tokens: 100
                    })
                });
                const summaryData = await summaryRes.json();
                if (summaryData.choices?.[0]?.message?.content) {
                    newNoteEntry = summaryData.choices[0].message.content;
                }
            } catch (e) {
                console.error('Failed to generate summary:', e);
            }

            const combinedNotes = existingProfile?.internal_notes
                ? `${existingProfile.internal_notes}\n${newNoteEntry}`
                : newNoteEntry;
            const newLead = Math.min(100, (existingProfile?.lead_score ?? 50) + 5);
            await supabaseClient.from('customers').update({
                internal_notes: combinedNotes,
                tags: computedTags,
                lead_score: newLead
            }).eq('id', customer.id);
            // Log auto insight
            await supabaseClient.from('ai_task_logs').insert({
                conversation_id,
                merchant_id,
                task_type: 'update_customer_insight',
                task_title: 'Auto insight update',
                task_details: { internal_notes: newNoteEntry, tags: computedTags, lead_score: newLead },
                task_status: 'success',
                created_at: now
            });
        }
    } catch (_) {}

    return new Response(JSON.stringify({ reply: finalReply, customer_id: customer?.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
