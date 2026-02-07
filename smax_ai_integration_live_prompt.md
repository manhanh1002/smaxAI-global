# 🚀 SMAX AI - LIVE AI INTEGRATION & FULL CONTEXT LEARNING

## CRITICAL: This prompt enables REAL, FUNCTIONAL AI that learns from merchant data

---

## 1️⃣ CURRENT STATUS

❌ **What's Missing:**
- No actual LLM calls to OpenAI
- Use 1 only demo response chat which is not from AI
- Chat widget sends messages but no actual AI response
- No system prompt generation
- No context learning (products, slots, policies, order/booking history)
- Settings page exists but API key is never used
- Edge Functions are placeholders
- No new booking or order, policies & API key saved to database

✅ **What Works:**
- UI, database schema, real-time message logging
- Merchant onboarding and data input
- Conversation logging structure
- Task log storage capability
- Connected to Supabase self-hosting instance via .env file

**Goal:** Make AI actually work end-to-end with real OpenAI API + context from merchant data

---

## 2️⃣ REQUIRED INSTALLATIONS (One-time setup)

### SETUP: Supabase Self-hosting Edge Functions + token.ai.vn API

**Why Supabase Self-hosting Edge Functions:** Already integrated with Supabase, no extra infrastructure
**Why token.ai.vn:** Cheaper OpenAI API wholesale provider (Vietnamese)

**Installation:**

# Init Edge Functions for self-hosting in your project
cd your-project
supabase functions new ai-chat

# Install dependencies in Edge Function
cd supabase/functions/ai-chat
npm install axios dotenv
# NOTE: We're using axios instead of openai SDK because we'll make direct HTTP calls to token.ai.vn
```

**Cost:** 
- Supabase Edge Functions: FREE
- token.ai.vn API: Pay-per-token (cheap Vietnamese wholesale pricing)

---

## 3️⃣ ARCHITECTURE: Supabase Edge Functions + token.ai.vn API

```
┌─────────────────────────────────────────────────────────┐
│                   SMAX FRONTEND (React)                 │
│                  (Chat Widget / Dashboard)               │
└────────────────────┬────────────────────────────────────┘
                     │ POST /chat
                     ↓
┌─────────────────────────────────────────────────────────┐
│        SUPABASE EDGE FUNCTION (ai-chat)                 │
│  (Orchestrates AI logic without extra server)           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Receive message from frontend                      │
│  2. Load merchant context (Products, Slots, FAQs, etc)│
│  3. Load conversation history                          │
│  4. Build dynamic system prompt                        │
│  5. Call token.ai.vn API (OpenAI compatible)          │
│  6. Parse response + detect actions                    │
│  7. Save to Supabase (messages, task logs)            │
│  8. Return response to frontend                        │
│                                                         │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────────┐
        ↓            ↓                 ↓
   ┌────────────┐ ┌──────────────┐ ┌──────────┐
   │ Supabase   │ │ token.ai.vn  │ │ Supabase │
   │ Database   │ │ API (OpenAI) │ │ Storage  │
   │ (context)  │ │ (LLM)        │ │ (logs)   │
   └────────────┘ └──────────────┘ └──────────┘
```

**Why this setup:**
- ✅ No extra server to manage
- ✅ Serverless = scales automatically
- ✅ Supabase native = fast data access
- ✅ Free tier includes Edge Functions
- ✅ token.ai.vn = cheaper Vietnamese wholesale OpenAI API
- ✅ 100% compatible with OpenAI SDK (same endpoints)

---

## 4️⃣ SUPABASE EDGE FUNCTION CODE (token.ai.vn Version)

### Step 1: Create Edge Function

```bash
supabase functions new ai-chat
```

### Step 2: Install Dependencies

Create `supabase/functions/ai-chat/package.json`:

```json
{
  "name": "ai-chat",
  "version": "1.0.0",
  "dependencies": {
    "axios": "^1.6.0"
  }
}
```

### Step 3: Implement AI Chat Handler (Using token.ai.vn)

File: `supabase/functions/ai-chat/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

// Environment variables (set in Supabase dashboard)
const TOKEN_AI_API_KEY = Deno.env.get("TOKEN_AI_API_KEY")
const TOKEN_AI_BASE_URL = "https://api.token.ai.vn" // token.ai.vn endpoint
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")

const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)

interface ChatRequest {
  merchant_id: string
  conversation_id: string
  visitor_name: string
  message: string
}

interface Message {
  role: "system" | "user" | "assistant"
  content: string
}

