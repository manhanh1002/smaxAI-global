# 🔥 SMAX AI - CONVERSATIONS & AI INTEGRATION REDESIGN PROMPT

## CRITICAL CHANGE: Conversations Page UI Overhaul

The current Conversations page is **WRONG**. It needs a complete redesign to match real chat management systems (like Intercom, HubSpot, Messenger).

---

## 1️⃣ NEW CONVERSATIONS PAGE ARCHITECTURE

### Layout (3-Column Structure)

```
┌─────────────────────────────────────────────────────────────┐
│ Left Panel      │    Center Panel    │    Right Panel        │
│ (Conversations) │   (Chat Thread)    │ (Customer Info)       │
│ 320px width     │   Fluid width      │ 380px width           │
├─────────────────┼────────────────────┼───────────────────────┤
│                 │                    │                       │
│ Search + Filter │ Chat messages      │ Customer Name         │
│                 │ between AI & user  │ Email / Phone         │
│ Conversation    │                    │ Avatar                │
│ List:           │ Message input box  │ Last visited date     │
│ - John Davis    │ (for manual reply) │                       │
│ - Sarah Miller  │                    │ AI TASK LOG:          │
│ - Mike Lewis    │                    │ ├─ Created booking    │
│ - Emma Roberts  │                    │ ├─ Suggested product  │
│ - ...           │                    │ ├─ Sent FAQ           │
│                 │                    │ └─ ...                │
│                 │                    │                       │
│ [+] New Conv    │                    │ Customer Actions:     │
│                 │                    │ [Call] [Tag] [Assign] │
└─────────────────┴────────────────────┴───────────────────────┘
```

---

## 2️⃣ LEFT PANEL: CONVERSATION LIST

### Design & Features

**Header:**
```
┌─────────────────────────────┐
│ Conversations (12)          │
│ [Search...] [Filter ▼]      │
└─────────────────────────────┘
```

**Each Conversation Item (when not selected):**
```
┌─────────────────────────────┐
│ 👤 John Davis               │
│ "Tomorrow at 2 PM?"         │  ← Last message preview
│ 5 min ago                   │  ← Time indicator
│ Website • Booking           │  ← Channel + Intent
└─────────────────────────────┘
```

**When Selected (Highlighted):**
- Blue background or subtle highlight
- Show as active in center panel

**Sorting & Filtering:**
- Filter dropdown: "All | AI Resolved | Escalated | Active"
- Search: by visitor name or message content
- Sort: "Newest | Oldest | Unread"
- Show unread badge (red dot) if new messages

**Visual Indicators:**
- 🟢 Green dot = Active conversation (real-time)
- 🔵 Blue dot = Unread messages
- ✅ Check = Resolved by AI
- ⚠️ Orange = Escalated to human
- 📌 Pin = Important conversation

**Actions on hover:**
- Archive button
- Delete button
- "View Details" link

---

## 3️⃣ CENTER PANEL: LIVE CHAT THREAD

### Message Display

**AI Message:**
```
┌────────────────────────────┐
│ 🤖 AI Assistant            │
│ (12:30 PM)                 │
│                            │
│ Great! I have a 2 PM slot  │
│ available tomorrow. What   │
│ service would you prefer?  │
│                            │
│ [Massage] [Facial] [Hair]  │  ← Suggested actions
└────────────────────────────┘
```

**User Message:**
```
┌────────────────────────────┐
│ (12:29 PM) John Davis  👤  │
│                            │
│ Can I book tomorrow at 2PM?│
└────────────────────────────┘
```

**System Action Message:**
```
┌────────────────────────────┐
│ 🔔 System Log              │
│ (12:35 PM)                 │
│                            │
│ ✓ AI created booking       │
│   Date: Jan 27, 2:00 PM    │
│   Service: Massage (1h)    │
│   Confirmation sent to:    │
│   john@email.com           │
└────────────────────────────┘
```

### Message Input (Bottom of Center Panel)

