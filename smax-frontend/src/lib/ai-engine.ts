import { supabase } from './supabase';
import { api } from './api';
import { AIConfig, Message, Product, ProductVariant, Service, ServiceAddon } from '../types';

interface MerchantContext {
  merchant: any;
  products: Product[];
  variants: ProductVariant[];
  services: Service[];
  serviceAddons: ServiceAddon[];
  bookingSlots: any[];
  faqs: any[];
  aiConfig: any;
}

interface Action {
  type: string;
  title: string;
  details: any;
  status: 'success' | 'pending' | 'failed';
}

interface AIResponse {
  reply: string;
  actions: Action[];
  tool_calls?: any[]; // Raw tool calls from OpenAI
}

// --- Tools Definition ---
const TOOLS = [
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
      name: "create_booking",
      description: "Create a new booking for a service.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "The UUID of the customer" },
          customer_name: { type: "string", description: "Name of the customer" },
          date: { type: "string", description: "Date in YYYY-MM-DD format" },
          time: { type: "string", description: "Time in HH:MM format" },
          service_name: { type: "string", description: "Name of the service or product" }
        },
        required: ["customer_name", "date", "time", "service_name"]
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
          customer_name: { type: "string", description: "Name of the customer to filter by" }
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

// --- Helper Functions ---

async function loadMerchantContext(merchantId: string): Promise<MerchantContext> {
  // Load merchant info
  const { data: merchant } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", merchantId)
    .single();
  
  // Load products
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("merchant_id", merchantId);

  // Load product variants
  const productIds = products?.map((p: any) => p.id) || [];
  let variants: any[] = [];
  if (productIds.length > 0) {
    const { data } = await supabase
      .from("product_variants")
      .select("*")
      .in("product_id", productIds);
    variants = data || [];
  }

  // Load services
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("merchant_id", merchantId);

  // Load service addons
  const serviceIds = services?.map((s: any) => s.id) || [];
  let serviceAddons: any[] = [];
  if (serviceIds.length > 0) {
    const { data } = await supabase
      .from("service_addons")
      .select("*")
      .in("service_id", serviceIds);
    serviceAddons = data || [];
  }
  
  // Load available booking slots (future dates only)
  const today = new Date().toISOString().split("T")[0];
  const { data: bookingSlots } = await supabase
    .from("booking_slots")
    .select("*")
    .eq("merchant_id", merchantId)
    .gte("date", today)
    .order("date", { ascending: true });
  
  // Load FAQs
  const { data: faqs } = await supabase
    .from("faqs")
    .select("*")
    .eq("merchant_id", merchantId);
  
  // Load AI config
  const { data: aiConfig } = await supabase
    .from("ai_configs")
    .select("*")
    .eq("merchant_id", merchantId)
    .single();
  
  return {
    merchant: merchant || {},
    products: (products || []) as Product[],
    variants: (variants || []) as ProductVariant[],
    services: (services || []) as Service[],
    serviceAddons: (serviceAddons || []) as ServiceAddon[],
    bookingSlots: bookingSlots || [],
    faqs: faqs || [],
    aiConfig: aiConfig || {}
  };
}

