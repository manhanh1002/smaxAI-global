# 🔥 SMAX AI - MASTER PROMPT (CORRECTED LOGIC v2.0)

**IMPORTANT:** This is a DEMO for angel investors. Focus on **clarity and impact**, not completeness.

---

## 1️⃣ PROJECT CONTEXT (CRITICAL MINDSET)

### What is Smax AI?

Smax AI is a **conversational commerce platform** that:

1. **Embeds an AI chatbot** into a merchant's website
2. **Reads merchant data** (products, booking slots, FAQs)
3. **Chats with customers** about their needs
4. **Takes actions** (creates bookings, logs orders)
5. **Provides audit logs** so merchants can see what AI did

### What is this demo?

A **visual proof-of-concept** showing:
- How fast merchants can set up AI
- How AI understands their business
- How AI drives real actions (bookings, orders)
- How merchants control and monitor the AI

### What is NOT included?

- Real payment processing
- Multi-agent orchestration
- Complex backend infrastructure
- CRM integrations
- Production authentication

---

## 2️⃣ AUDIENCE & FIRST IMPRESSION

**Target:** Angel investors, SaaS partners, non-technical stakeholders

**Goal:** Understand Smax AI's value in **3–5 minutes**

**First impression (Critical!):**
- User lands on a simple login
- Completes quick onboarding (5 steps, 2 minutes)
- Sees a beautiful dashboard with AI status
- Clicks "Try Chat Widget" → embedded AI chatbot appears
- AI chats naturally, references merchant data, takes actions
- User sees a conversation log showing what AI did

**Investor takeaway:**
> "This is production-ready, scalable, and solves a real merchant problem."

---

## 3️⃣ DATA MODEL (SIMPLIFIED)

### Tables (Supabase)

Only these tables matter:

```sql
merchants (id, name, website, business_type, created_at)

products (id, merchant_id, name, description, price, created_at)

booking_slots (
  id, merchant_id, date, time, duration_minutes, 
  capacity, booked_count, created_at
)

faqs (id, merchant_id, question, answer, category, created_at)

conversations (
  id, merchant_id, visitor_name, channel, 
  intent, status, created_at, ended_at
)

messages (
  id, conversation_id, role, content, 
  action_type, action_data, created_at
)
```

**Key constraint:** RLS is DISABLED. No complex permissions.

---

## 4️⃣ AUTHENTICATION (SIMPLIFIED)

### Session Model

DO NOT use Supabase Auth or OAuth.

Instead:

1. Create a **fake session object** stored in localStorage:

```javascript
{
  isLoggedIn: true,
  user: { id, email, name },
  merchant: { id, name, business_type, website },
  sessionExpiresAt: timestamp
}
```

2. On app load:
   - Check localStorage for valid session
   - If valid → render dashboard
   - If invalid → render login page

3. Login flow:
   - User enters email
   - Click "Continue" → create fake session
   - Redirect to onboarding or dashboard

---

## 5️⃣ FEATURE AREAS (CORRECT RESPONSIBILITIES)

### 🟦 Area 1: ONBOARDING (First-time only)

**When it appears:**
- User logs in for the first time
- Displays as a full-screen wizard (replaces dashboard)
- Cannot be dismissed until completed or explicitly skipped

**What it does:**
- Collects merchant business info
- Collects merchant data (products, slots, FAQs)
- Triggers "Train AI" action
- Redirects to dashboard on completion

**Structure:**

```
STEP 1: Business Information
├─ Business name (text input)
├─ Website URL (text input)
├─ Business type (dropdown: spa, restaurant, clinic, ecom, other)
└─ [Next] button

STEP 2: Training Data
├─ Products CRUD (table with add/edit/delete)
├─ Booking slots CRUD (table with add/edit/delete)
├─ FAQs CRUD (list with add/edit/delete modals)
└─ [Next] button

STEP 3: Go Live
├─ "Train AI" button
├─ Fake progress bar (0-100% over 3 seconds)
├─ Success state with next steps
└─ [Go to Dashboard] button
```

**Key principle:** User should feel they've set up a real AI in < 5 minutes.

---

### 🟦 Area 2: DASHBOARD (Main view after onboarding)

**What it shows:**
- AI system status (Active, Training Done)
- Active channels (Website)
- KPI cards (fake but realistic):
  - Conversations handled today
  - Bookings created by AI
  - Orders created by AI
- Quick action buttons