```
┌────────────────────────────────────────┐
│ Message Input Box                      │
├────────────────────────────────────────┤
│ [Type a message...]           [📎] [📤] │  ← Attach file + Send
│ Shift+Enter to send                    │
└────────────────────────────────────────┘

OR (if conversation closed/escalated):
┌────────────────────────────────────────┐
│ ⚠️ This conversation is closed          │
│ [Reopen] [View Details]                │
└────────────────────────────────────────┘
```

**Manual Reply Feature:**
- Type message and click Send
- Message sent as "Merchant" (not AI)
- Saved to conversation thread
- Customer sees it in their chat widget
- No AI processing

### Real-time Updates

- Messages appear instantly (WebSocket or polling from Supabase)
- Typing indicator when customer is typing
- Read receipts (optional)
- Timestamps on every message

---

## 4️⃣ RIGHT PANEL: CUSTOMER INFO & TASK LOG

### Top Section: Customer Card

```
┌─────────────────────────────┐
│ [Avatar]  John Davis        │
│           john@email.com    │
│           +1 (555) 123-4567 │
│                             │
│ Last visited: 5 min ago     │
│ First visit: Jan 15, 2025   │
│ Visit count: 3              │
│                             │
│ [Call] [Email] [Tag] [More] │
└─────────────────────────────┘
```

**Customer Data Points:**
- Name
- Email
- Phone number
- Avatar
- Last visited
- First visit
- Total visits
- Action buttons

### Middle Section: AI TASK LOG

**Critical Feature:** Shows every action AI took with this customer

```
┌─────────────────────────────┐
│ AI Task Log                 │
├─────────────────────────────┤
│ 12:35 PM                    │
│ ✅ BOOKING CREATED          │
│ Date: Jan 27, 2025          │
│ Time: 2:00 PM               │
│ Service: Massage (1h)       │
│ Status: Confirmed           │
│ 👉 [View Booking]           │
│                             │
│ 12:33 PM                    │
│ 🎯 PRODUCT SUGGESTED        │
│ Item: Premium Massage Oil   │
│ Price: $25                  │
│ Status: Not purchased       │
│                             │
│ 12:30 PM                    │
│ 📄 FAQ SENT                 │
│ Topic: Cancellation Policy  │
│ Read: Yes                   │
│                             │
│ 12:28 PM                    │
│ 💬 CONVERSATION STARTED     │
│ Channel: Website Chat       │
│ Intent: Booking             │
│                             │
│ [Load more...]              │
└─────────────────────────────┘
```

**Task Log Data Structure:**
```typescript
interface TaskLog {
  timestamp: Date
  type: 'booking_created' | 'order_created' | 'faq_sent' | 'product_suggested' | 'conversation_started'
  details: {
    title: string
    metadata: object
    status: 'success' | 'pending' | 'failed'
    link?: string // Link to related order/booking
  }
}
```

**Each task shows:**
- Timestamp
- Task type (icon + label)
- Relevant details (product name, booking date, FAQ topic, etc.)
- Status indicator
- Link to view full details (if applicable)

---

## 5️⃣ INTERACTIONS & BEHAVIOR

### Conversation Flow

1. **Merchant enters Conversations page**
   - List of all customer conversations loads
   - Most recent conversation selected by default
   - Chat thread and customer info appear on right

2. **Merchant clicks a conversation**
   - Center and right panels update
   - Task log shows all AI actions with this customer
   - Merchant can read chat or scroll back in history

3. **New message arrives (real-time)**
   - Notification badge appears on conversation in left panel
   - If conversation already selected, message appears immediately in center panel
   - Typing indicator shows customer is typing

4. **Merchant manually replies**
   - Type in message input box
   - Click Send or Shift+Enter
   - Message appears as "Merchant" message (different color/style)
   - Customer receives in their widget
   - AI is NOT involved in manual replies

5. **Merchant escalates conversation**
   - Right-click conversation or click "..." menu
   - Option: "Mark as Escalated"
   - Status changes to ⚠️ Escalated
   - Message input disables (or shows "Escalated" state)