function buildSystemPrompt(context: MerchantContext, visitorName: string, customer?: any): string {
  const { merchant, products, variants, services, serviceAddons, bookingSlots, faqs } = context;
  
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
  const productsList = products.length > 0 ? products
    .map(p => {
      const pVariants = variants.filter(v => v.product_id === p.id);
      let info = `- ${p.name}: $${p.price} (${p.description || ''}, Stock: ${p.current_stock ?? p.total_quantity ?? 'N/A'})`;
      if (pVariants.length > 0) {
        info += '\n  Variants:';
        pVariants.forEach(v => {
          info += `\n  * ${v.name}: $${v.price ?? p.price} (Stock: ${v.current_stock ?? v.total_quantity ?? 'N/A'})`;
        });
      }
      return info;
    })
    .join("\n") : "No products available";

  // Format services list with addons
  const servicesList = services.length > 0 ? services
    .map(s => {
      const sAddons = serviceAddons.filter(a => a.service_id === s.id);
      let info = `- ${s.name}: $${s.price} (${s.description || ''})`;
      if (sAddons.length > 0) {
        info += '\n  Add-ons:';
        sAddons.forEach(a => {
          info += `\n  * ${a.name}: +$${a.price} (${a.description || ''})`;
        });
      }
      return info;
    })
    .join("\n") : "No services available";
  
  // Format available slots
  const slotsList = bookingSlots
    .slice(0, 15) // Show top 15 slots
    .map(s => `- ${s.date} at ${s.time} (${s.duration_minutes || 60} min) - Slots left: ${s.capacity - s.booked_count}`)
    .join("\n");
  
  // Format FAQs as knowledge base
  const faqsList = faqs
    .map(f => `Q: ${f.question}\nA: ${f.answer}`)
    .join("\n\n");
  
  const systemPrompt = `
You are a professional sales and booking assistant for ${merchant.name}.

MERCHANT INFORMATION:
- Business: ${merchant.business_type}
- Website: ${merchant.website}
${customerMemory}
- Current Customer: ${visitorName} (If "Customer", ask for their name)

AVAILABLE PRODUCTS:
${productsList}

AVAILABLE SERVICES:
${servicesList}

AVAILABLE BOOKING SLOTS (Only book these):
${slotsList || "No slots available"}

FREQUENTLY ASKED QUESTIONS & POLICIES:
${faqsList || "No FAQs available"}

YOUR RESPONSIBILITIES:
1. **Customer Management**:
   - If you don't know the customer's name, ask for it politely.
   - If the customer provides their name or contact info, use 'create_customer' (if new) or 'update_customer' (if correcting).
   - ALWAYS use 'update_customer_insight' to save "Internal Notes" (Private Memory) about the customer's preferences, needs, and conversation summary. This is CRITICAL for future context.

2. **Booking & Orders**:
   - **Services**: BEFORE creating a booking, YOU MUST ASK specifically which service the customer wants to book. Do not assume. Describe available services if asked.
   - **Products**: Check stock. Suggest variants if out of stock.
   - Use 'create_booking' ONLY when you have Date, Time, AND Service Name.
   - Use 'create_order' for products.

3. **Consultation**:
   - Answer questions about products/services using the provided lists.
   - If the user asks "What services do you have?", list the items in the "AVAILABLE SERVICES" section above.
   - Be friendly and professional.

IMPORTANT RULES:
- If a tool returns a 'failed' status with suggestions, present them to the customer.
- Never make up availability or services not listed above.
- If the "AVAILABLE SERVICES" list is empty or says "No services available", apologize and say you don't have the service list right now, but ask what they are looking for.
- Use 'get_bookings' or 'get_orders' to find items before cancelling.
`;
  
  return systemPrompt;
}

// --- Main Function ---