serve(async (req) => {
  // Only accept POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  try {
    const { merchant_id, conversation_id, visitor_name, message } = await req.json() as ChatRequest

    // 1. LOAD MERCHANT CONTEXT
    console.log(`[${new Date().toISOString()}] Loading context for merchant: ${merchant_id}`)
    
    const context = await loadMerchantContext(merchant_id)
    
    // 2. LOAD CONVERSATION HISTORY
    const { data: messages } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true })
      .limit(10)
    
    // 3. BUILD SYSTEM PROMPT
    const systemPrompt = buildSystemPrompt(context, visitor_name)
    
    // 4. PREPARE MESSAGES FOR token.ai.vn
    const conversationMessages: Message[] = [
      {
        role: "system",
        content: systemPrompt
      },
      ...(messages || []).map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content
      })),
      {
        role: "user",
        content: message
      }
    ]
    
    // 5. CALL token.ai.vn API (OpenAI compatible endpoint)
    console.log("Calling token.ai.vn API...")
    
    const response = await fetch(`${TOKEN_AI_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOKEN_AI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4", // or "gpt-3.5-turbo" for cheaper option
        messages: conversationMessages,
        temperature: 0.7,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`token.ai.vn API error: ${response.status} - ${errorData}`)
    }

    const responseData = await response.json()
    const aiMessage = responseData.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response."
    
    // 6. DETECT ACTIONS IN RESPONSE
    const actions = detectActions(aiMessage, context, conversation_id)
    
    // 7. SAVE MESSAGE TO DATABASE
    const { data: savedMessage } = await supabase
      .from("messages")
      .insert({
        conversation_id,
        role: "ai",
        content: aiMessage,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    // 8. SAVE TASK LOGS
    for (const action of actions) {
      await supabase
        .from("ai_task_logs")
        .insert({
          conversation_id,
          merchant_id,
          task_type: action.type,
          task_title: action.title,
          task_details: action.details,
          task_status: action.status,
          created_at: new Date().toISOString()
        })
    }
    
    // 9. RETURN RESPONSE
    return new Response(
      JSON.stringify({
        success: true,
        reply: aiMessage,
        actions: actions,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200
      }
    )
    
  } catch (error) {
    console.error("Error in ai-chat function:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500
      }
    )
  }
})

// HELPER FUNCTIONS

interface MerchantContext {
  merchant: any
  products: any[]
  bookingSlots: any[]
  faqs: any[]
  aiConfig: any
}

async function loadMerchantContext(merchantId: string): Promise<MerchantContext> {
  // Load merchant info
  const { data: merchant } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", merchantId)
    .single()
  
  // Load products
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("merchant_id", merchantId)
  
  // Load available booking slots (future dates only)
  const { data: bookingSlots } = await supabase
    .from("booking_slots")
    .select("*")
    .eq("merchant_id", merchantId)
    .gte("date", new Date().toISOString().split("T")[0])
    .eq("is_available", true)
    .order("date", { ascending: true })
  
  // Load FAQs
  const { data: faqs } = await supabase
    .from("faqs")
    .select("*")
    .eq("merchant_id", merchantId)
  
  // Load AI config
  const { data: aiConfig } = await supabase
    .from("ai_config")
    .select("*")
    .eq("merchant_id", merchantId)
    .single()
  
  return {
    merchant: merchant || {},
    products: products || [],
    bookingSlots: bookingSlots || [],
    faqs: faqs || [],
    aiConfig: aiConfig || {}
  }
}

function buildSystemPrompt(context: MerchantContext, visitorName: string): string {
  const { merchant, products, bookingSlots, faqs } = context
  
  // Format products list
  const productsList = products
    .map(p => `- ${p.name}: ${p.price} (${p.description})`)
    .join("\n")
  
  // Format available slots
  const slotsList = bookingSlots
    .slice(0, 10) // Show top 10 slots
    .map(s => `- ${s.date} at ${s.time} (Duration: ${s.duration_minutes}min)`)
    .join("\n")
  
  // Format FAQs as knowledge base
  const faqsList = faqs
    .map(f => `Q: ${f.question}\nA: ${f.answer}`)
    .join("\n\n")
  
  const systemPrompt = `
You are a professional sales and booking assistant for ${merchant.name}.

MERCHANT INFORMATION:
- Business: ${merchant.business_type}
- Website: ${merchant.website}
- Customer: ${visitorName}

AVAILABLE PRODUCTS & SERVICES:
${productsList || "No products available"}

AVAILABLE BOOKING SLOTS:
${slotsList || "No slots available"}

FREQUENTLY ASKED QUESTIONS & POLICIES:
${faqsList || "No FAQs available"}

YOUR RESPONSIBILITIES:
1. Help customers book services by suggesting available slots
2. Answer questions about products, pricing, and policies
3. Provide professional, helpful, and friendly customer service
4. Only recommend products and slots that are actually available
5. When customer shows booking intent, extract their preferred date/time
6. Confirm details before "booking" (you'll log this as an action)
7. Use the customer's name (${visitorName}) to make conversation personal

IMPORTANT RULES:
- Never invent products or prices not listed above
- Only suggest slots that are in the AVAILABLE BOOKING SLOTS list
- If a slot is not available, offer alternatives
- Always maintain a professional and friendly tone
- If unsure about something, ask for clarification rather than guessing
- If customer needs complex support, offer to escalate to a human

START WITH A FRIENDLY GREETING IF THIS IS THE FIRST MESSAGE.
`
  
  return systemPrompt
}

interface Action {
  type: string
  title: string
  details: object
  status: "success" | "pending" | "failed"
}

function detectActions(aiMessage: string, context: MerchantContext, conversationId: string): Action[] {
  const actions: Action[] = []
  
  // Check if AI mentioned booking
  if (aiMessage.toLowerCase().includes("book") && aiMessage.toLowerCase().includes("confirm")) {
    // Extract potential booking details from context
    actions.push({
      type: "booking_suggested",
      title: "AI suggested a booking",
      details: {
        message: "Customer shown available slots",
        conversationId
      },
      status: "pending"
    })
  }
  
  // Check if AI mentioned product
  const productMatches = context.products.filter(p =>
    aiMessage.toLowerCase().includes(p.name.toLowerCase())
  )
  
  if (productMatches.length > 0) {
    actions.push({
      type: "product_suggested",
      title: `AI suggested product: ${productMatches[0].name}`,
      details: {
        product: productMatches[0].name,
        price: productMatches[0].price
      },
      status: "success"
    })
  }
  
  // Check if AI answered FAQ
  if (aiMessage.length > 200) {
    actions.push({
      type: "faq_answered",
      title: "AI answered customer question with detailed info",
      details: {
        type: "information_provided"
      },
      status: "success"
    })
  }
  
  return actions
}
```

---

**Note:** token.ai.vn uses the SAME API format as OpenAI, so the code is 100% compatible. The only difference is:
- Endpoint: `https://api.token.ai.vn/v1/chat/completions` (instead of `https://api.openai.com/v1/chat/completions`)
- Authorization header: Same format `Bearer {YOUR_API_KEY}`
- Request/Response body: Identical to OpenAI API
- Token AI API Key: Get from .env file in this project and add to Supabase Edge Function Secrets
---

## 6️⃣ FRONTEND INTEGRATION (Chat Widget)

### Update ChatWidget Component to Call Edge Function

File: `src/components/ChatWidget/ChatWidget.tsx`

```typescript
import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [merchantId] = useState('merchant_1') // From session
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize conversation on mount
  useEffect(() => {
    initializeConversation()
  }, [])

  const initializeConversation = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        merchant_id: merchantId,
        visitor_name: 'Website Visitor',
        channel: 'website',
        intent: 'inquiry',
        status: 'active'
      })
      .select()
      .single()

    if (data) {
      setConversationId(data.id)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !conversationId || loading) return

    // Add user message to UI immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Call Supabase Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            merchant_id: merchantId,
            conversation_id: conversationId,
            visitor_name: 'Customer',
            message: input
          })
        }
      )

      const data = await response.json()

      if (data.success) {
        // Add AI response to UI
        const aiMessage: Message = {
          id: Date.now().toString(),
          role: 'ai',
          content: data.reply,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMessage])

        // Log actions
        if (data.actions && data.actions.length > 0) {
          console.log('AI Actions taken:', data.actions)
        }
      } else {
        // Show error
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'ai',
          content: `Sorry, I encountered an error: ${data.error}`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'ai',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat-widget">
      {/* Message list */}
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form onSubmit={sendMessage}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: Date
}
```

---

## 7️⃣ DATABASE SCHEMA ADDITION

### Add AI Config Table

```sql
CREATE TABLE ai_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid REFERENCES merchants(id),
  openai_api_key text,  -- Encrypted in production
  openai_model text DEFAULT 'gpt-4',
  temperature decimal DEFAULT 0.7,
  max_tokens integer DEFAULT 500,
  system_prompt text,
  data_sources jsonb DEFAULT '{"products": true, "bookings": true, "faqs": true}',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  UNIQUE(merchant_id)
);

-- For production, use pgcrypto for encryption:
-- ALTER TABLE ai_config ADD COLUMN openai_api_key_encrypted bytea;
-- UPDATE ai_config SET openai_api_key_encrypted = pgp_sym_encrypt(openai_api_key, 'secret-key');
```

---

## 8️⃣ DEPLOYMENT STEPS (token.ai.vn)

### Step 1: Deploy Edge Function

```bash
# From your project root
supabase functions deploy ai-chat

# You should see:
# ✓ Function deployed successfully
# HTTP endpoint: https://your-project.supabase.co/functions/v1/ai-chat
```

### Step 2: Verify token.ai.vn API Connection

```bash
# Test the function with token.ai.vn
curl -X POST https://your-project.supabase.co/functions/v1/ai-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{
    "merchant_id": "merchant_1",
    "conversation_id": "conv-123",
    "visitor_name": "Test User",
    "message": "Can I book a massage?"
  }'

# Expected response (from token.ai.vn):
{
  "success": true,
  "reply": "Of course! We have several massage slots available...",
  "actions": [...],
  "timestamp": "2025-01-26T10:30:00Z"
}
```

### Step 3: Troubleshoot token.ai.vn Connection

If you get error like "Invalid API key" or "Unauthorized":

1. Check your token.ai.vn API key is correct:
   ```bash
   # Copy exactly from token.ai.vn dashboard, no extra spaces
   TOKEN_AI_API_KEY=your-token-ai-key-here
   ```

2. Verify token.ai.vn endpoint is correct:
   ```
   Base URL: https://api.token.ai.vn
   Chat endpoint: https://api.token.ai.vn/v1/chat/completions
   ```

3. Test token.ai.vn API directly (outside Supabase):
   ```bash
   curl https://api.token.ai.vn/v1/chat/completions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN_AI_KEY" \
     -d '{
       "model": "gpt-4",
       "messages": [{"role": "user", "content": "Hello"}]
     }'
   ```

4. If token.ai.vn API works but Supabase doesn't:
   - Re-deploy with `supabase functions deploy ai-chat`
   - Check Supabase Edge Function logs in dashboard

1. Go to Chat Widget on your app
2. Type a message
3. Should see AI response from OpenAI
4. Check Supabase database → `messages` table for saved messages
5. Check `ai_task_logs` table for detected actions

---

## 9️⃣ TESTING CHECKLIST

- [ ] Environment variables set in Supabase
- [ ] Edge Function deployed successfully
- [ ] Chat widget sends message to Edge Function
- [ ] OpenAI API key is valid
- [ ] AI returns response in < 5 seconds
- [ ] Messages saved to Supabase `messages` table
- [ ] Task logs saved to `ai_task_logs` table
- [ ] System prompt includes merchant data (products, slots, FAQs)
- [ ] AI can suggest booking slots
- [ ] AI can answer FAQ questions
- [ ] Manual merchant reply works
- [ ] Conversation history loaded correctly
- [ ] Real-time updates work (Supabase subscriptions)
- [ ] Error handling shows graceful messages
- [ ] Mobile view works (responsive)

---

## 1️⃣0️⃣ ADVANCED FEATURES (Optional Future Enhancements)

### A. Persistent System Prompt (Settings Page)

Allow merchant to customize AI behavior:

```typescript
// In Settings/AIConfiguration.tsx
const [systemPrompt, setSystemPrompt] = useState('')

const saveSystemPrompt = async () => {
  await supabase
    .from('ai_config')
    .upsert({
      merchant_id: session.org.id,
      system_prompt: systemPrompt
    })
}
```

### B. Booking Creation Action

Detect when AI should create booking:

```typescript
// In Edge Function
if (aiMessage.includes("booking confirmed") || aiMessage.includes("booked for")) {
  // Extract date/time and create booking
  const { data: booking } = await supabase
    .from('bookings')
    .insert({
      conversation_id,
      merchant_id,
      visitor_name,
      date: extractedDate,
      time: extractedTime,
      status: 'confirmed'
    })
    .select()
    .single()
  
  actions.push({
    type: 'booking_created',
    title: 'Booking created',
    details: { booking_id: booking.id, date: extractedDate, time: extractedTime },
    status: 'success'
  })
}
```

### C. Order Creation Action

Similar to booking but for e-commerce:

```typescript
// Detect product purchase intent
if (aiMessage.includes("purchased") || aiMessage.includes("order")) {
  await supabase.from('orders').insert({...})
}
```

### D. Multi-language Support

```typescript
const systemPrompt = buildSystemPromptInLanguage(
  context,
  visitorName,
  detectedLanguage || 'en'
)
```

---

## 1️⃣1️⃣ TROUBLESHOOTING

### Issue: "token.ai.vn API returns 401 Unauthorized"
**Solution:** 
- Verify token.ai.vn API key format in Supabase secrets
- Ensure no extra spaces or line breaks in key
- Regenerate new key from token.ai.vn dashboard if needed
- Check token.ai.vn account has API access enabled

### Issue: "token.ai.vn API returns 429 (Rate Limited)"
**Solution:**
- token.ai.vn has rate limits (check their pricing tier)
- Implement request queuing in Edge Function
- Add exponential backoff for retries
- Upgrade token.ai.vn plan if needed

### Issue: "Edge Function timeout"
**Solution:**
- OpenAI API calls take 2-5 seconds
- Increase Edge Function timeout in Supabase settings
- Cache merchant context to reduce load time

### Issue: "Messages not saving to database"
**Solution:**
- Check RLS policies on `messages` and `ai_task_logs` tables
- Ensure RLS is disabled for demo (as per original schema)
- Verify conversation_id exists in conversations table

### Issue: "Supabase real-time not working"
**Solution:**
- Enable real-time for `messages` table in Supabase dashboard
- Ensure WebSocket connection is open
- Check browser console for connection errors

---

## 1️⃣2️⃣ FINAL REQUIREMENTS

### For You (Merchant/Developer):

1. ✅ Get OpenAI API key from https://platform.openai.com/api-keys
2. ✅ Add environment variables to Supabase dashboard
3. ✅ Run `supabase functions deploy ai-chat`
4. ✅ Test with curl or Postman
5. ✅ Update ChatWidget component with new Edge Function URL

### For Your AI Coding Agent:

1. ✅ Generate Edge Function code (provided above)
2. ✅ Create ai_config table in Supabase
3. ✅ Update ChatWidget to call Edge Function
4. ✅ Add task detection logic in Edge Function
5. ✅ Implement error handling and logging

---

## 1️⃣3️⃣ ARCHITECTURE SUMMARY (token.ai.vn Edition)

```
WORKFLOW WHEN CUSTOMER SENDS MESSAGE:

1. Customer types in Chat Widget (frontend)
2. Frontend sends POST to Supabase Edge Function (/ai-chat)
3. Edge Function receives request
4. Loads merchant context (products, slots, FAQs)
5. Builds dynamic system prompt with merchant data
6. Loads conversation history
7. Calls token.ai.vn API (https://api.token.ai.vn/v1/chat/completions)
   └─ Using Bearer TOKEN_AI_API_KEY for authentication
8. token.ai.vn returns response (OpenAI-compatible format)
9. Edge Function detects actions (booking, product, FAQ)
10. Saves message to Supabase (messages table)
11. Saves action logs to Supabase (ai_task_logs table)
12. Returns response + actions to frontend
13. Frontend displays message immediately
14. Real-time subscription updates Conversations page
15. Merchant sees task log in Conversations panel

TOTAL TIME: 2-5 seconds end-to-end
COST: Pay token.ai.vn per token used (cheaper than OpenAI official API)
```

**Key Difference:**
- OpenAI official: `https://api.openai.com/v1/chat/completions`
- token.ai.vn wholesale: `https://api.token.ai.vn/v1/chat/completions`
- Everything else: 100% identical (same API format, same models, same response format)

---

## 1️⃣4️⃣ FINAL INSTRUCTION

**For You:**
1. Get OpenAI API key (free trial $5 credit)
2. Add key to Supabase dashboard
3. Tell your AI coding agent to implement the Edge Function code

**For Your AI Coding Agent:**
1. Implement the Edge Function (`supabase/functions/ai-chat/index.ts`)
2. Update ChatWidget component
3. Add ai_config table to schema
4. Test with provided curl command
5. Verify messages and task logs appear in database

**THEN:**
- Chat widget will actually work with real AI
- Merchant data (products, slots, FAQs) will be used for context
- Actions will be detected and logged
- System is production-ready

**GO LIVE WITH REAL AI NOW!**