6. **Merchant closes conversation**
   - Click "Close" or "Mark as Resolved"
   - Conversation moves to history
   - Can still view but marked as closed

---

## 6️⃣ DATABASE SCHEMA (ADDITIONS)

```sql
-- Add to existing 'messages' table:
messages {
  id: uuid
  conversation_id: uuid (FK)
  role: enum('visitor', 'ai', 'merchant')  -- NEW: 'merchant' for manual replies
  content: string
  action_type?: enum('booking_created', 'order_created', 'faq_sent', etc.)
  action_data?: jsonb  -- Details of action taken
  created_at: timestamp
}

-- Add to existing 'conversations' table:
conversations {
  id: uuid
  merchant_id: uuid (FK)
  visitor_name: string
  visitor_email?: string
  visitor_phone?: string
  channel: enum('website', 'facebook', 'instagram', 'whatsapp')
  intent: enum('booking', 'order', 'question', 'complaint', 'other')
  status: enum('active', 'resolved_by_ai', 'escalated', 'closed')
  ai_enabled: boolean (default true)
  created_at: timestamp
  ended_at?: timestamp
  updated_at: timestamp
}

-- NEW table for task logs:
ai_task_logs {
  id: uuid
  conversation_id: uuid (FK)
  merchant_id: uuid (FK)
  task_type: enum('booking_created', 'order_created', 'faq_sent', 'product_suggested', 'conversation_started')
  task_title: string
  task_details: jsonb
  task_status: enum('success', 'pending', 'failed')
  related_booking_id?: uuid (FK to bookings)
  related_order_id?: uuid (FK to orders)
  created_at: timestamp
}
```

---

## 7️⃣ NEW SETTINGS PAGE: AI CONFIGURATION

**CRITICAL ADDITION:** Settings page needs OpenAI API key input section.

### Settings Navigation (New Page)

```
SETTINGS
├─ General
├─ AI Configuration  ← NEW
├─ Channels
├─ Billing
└─ Team
```

### AI Configuration Section

```
┌──────────────────────────────────────┐
│ AI Configuration                     │
├──────────────────────────────────────┤
│                                      │
│ OpenAI API Key                       │
│ ┌──────────────────────────────────┐ │
│ │ sk-proj-...                      │ │ (masked)
│ └──────────────────────────────────┘ │
│ [Change Key] [Test Connection]       │
│                                      │
│ ✓ API Connected                      │
│ Last verified: 2 minutes ago         │
│                                      │
│ AI Model Selection                   │
│ [GPT-4] [GPT-4 Turbo] [GPT-3.5]     │ (dropdown)
│                                      │
│ Temperature (Creativity)             │
│ [====●========] 0.7                  │ (slider)
│ Lower = More factual, Higher = More creative
│                                      │
│ Max Tokens Per Response              │
│ [500 ▼]                              │ (dropdown)
│                                      │
│ System Prompt (AI Behavior)          │
│ ┌──────────────────────────────────┐ │
│ │ You are a helpful sales assistant│ │
│ │ for [Business Name]. You have    │ │
│ │ access to the merchant's products│ │
│ │ and booking slots. Always be     │ │
│ │ professional and helpful.        │ │
│ │                                  │ │
│ │ [Edit] [Reset to Default]        │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Data Sources (Enabled by default)   │
│ ☑ Products from catalog            │
│ ☑ Booking slots & availability     │
│ ☑ FAQs & Policies                  │
│ ☑ Customer order history           │
│ ☑ Company policies                 │
│                                      │
│ [Save Changes] [Discard]             │
│                                      │
└──────────────────────────────────────┘
```

### Settings Data Schema