export const generateAIResponse = async (
  message: string,
  history: Message[],
  config: AIConfig,
  merchantContext: any,
  conversationId: string,
  customer?: any
): Promise<AIResponse> => {
  
  try {
    console.log(`[AI Engine] Generating response for merchant: ${merchantContext.id}`);

    // 1. Load FULL Context
    const context = await loadMerchantContext(merchantContext.id);
    
    // 2. Build System Prompt
    const visitorName = customer?.name || 'Customer'; 
    const systemPrompt = buildSystemPrompt(context, visitorName, customer);

    // 3. Prepare Messages
    let conversationMessages: any[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map(m => ({
        role: (m.sender === 'visitor' || m.role === 'visitor') ? 'user' : 'assistant',
        content: m.content
      })),
      { role: 'user', content: message }
    ];

    // 4. API Config
    const apiKey = context.aiConfig?.openai_api_key || config.openai_api_key;
    const baseUrl = context.aiConfig?.openai_base_url || config.openai_base_url || 'https://token.ai.vn/v1';
    const model = context.aiConfig?.model || config.model || 'gpt-4o-mini';

    if (!apiKey) {
      return {
        reply: "I'm an AI assistant, but I haven't been configured with an API key yet.",
        actions: []
      };
    }

    const callOpenAI = async (msgs: any[]) => {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: msgs,
            temperature: 0.7,
            max_tokens: 500,
            tools: TOOLS,
            tool_choice: "auto"
          })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error ${response.status}: ${errText}`);
        }
        return response.json();
    };

    // 5. Initial Call
    let data = await callOpenAI(conversationMessages);
    let messageData = data.choices[0]?.message;
    let reply = messageData?.content || "";
    let toolCalls = messageData?.tool_calls || [];
    
    const actions: Action[] = [];

    // 6. Handle Tool Calls (Single Loop)
    if (toolCalls && toolCalls.length > 0) {
        // Add assistant's message (with tool calls) to history
        conversationMessages.push(messageData);

        for (const tool of toolCalls) {
            const fnName = tool.function.name;
            const args = JSON.parse(tool.function.arguments);
            
            actions.push({
                type: fnName,
                title: `AI executing: ${fnName}`,
                details: args,
                status: 'pending'
            });

            let result;
            try {
                if (fnName === 'check_availability') {
                    // Logic: Filter context.bookingSlots
                    const daySlots = context.bookingSlots.filter((s: any) => s.date === args.date);
                    const available = daySlots.filter((s: any) => (s.capacity - s.booked_count) > 0);
                    
                    if (available.length > 0) {
                      result = {
                        status: "success",
                        available_slots: available.map((s: any) => ({ time: s.time, slots_left: s.capacity - s.booked_count }))
                      };
                    } else {
                       result = {
                        status: "success",
                        message: "No slots available for this date.",
                        available_slots: []
                       };
                    }
                } else if (fnName === 'create_booking') {
                    // Validation: Check slot availability
                    // Find exact slot match first
                    const slot = context.bookingSlots.find((s: any) => 
                        s.date === args.date && s.time.substring(0, 5) === args.time
                    );
                    
                    if (!slot || slot.booked_count >= slot.capacity) {
                        // Logic: Find nearest available slots
                        const requestedDateTime = new Date(`${args.date}T${args.time}`);
                        const suggestions = context.bookingSlots
                            .filter((s: any) => s.date === args.date && (s.capacity - s.booked_count) > 0)
                            .map((s: any) => s.time);
                            
                        result = {
                            status: 'failed',
                            error: 'Slot unavailable',
                            suggestions: suggestions.length > 0 ? suggestions : ['No other slots today']
                        };
                    } else {
                        // Slot available, proceed
                        result = await api.createBooking(
                          merchantContext.id, 
                          args.customer_name, 
                          args.date, 
                          args.time, 
                          args.service_name,
                          args.customer_id || customer?.id
                        );
                    }
                } else if (fnName === 'update_booking') {
                     const updates: any = {};
                     if (args.addons) updates.addons = args.addons;
                     
                     if (args.date && args.time) {
                         // Check availability for new slot
                         const slot = context.bookingSlots.find((s: any) => 
                            s.date === args.date && s.time.substring(0, 5) === args.time
                         );

                         if (!slot || slot.booked_count >= slot.capacity) {
                             result = {
                                status: 'failed',
                                error: 'New requested slot is unavailable'
                             };
                         } else {
                             updates.date = args.date;
                             updates.time = args.time;
                         }
                     }
                     
                     if (!result || !result.error) {
                         result = await api.updateBooking(args.booking_id, updates);
                     }
                } else if (fnName === 'get_bookings') {
                    result = await api.getBookings(merchantContext.id, args.customer_name, args.customer_id || customer?.id);
                } else if (fnName === 'cancel_booking') {
                    result = await api.cancelBooking(args.booking_id);
                } else if (fnName === 'create_order') {
                    // Validation: Check product stock
                    for (const item of args.items) {
                        const product = context.products.find((p: any) => 
                            p.name.toLowerCase() === item.product_name.toLowerCase()
                        );
                        
                        if (!product) {
                            throw new Error(`Product not found: ${item.product_name}`);
                        }

                        let stock = product.current_stock ?? product.total_quantity;
                        let variantName = item.variant_name;

                        // Check specific variant if provided
                        if (variantName) {
                            const variant = context.variants.find((v: any) => 
                                v.product_id === product.id && 
                                v.name.toLowerCase().includes(variantName.toLowerCase())
                            );
                            if (!variant) {
                                throw new Error(`Variant '${variantName}' not found for ${item.product_name}`);
                            }
                            stock = variant.current_stock ?? variant.total_quantity;
                            item.product_name = `${product.name} (${variant.name})`;
                        }

                        // Stock check
                        if (stock !== undefined && stock !== null && stock < item.quantity) {
                             // Find available variants for this product
                             const availableVariants = context.variants
                                .filter((v: any) => v.product_id === product.id && (v.current_stock ?? v.total_quantity) > 0)
                                .map((v: any) => `${v.name} (Stock: ${v.current_stock ?? v.total_quantity})`);
                             
                             const message = availableVariants.length > 0 
                                ? `Item '${item.product_name}' is out of stock. Please suggest these available variants to the customer: ${availableVariants.join(', ')}`
                                : `Item '${item.product_name}' is out of stock and no variants are available.`;

                             result = {
                                 status: "failed",
                                 message: message,
                                 available_variants: availableVariants
                             };
                             break; // Stop processing items
                        }
                    }

                    // Only proceed if no error result was set
                    if (!result) {
                        result = await api.createOrder(
                          merchantContext.id, 
                          args.customer_name, 
                          args.items,
                          args.customer_id || customer?.id
                        );
                    }
                } else if (fnName === 'get_orders') {
                    result = await api.getOrders(merchantContext.id, args.customer_name, args.customer_id || customer?.id);
                } else if (fnName === 'cancel_order') {
                    result = await api.cancelOrder(args.order_id);
                } else if (fnName === 'create_customer') {
                    result = await api.createCustomer(merchantContext.id, {
                        name: args.name,
                        phone: args.phone,
                        email: args.email,
                        channel: 'ai_agent'
                    });

                    // Update conversation with new customer details so context is preserved
                    const convUpdates: any = { visitor_name: args.name };
                    if (args.email) convUpdates.visitor_email = args.email;
                    if (args.phone) convUpdates.visitor_phone = args.phone;
                    await supabase.from('conversations').update(convUpdates).eq('id', conversationId);

                } else if (fnName === 'update_customer') {
                     // We need customer ID. If we have 'customer' in context, use it.
                     // Otherwise, we might need to search or ask. 
                     // But typically 'update_customer' is called when we know who we are talking to.
                     if (customer && customer.id) {
                         result = await api.updateCustomer(customer.id, {
                             name: args.name,
                             phone: args.phone,
                             email: args.email
                         });
                         
                         // Update conversation as well
                         const convUpdates: any = {};
                         if (args.name) convUpdates.visitor_name = args.name;
                         if (args.email) convUpdates.visitor_email = args.email;
                         if (args.phone) convUpdates.visitor_phone = args.phone;
                         if (Object.keys(convUpdates).length > 0) {
                            await supabase.from('conversations').update(convUpdates).eq('id', conversationId);
                         }

                     } else {
                         // Try to search by phone/email if provided in args to find the ID
                         const query = args.email || args.phone;
                         let foundId = null;
                         if (query) {
                             const found = await api.searchCustomer(merchantContext.id, query);
                             if (found) foundId = found.id;
                         }
                         
                         if (foundId) {
                             result = await api.updateCustomer(foundId, {
                                 name: args.name,
                                 phone: args.phone,
                                 email: args.email
                             });

                             // Update conversation as well
                             const convUpdates: any = {};
                             if (args.name) convUpdates.visitor_name = args.name;
                             if (args.email) convUpdates.visitor_email = args.email;
                             if (args.phone) convUpdates.visitor_phone = args.phone;
                             if (Object.keys(convUpdates).length > 0) {
                                await supabase.from('conversations').update(convUpdates).eq('id', conversationId);
                             }
                         } else {
                             // Fallback: Create if not found? Or error?
                             // Description says "Update customer's basic details". 
                             // If we can't find them, we can't update.
                             result = { status: 'failed', message: "Could not find customer to update. Please ask for their phone or email to identify them first." };
                         }
                     }
                } else if (fnName === 'update_customer_insight') {
                    if (customer && customer.id) {
                        result = await api.updateCustomer(customer.id, {
                            internal_notes: args.internal_notes,
                            tags: args.tags,
                            lead_score: args.lead_score
                        });
                    } else {
                        result = { status: 'failed', message: "No customer identified to update insights for." };
                    }
                } else {
                    result = { error: "Unknown function" };
                }
            } catch (err: any) {
                console.error(`Error executing tool ${fnName}:`, err);
                result = { error: err.message };
            }

            // Update action status
            const actionIndex = actions.findIndex(a => a.type === fnName && a.details === args); 
            if (actionIndex >= 0) {
                 actions[actionIndex].status = (result.error || result.status === 'failed') ? 'failed' : 'success';
            }

            conversationMessages.push({
                role: 'tool',
                tool_call_id: tool.id,
                content: JSON.stringify(result)
            });
        }

        // 7. Second Call to get natural language response
        data = await callOpenAI(conversationMessages);
        messageData = data.choices[0]?.message;
        reply = messageData?.content || "";
    } else {
        // Fallback action detection for FAQs
         if (reply.length > 200) {
            actions.push({
                type: "faq_answered",
                title: "AI answered detailed question",
                details: { type: "information" },
                status: "success"
            });
        }
    }

    return { 
      reply, 
      actions,
      tool_calls: toolCalls
    };

  } catch (error: any) {
    console.error('[AI Engine] Error:', error);
    return {
      reply: "I'm having trouble connecting right now. Please try again later.",
      actions: []
    };
  }
};