**What it does NOT show:**
- Chat sessions (that's in Conversations page)
- Individual messages (that's in Conversations page)
- Detailed analytics (that's a placeholder)

**Visual hierarchy:**
```
[Dashboard]
├─ Hero: "AI Status: Active ✓"
├─ Status cards (4 cards in 2x2 grid)
│  ├─ AI System: Active
│  ├─ Training: Complete
│  ├─ Website Chat: Live
│  └─ Channels: 1 Active
├─ KPI section (3 metric cards)
│  ├─ Conversations today: 12
│  ├─ Bookings created: 3
│  └─ Orders created: 5
└─ Quick actions
   ├─ [Try Chat Widget] primary button
   ├─ [View Setup Data] link
   └─ [See Conversations] link
```

**Important:** Dashboard should load in < 1 second. Use hardcoded fake data if needed.

---

### 🟦 Area 3: CHANNELS (Channel management)

**Available channels:**
- Website Chat (fully built)
- Facebook Messenger (coming soon - placeholder)
- Instagram (coming soon - placeholder)
- WhatsApp (coming soon - placeholder)

**Website Chat tab:**

What it shows:
- Chat widget preview (live iframe or fake preview)
- Embed script (clickable copy button)
- Channel status indicator
- Configuration options

What it does:
- Copy embed code → merchant pastes on their website
- Show that widget is "live"
- Link to conversation logs

What it does NOT do:
- Show analytics for the channel
- Show customer chat inside dashboard
- Serve as a test interface for the widget

**Example visualization:**
```
CHANNELS
├─ Website Chat [ACTIVE]
│  ├─ Status: Live ✓
│  ├─ Embed script: [Copy Code]
│  └─ Preview: [iframe showing chat widget]
│
├─ Facebook Messenger [COMING SOON]
├─ Instagram [COMING SOON]
└─ WhatsApp [COMING SOON]
```

---

### 🟦 Area 4: CONVERSATIONS (Chat session logs)

**What it is:**
A table of ALL chat sessions between customers and AI.

Each row represents ONE conversation:

```
Visitor     │ Channel │ Intent  │ Last Message        │ AI Action       │ Status
────────────┼─────────┼─────────┼────────────────────┼─────────────────┼──────────
John D.     │ Website │ Booking │ "Tomorrow at 2 PM?" │ Created booking │ ✓ Done
Sarah M.    │ Website │ Order   │ "Do you have X?"    │ Suggested item  │ ✓ Done
Mike L.     │ Website │ Support │ "How to return?"    │ Sent FAQ        │ Escalated
Emma R.     │ Website │ Booking │ "Weekend slots?"    │ Created booking │ ✓ Done
```

**Click a row → view:**
- Full chat transcript
- AI actions taken (with details)
- Option to manually override/edit if needed

**Filters:**
- By intent (Booking, Order, Question, etc.)
- By status (AI handled, Escalated, Active)
- By date range

**Important:** This is NOT analytics. It's activity logs showing merchant what AI did.

---

### 🟦 Area 5: ORDERS (AI-created orders)

**What it is:**
A log of orders created by AI from customer conversations.

Table:
```
Order ID │ Customer  │ Product      │ Qty │ Channel │ Created by AI │ Status
─────────┼───────────┼──────────────┼─────┼─────────┼──────────────┼──────
#ORD-001 │ John D.   │ Massage (1h) │ 1   │ Website │ ✓             │ Active
#ORD-002 │ Sarah M.  │ Face Cream   │ 2   │ Website │ ✓             │ Pending
#ORD-003 │ Mike L.   │ Shampoo      │ 1   │ Website │ ✓             │ Completed
```

**Click a row → view:**
- Conversation that led to this order
- Order details
- Customer info
- Manual override option

**Filters:** By status, date, channel

---

### 🟦 Area 6: BOOKINGS (AI-created bookings)

**What it is:**
A log of booking slots booked by AI.

Table:
```
Booking ID │ Customer │ Service       │ Date       │ Time    │ Status
───────────┼──────────┼───────────────┼────────────┼─────────┼──────────
#BK-001    │ John D.  │ Massage (1h)  │ 2025-01-27 │ 2:00 PM │ Confirmed
#BK-002    │ Sarah M. │ Facial (1h)   │ 2025-01-28 │ 10:00 AM│ Pending
#BK-003    │ Emma R.  │ Hair Cut (30m)│ 2025-01-29 │ 3:00 PM │ Confirmed
```

**Click a row → view:**
- Conversation that led to booking
- Booking details & customer info
- Cancel/modify options

**Where bookings come from:**
- Created during onboarding (merchant defines slots)
- Filled by AI during conversations (AI books available slots)

---

### 🟦 Area 7: AI TRAINING (Post-onboarding editing)

**What it is:**
The place where merchants can EDIT their training data AFTER onboarding.

Includes the same forms as onboarding:
- Business information
- Products CRUD
- Booking slots CRUD
- FAQs CRUD

**When it's used:**
- Merchant wants to add new products
- Merchant wants to edit booking slots
- Merchant wants to update FAQs

**Important:** This is NOT a wizard. It's a simple admin panel.

---

### 🟦 Area 8: CHAT WIDGET (Embedded on merchant website)

**What it is:**
A **floating chat UI** that appears on the merchant's website (NOT in the dashboard).

**Where it lives:**
- On `merchant-website.com` (via embed script)
- NOT inside the Smax AI dashboard

**How merchant tests it:**
1. Go to Channels → Website Chat
2. Click preview or copy embed code
3. Paste on test website
4. Chat widget appears in bottom-right
5. Open widget and chat

**Widget behavior:**

```
┌─────────────────────────────────────┐
│ Smax AI Assistant        [_] [x]    │
├─────────────────────────────────────┤
│ Hi! How can I help?                 │
│                                     │
│ Customer: I want to book tomorrow   │
│                                     │
│ AI: Great! What service?            │
│ [Massage] [Facial] [Hair Cut]       │
│                                     │
│ Customer: Massage, 2 PM             │
│                                     │
│ AI: Perfect! I have 2 PM available. │
│ [Confirm Booking] [Other times]     │
│                                     │
│ ┌──────────────────────────────┐   │
│ │ Your message...          [→] │   │
│ └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Key features:**
- Floating button in bottom-right
- Opens/closes smoothly
- Shows typing indicator while AI thinks
- Displays suggested action buttons
- Stores conversation in database

**AI workflow inside widget:**

```
Customer message → Edge Function
  ↓
Analyze intent (booking? order? question?)
  ↓
Look up merchant data (products, slots, FAQs)
  ↓
Generate response using LLM
  ↓
Check if AI should take action (create booking, log order, etc.)
  ↓
Save message & action to database
  ↓
Return response + suggested actions
  ↓
Widget displays response
```

**Important:** Widget data flows DIRECTLY to database. It's not simulated.

---

## 6️⃣ GLOBAL NAVIGATION (After onboarding)

**Sidebar menu:**

```
SMAX AI
├─ Dashboard
├─ Channels
│  ├─ Website Chat
│  ├─ Facebook Messenger (Coming soon)
│  ├─ Instagram (Coming soon)
│  └─ WhatsApp (Coming soon)
├─ Conversations
├─ Orders
├─ Bookings
├─ AI Training
├─ Analytics (Placeholder)
└─ Settings
```

**Important:**
- Navigation appears AFTER onboarding completes
- Onboarding REPLACES the entire screen, not a modal
- All nav items visible, but some are "Coming soon" placeholders
- This creates impression of a full SaaS platform

---

## 7️⃣ AI BEHAVIOR (NOT COMPLEX)

### What AI can do:

1. **Understand merchant data:**
   - Read products, prices, descriptions
   - Read booking slots, availability
   - Read FAQs and policies

2. **Chat naturally:**
   - Answer questions about services
   - Ask qualifying questions
   - Suggest relevant products/times

3. **Take actions:**
   - Create booking (reserve slot, save to database)
   - Log order intent (save to database, awaiting payment)
   - Record conversation (every message saved)

### What AI does NOT do:

- Process payments (not in scope)
- Generate reports (not needed for demo)
- Orchestrate multiple agents
- Use external APIs (except LLM)
- Learn or improve (static training)

### AI voice:

- Professional but friendly
- Merchant's tone (not generic AI)
- Vietnamese-fluent (important for demo)
- Action-oriented (books, suggests, confirms)

---

## 8️⃣ FAKE DATA & PLACEHOLDERS

### Use fake data for:

- KPI numbers on dashboard (hardcoded)
- Initial conversations (seeded in DB or shown as examples)
- Merchant profile (pre-populated during onboarding)

### When to load real data:

- Products, slots, FAQs (user-entered during onboarding)
- Conversations, messages (created during widget usage)
- Orders, bookings (created by AI actions)

### Placeholders:

- Analytics page (shows "Coming soon" message)
- Facebook, Instagram, WhatsApp (show "Coming soon" cards)
- Payment history (not included in demo)

---

## 9️⃣ CRITICAL CONSTRAINTS (DO NOT VIOLATE)

### 🚫 DO NOT:

1. **Move chat widget into dashboard**
   - Widget lives on merchant website only
   - Dashboard shows conversation logs, NOT chat
   - Users do NOT chat inside the dashboard

2. **Turn conversations into analytics**
   - Conversations page = activity log
   - NOT pie charts, trends, or metrics
   - Show what AI did, not how often it did it

3. **Add complex AI orchestration**
   - Single LLM call per message
   - No multi-step workflows or agents
   - No decision trees or rule engines

4. **Require real authentication**
   - Fake localStorage sessions only
   - No login form fields validation (just email check)
   - No password recovery, MFA, etc.

5. **Add backend infrastructure**
   - Supabase + Edge Functions only
   - NO separate Node/Python servers
   - NO message queues, caching layers, etc.

### ✅ DO:

1. **Make it feel REAL**
   - Smooth animations
   - Loading states
   - Error handling
   - Real data when user provides it

2. **Prioritize CLARITY**
   - Each screen has one job
   - Navigation is obvious
   - Data relationships are explicit

3. **Show IMPACT**
   - Dashboard KPIs visible immediately
   - Conversations show AI actions taken
   - Orders/bookings logged and traced

4. **Respect TIME**
   - Onboarding < 5 minutes
   - Setup wizard obvious and fast
   - No "admin clutter" screens

---

## 1️⃣0️⃣ DEMO SCRIPT (How investor should experience it)

```
MINUTE 1: Login & Onboarding
  ├─ Investor sees login page
  ├─ Enters email, clicks "Continue"
  ├─ Sees setup wizard step 1 (business info)
  └─ Proceeds through steps 2-3 (data + training)

MINUTE 2: Dashboard
  ├─ Setup complete, AI trained
  ├─ Dashboard shows AI status: Active ✓
  ├─ KPIs show fake results (looks impressive)
  └─ Investor impressed: "This is fast!"

MINUTE 3: Try Widget
  ├─ Click "Try Chat Widget" button
  ├─ Widget preview appears (or embedded demo)
  ├─ Investor types: "Can I book tomorrow?"
  ├─ AI responds: "Sure! What service?"
  ├─ Investor selects "Massage"
  ├─ AI confirms booking (saved to database)
  └─ Investor impressed: "It actually works!"

MINUTE 4: Conversations Log
  ├─ Investor clicks "View Conversations"
  ├─ Sees table with their chat session
  ├─ Clicks row → sees full transcript
  ├─ Sees "AI Action: Created booking"
  └─ Investor impressed: "I can audit what AI did!"

MINUTE 5: Conclusion
  ├─ "This is production-ready"
  ├─ "Can be deployed to real merchants"
  ├─ "ROI-positive in first month"
  └─ Investor wants to invest! 💰
```

---

## 1️⃣1️⃣ TECH STACK (IMMUTABLE)

```
Frontend:
  - React 18+
  - TypeScript
  - Vite
  - Tailwind CSS
  - Zustand (minimal state)
  - React Router (navigation)
  - Lucide React (icons)

Backend:
  - Supabase (PostgreSQL)
  - Supabase Edge Functions (AI runtime)
  - OpenAI API (LLM)

External:
  - None (no Auth0, Stripe, etc.)
```

---

## 1️⃣2️⃣ FILE STRUCTURE

```
smax-frontend/
├── src/
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── OnboardingWizard.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Channels.tsx
│   │   ├── Conversations.tsx
│   │   ├── Orders.tsx
│   │   ├── Bookings.tsx
│   │   ├── AITraining.tsx
│   │   ├── Analytics.tsx
│   │   └── Settings.tsx
│   ├── components/
│   │   ├── ChatWidget.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Navbar.tsx
│   │   └── common/
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── store.ts (Zustand)
│   │   └── api.ts
│   └── App.tsx
└── public/
```

---

## 1️⃣3️⃣ SUCCESS CRITERIA

**Demo is successful when:**

- [ ] Investor can onboard in 2 minutes without questions
- [ ] AI widget responds naturally to booking requests
- [ ] Conversation logs show real data from database
- [ ] Investor understands product value without explanation
- [ ] "This feels like a real SaaS product" comment appears
- [ ] Investor asks "When can we use this with real merchants?"

---

## 1️⃣4️⃣ FINAL INSTRUCTION

Build this demo with the following mindset:

> "Every screen, button, and interaction must directly support the investor's understanding that Smax AI is a production-ready, merchant-focused, AI-powered conversational commerce platform."

**START CODING NOW.**