```typescript
interface AIConfig {
  merchant_id: string
  openai_api_key: string (encrypted in DB)
  openai_model: 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo'
  temperature: number (0-1)
  max_tokens: number
  system_prompt: string
  data_sources: {
    products_enabled: boolean
    bookings_enabled: boolean
    faqs_enabled: boolean
    order_history_enabled: boolean
    policies_enabled: boolean
  }
  created_at: timestamp
  updated_at: timestamp
}
```

---

## 8️⃣ AI ENGINE INTEGRATION (Edge Function Logic)

### When Customer Sends Message via Widget

```
1. Widget captures customer message
   ↓
2. POST to Edge Function:
   {
     merchant_id: string
     conversation_id: string
     message: string
     visitor_name: string
   }
   ↓
3. Edge Function:
   ├─ Load merchant AI config from Settings (including OpenAI key)
   ├─ Fetch merchant data from DB:
   │  ├─ Products
   │  ├─ Booking slots (available only)
   │  ├─ FAQs & Policies
   │  ├─ Customer conversation history (last 5 messages)
   │  └─ Previous orders (if known customer)
   ├─ Build system prompt with merchant context:
   │  "You are assisting customers for [Business Name]
   │   You have access to:
   │   - Products: [list with prices]
   │   - Available slots: [dates & times]
   │   - Policies: [returns, cancellations]
   │   Help customer book, buy, or get info."
   ├─ Call OpenAI API with:
   │  {
   │    model: config.openai_model,
   │    temperature: config.temperature,
   │    max_tokens: config.max_tokens,
   │    messages: [
   │      { role: 'system', content: system_prompt },
   │      ...conversation_history,
   │      { role: 'user', content: message }
   │    ]
   │  }
   ├─ Receive response from OpenAI
   ├─ Analyze response for actions:
   │  ├─ Is customer trying to book? → Extract date/time → Create booking
   │  ├─ Is customer asking about product? → Suggest product
   │  ├─ Is customer asking FAQ question? → Log FAQ sent
   │  └─ Escalate if confidence low
   ├─ Save message to DB (messages table)
   ├─ Save action log to DB (ai_task_logs table)
   ├─ Return response:
   │  {
   │    reply: string,
   │    actions: [
   │      {
   │        type: 'booking_created' | 'product_suggested' | etc.,
   │        data: {...}
   │      }
   │    ]
   │  }
   ↓
4. Widget receives response
   ├─ Display AI message
   ├─ Show action confirmation (if booking created, etc.)
   └─ Keep conversation flowing
   ↓
5. Merchant sees in Conversations page:
   ├─ New message from customer
   ├─ AI response
   ├─ Action logged in Task Log
   └─ Can manually reply or take further action
```

### System Prompt Template

```
You are a professional customer service & sales assistant for {MERCHANT_NAME}.
Your goal is to help customers book services, purchase products, and find information.

Available Services:
{PRODUCTS_LIST}

Available Booking Slots:
{BOOKINGS_LIST}

Company Policies:
{POLICIES_LIST}

Customer Context:
- First visit: {FIRST_VISIT_DATE}
- Total visits: {VISIT_COUNT}
- Previous purchases: {ORDER_COUNT}

Instructions:
1. Be helpful, professional, and friendly
2. Only recommend products/slots that are actually available
3. When customer shows booking intent, extract date/time and confirm
4. When customer shows purchase intent, confirm product and details
5. If unsure, ask clarifying questions
6. Always maintain conversation context
7. If customer needs human help (complex complaint, technical issue), offer escalation

Do not:
- Invent products or prices
- Offer unavailable slots
- Make promises about policies you don't know
- Be overly salesy
```

---

## 9️⃣ VALIDATION & ERROR HANDLING

### API Key Validation (Settings Page)

When merchant enters OpenAI API key:

```
1. User enters key in Settings
2. Click "Test Connection"
3. POST to Edge Function:
   {
     action: 'validate_openai_key',
     api_key: string
   }
4. Edge Function:
   ├─ Try to call OpenAI API with key
   ├─ If successful → return { success: true, model: string }
   ├─ If failed → return { success: false, error: string }
5. Frontend:
   ├─ If success → "✓ API Connected, ready to use GPT-4"
   ├─ If error → Show error message "Invalid API key: {error}"
   └─ Only allow Save if validation passes
```

### Task Log Error Handling

If AI action fails (e.g., can't create booking because slot is full):

```
Task Log shows:
┌──────────────────────────────┐
│ ⚠️ BOOKING FAILED            │
│ Timestamp: 12:35 PM          │
│ Reason: Slot is full         │
│ Suggested: Offer alternative │
│ Status: Failed               │
│ 👉 [View Details]            │
└──────────────────────────────┘
```

### Conversation Escalation

If AI confidence is low or customer requests human:

```
1. AI detects escalation trigger
2. Saves message with action: 'escalation_requested'
3. Edge Function returns: { escalate: true }
4. Widget shows: "Connecting you to a human..."
5. Merchant sees in Task Log:
   ├─ ⚠️ ESCALATION REQUESTED
   ├─ Reason: "Customer requested human support"
   └─ Status: Pending merchant response
6. Message input becomes available for merchant to reply
```

---

## 1️⃣0️⃣ CRITICAL IMPLEMENTATION NOTES

### Real-time Chat Updates

- Use Supabase real-time subscriptions (not polling)
- Subscribe to `messages` table for new messages
- Subscribe to `ai_task_logs` table for action updates
- Unsubscribe when conversation is closed

### Performance Considerations

- Load only last 50 messages initially
- "Load more" button to fetch earlier messages
- Lazy-load customer info (fetch when row selected)
- Cache merchant config & data sources

### Security

- OpenAI API key encrypted in database (use Supabase encryption)
- Never expose key in frontend or logs
- Validate merchant_id on every Edge Function call
- Rate limit API calls (max 5 messages/second per merchant)

### Data Persistence

- Every message saved to DB immediately
- Task logs persisted with full action details
- Conversation history accessible forever
- Archive old conversations (optional)

---

## 1️⃣1️⃣ FILE STRUCTURE UPDATES

```
src/
├── pages/
│   ├── Conversations.tsx          ← REDESIGNED
│   ├── Settings.tsx               ← UPDATED (AI Config added)
│   └── ...
├── components/
│   ├── ConversationsPanel/
│   │   ├── ConversationList.tsx   ← Left panel
│   │   ├── ChatThread.tsx         ← Center panel
│   │   ├── CustomerInfo.tsx       ← Right panel
│   │   ├── TaskLog.tsx            ← Task log display
│   │   └── MessageInput.tsx       ← Input box
│   ├── Settings/
│   │   ├── GeneralSettings.tsx
│   │   ├── AIConfiguration.tsx    ← NEW
│   │   └── ...
│   └── ...
├── lib/
│   ├── supabase.ts
│   ├── ai-service.ts              ← NEW (OpenAI integration)
│   └── ...
└── ...
```

---

## 1️⃣2️⃣ SUCCESS CRITERIA

✅ Conversations page has 3-column layout (list, chat, info)
✅ Real-time messages appear instantly
✅ Task log shows all AI actions with merchant
✅ Settings page has OpenAI API key input
✅ API key validation works
✅ Merchant can manually reply to customers
✅ System prompt includes merchant data automatically
✅ New messages trigger real-time updates
✅ Conversation history scrollable and persistent
✅ Can escalate or close conversations
✅ Task log links to related bookings/orders
✅ Mobile responsive (sidebar collapses on mobile)

---

## 1️⃣3️⃣ FINAL INSTRUCTION

This is a COMPLETE redesign of the Conversations page to match professional chat management UIs like Intercom.

The key changes:
1. **Three-column layout** replacing single-table view
2. **Live chat thread** showing actual conversation
3. **Task log** showing AI actions for transparency
4. **Manual reply** option for merchant control
5. **Settings integration** for OpenAI API key
6. **Real-time updates** via Supabase subscriptions

**START CODING NOW WITH THESE SPECIFICATIONS.**