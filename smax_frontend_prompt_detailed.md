# Smax AI - SaaS Frontend Demo Prompt (Enhanced)

You are a senior frontend engineer building a premium SaaS demo for angel investors. This is NOT for production - it's a visual proof-of-concept to demonstrate AI-powered booking automation.

---

## GOAL

Build a full-stack frontend demo (React + Vite + TypeScript) that connects to Supabase and demonstrates:
1. **Quick setup** - Merchant onboarding in 3 steps
2. **AI Intelligence** - Chat widget that understands booking intent
3. **Real Results** - Conversations and bookings tracked in real-time
4. **Investor Appeal** - Modern, polished UI that shows enterprise potential

---

## CRITICAL RULES

- **Frontend only** - NO backend code, NO MCP, NO Lambda/Edge functions beyond Supabase.
- **Use Supabase JS client** for all data operations.
- **FAKE authentication** - localStorage-based sessions (no Auth0, Cognito, Supabase Auth).
- **Focus on UX flow** - Investor should understand the value in < 10 seconds.
- **Hardcode demo data** where needed - Priority is demo flow, not data freshness.
- **Code must run immediately** - `npm install && npm run dev` should work without setup.

---

## TECH STACK (IMMUTABLE)

```
Frontend:
  - React 18+ with TypeScript
  - Vite (build tool)
  - Tailwind CSS v3+ (all styling)
  - Zustand (state management - ONLY for global session/chat)
  - React Router v6 (navigation)
  - Lucide React (icons)
  - Axios (HTTP calls)

Database:
  - Supabase PostgreSQL (via JS client)
  - RLS is DISABLED (for demo simplicity)

External APIs:
  - Supabase Edge Function (AI Chat)
  - Supabase Storage (optional for docs)
```

---

## ENV VARIABLES (MUST USE EXACTLY)

```env
VITE_SUPABASE_URL=http://supabasekong-cgw80cwwc0ocwgsswoo0gso0.42.96.13.252.sslip.io/
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2OTQxNDIyMCwiZXhwIjo0OTI1MDg3ODIwLCJyb2xlIjoiYW5vbiJ9.yNPbCiPoTdlBvabH-9-mAVe3kX1fW9ChSCnahulwexg
VITE_EDGE_CHAT_URL=http://supabasekong-cgw80cwwc0ocwgsswoo0gso0.42.96.13.252.sslip.io/functions/v1/chat
```

---

## DATABASE SCHEMA (ALREADY EXISTS)

```sql
merchants {
  id: uuid (primary key)
  name: string
  website: string
  business_type: enum('spa', 'clinic', 'restaurant', 'ecom', 'other')
  ai_trained: boolean
  created_at: timestamp
}

booking_slots {
  id: uuid
  merchant_id: uuid (FK)
  date: date
  time: time
  duration_minutes: integer (default 60)
  capacity: integer (default 1)
  booked_count: integer (default 0)
  is_available: boolean
  created_at: timestamp
}

faqs {
  id: uuid
  merchant_id: uuid (FK)
  category: string ('policies', 'products', 'services', 'general')
  question: string
  answer: string
  created_at: timestamp
}

conversations {
  id: uuid
  merchant_id: uuid (FK)
  visitor_id: string (fake for demo)
  visitor_name: string
  intent: enum('booking', 'inquiry', 'complaint', 'other')
  status: enum('active', 'resolved', 'escalated')
  created_at: timestamp
  ended_at: timestamp (nullable)
}

messages {
  id: uuid
  conversation_id: uuid (FK)
  role: enum('visitor', 'ai')
  content: string
  created_at: timestamp
}
```

---

## FAKE AUTH / SESSION MANAGEMENT

**DO NOT use Supabase Auth or any OAuth provider.**

Instead, implement a fake session system:

```typescript
// Session stored in localStorage with structure:
{
  isLoggedIn: boolean
  user: {
    id: string (e.g., "user_abc123")
    email: string
    name: string
  }
  org: {
    id: string (merchant_id from DB)
    name: string
    business_type: string
    website: string
  }
  sessionToken: string (fake JWT, optional)
  expiresAt: timestamp
}
```

**Login Flow:**
1. User enters email on login page
2. Click "Continue as Demo"
3. Create fake session, store in localStorage
4. Redirect to `/dashboard`
5. On logout, clear localStorage and redirect to login

**Session Validation:**
- Check localStorage on app load
- If session exists and not expired → render Dashboard
- If no session → redirect to login

---

## REQUIRED PAGES & DETAILED SPECS

### 1️⃣ LOGIN PAGE (`/login`)

**Purpose:** Entry point - demonstrate "quick onboarding"

**Visual Design:**
- Full-screen gradient background (blue → purple)
- Centered login card (400px width)
- Hero text above card: "Smax AI - Autonomous Customer Operator"
- Subheading: "Turn conversations into bookings. Automatically."

**Components:**
```
┌─────────────────────────────────────┐
│  Smax AI Logo (SVG or text)         │
│                                     │
│  "Autonomous Customer Operator"     │
│  "Turn conversations into bookings" │
│                                     │
│  Email Input Field                  │
│  [demo@smax.ai                    ] │
│                                     │
│  Name Input Field (Optional)        │
│  [Demo User                       ] │
│                                     │
│  [Continue as Demo] Button          │
│  (Blue gradient, full-width)        │
│                                     │
│  "This is a demo account - no data" │
│  (gray text, small)                 │
└─────────────────────────────────────┘
```

**Interactions:**
- Pre-fill email with "demo@smax.ai" (can change)
- Pre-fill name with "Demo User"
- On button click:
  - Validate email format (basic)
  - Create fake session with merchant_id "merchant_1"
  - Store in localStorage
  - Redirect to `/dashboard` with fade-in animation
  - Show brief "Welcome" toast notification

**API Calls:**
- None (pure frontend)

**Error States:**
- Invalid email → show inline error "Enter a valid email"
- Show success animation before redirect

---

### 2️⃣ DASHBOARD PAGE (`/dashboard`)

**Purpose:** Show merchant the AI's status and KPIs - "wow" factor in 5 seconds

**Visual Design:**
- Hero header with merchant name and greeting
- 4 status cards in 2x2 grid (AI Active, Training Complete, etc.)
- KPI section (Conversations, Bookings, this month)
- "Quick Actions" panel
- Large CTA button: "Try Chat Widget"

**Header Section:**
```
┌────────────────────────────────────────┐
│ Welcome, [Merchant Name]! 👋            │
│ Your AI assistant is handling booking  │
│ requests 24/7                          │
└────────────────────────────────────────┘
```

**Status Cards (4 cards, 2x2 grid):**
```
┌──────────────────┐  ┌──────────────────┐
│ 🤖 AI System    │  │ ✅ Training      │
│ Status: Active  │  │ Status: Complete │
│ (Green badge)   │  │ (Green badge)    │
└──────────────────┘  └──────────────────┘

┌──────────────────┐  ┌──────────────────┐
│ 💬 Chat Widget  │  │ 📊 Analytics    │
│ Status: Live    │  │ Status: Ready    │
│ (Green badge)   │  │ (Blue badge)     │
└──────────────────┘  └──────────────────┘
```

**KPI Section:**
```
┌─ THIS MONTH ────────────────────────────┐
│                                         │
│  Conversations: 47 ↑ +12%              │
│  Bookings Created: 23 ↑ +18%           │
│  Resolution Rate: 94% → (green)        │
│  Avg Response Time: 2.1s               │
│                                         │
└─────────────────────────────────────────┘
```

**Quick Actions Panel:**
```
┌─ NEXT STEPS ────────────────────────────┐
│                                         │
│  [Try Chat Widget] (Primary Button)     │
│  [View Setup Wizard] (Secondary)        │
│  [See Conversations] (Link)             │
│  [View API Docs] (Link)                 │
│                                         │
└─────────────────────────────────────────┘
```

**Data & Interactions:**
- All KPI numbers are **hardcoded fake data** (no need to query DB)
- Refresh button → fade out, show "Updated!" toast
- "Try Chat Widget" → Opens ChatWidget modal/sidebar
- Navigation links → Route to other pages
- Sidebar with navigation menu visible (always)

**Visual Polish:**
- Animate cards on load (stagger effect)
- Use icons from Lucide React
- Color-code status (green=active, blue=ready, gray=pending)
- Show a small chart/graph for conversation trends (fake data)

**API Calls:**
- Optional: GET `/merchants/{merchant_id}` to verify session (fail gracefully with fake data)

---

### 3️⃣ SETUP WIZARD (`/setup`)

**Purpose:** Guide merchant through 3-step AI setup - demonstrate customization

**Overall Design:**
- Vertical stepper on left (3 steps)
- Content panel on right (form/preview)
- Progress bar at top
- "Next" / "Back" / "Complete" buttons

**Layout:**
```
┌──────────────────────────────────────────────┐
│ Step 1 of 3: Business Information            │
│ ────────────────────────────────────────────│
│                                              │
│ ┌──────────┐  ┌──────────────────────────┐ │
│ │ Stepper  │  │ Form Content             │ │
│ │ 1. Info  │  │ ┌──────────────────────┐ │ │
│ │ 2. Data  │  │ Business Name          │ │ │
│ │ 3. Go    │  │ [Demo Spa & Wellness ] │ │ │
│ │    Live  │  │ ┌──────────────────────┐ │ │
│ │          │  │ Website                │ │ │
│ │          │  │ [www.demospa.com     ] │ │ │
│ │          │  │ ┌──────────────────────┐ │ │
│ │          │  │ Business Type          │ │ │
│ │          │  │ [Spa ▼]                │ │ │
│ │          │  │ ┌──────────────────────┐ │ │
│ │          │  │ Description (optional) │ │ │
│ │          │  │ [textarea...]          │ │ │
│ │          │  │                        │ │ │
│ │          │  │ [Back] [Next →]        │ │ │
│ └──────────┘  └──────────────────────────┘ │
└──────────────────────────────────────────────┘
```

#### **STEP 1: Business Information**

**Purpose:** Load and edit merchant profile

**Form Fields:**
- **Business Name** (text input, editable)
- **Website** (text input, editable)
- **Business Type** (dropdown: spa, clinic, restaurant, ecom, other)
- **Description** (textarea, optional)
- **Service Duration** (dropdown: 30, 60, 90 minutes) - for booking duration

**Data Loading:**
- On component mount: Load merchant profile from Supabase using `merchant_id` from session
- Show loading spinner while fetching
- Pre-fill form with fetched data
- Allow inline editing

**Save Behavior:**
- On "Next" click → Validate required fields
- Save changes to Supabase `merchants` table
- Show success toast: "Business info saved!"
- Move to Step 2

**Styling:**
- Clean form layout with labels
- Input fields with focus states (blue border)
- Required field indicators (red asterisk)

---

#### **STEP 2: Training Data**

**Purpose:** CRUD booking slots and FAQs - show data customization

**Two Sub-sections:**

**A) Booking Slots Manager:**
```
┌─ BOOKING SLOTS ────────────────────────┐
│                                        │
│ [+ Add New Slot]                       │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ Date        │ Time     │ Capacity │ │
│ ├────────────────────────────────────┤ │
│ │ 2025-01-27  │ 09:00 AM │ 1    [✓] │ │
│ │ 2025-01-27  │ 10:00 AM │ 1   [✓]  │ │
│ │ 2025-01-27  │ 02:00 PM │ 1   [✓]  │ │
│ │ 2025-01-28  │ 09:00 AM │ 2   [✓]  │ │
│ │                               [🗑]   │
│ └────────────────────────────────────┘ │
│                                        │
└────────────────────────────────────────┘
```

**Interactions:**
- Click "+ Add New Slot" → inline form appears below table
- Form: Date picker + Time input + Capacity spinner
- Click checkmark → Save to DB, update table
- Click trash → Delete from DB, remove from table
- Show loading state during saves
- Inline validation (can't add past dates, duplicate times)

**API Calls:**
- GET `/booking_slots?merchant_id=X` → Load existing slots
- POST `/booking_slots` → Create new slot
- DELETE `/booking_slots/{id}` → Remove slot
- All calls via Supabase JS client

---

**B) FAQs Manager:**
```
┌─ FAQs & POLICIES ──────────────────────┐
│                                        │
│ [+ Add New FAQ]                        │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ Category: Policies                 │ │
│ │ Q: What's your cancellation policy?│ │
│ │ A: We allow cancellations up to... │ │
│ │                              [Edit] │ │
│ │                            [Delete] │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ Category: Services                 │ │
│ │ Q: Do you offer gift cards?        │ │
│ │ A: Yes! Available...               │ │
│ │                              [Edit] │ │
│ │                            [Delete] │ │
│ └────────────────────────────────────┘ │
│                                        │
└────────────────────────────────────────┘
```

**Interactions:**
- Click "+ Add New FAQ" → Modal dialog opens
- Modal: Category (dropdown) + Question (text) + Answer (textarea)
- Click "Save" → Insert to DB, add to list
- Click "Edit" on existing FAQ → Modal with pre-filled data
- Click "Delete" → Confirm dialog, then delete from DB
- Show success/error toasts

**API Calls:**
- GET `/faqs?merchant_id=X` → Load existing FAQs
- POST `/faqs` → Create FAQ
- PUT `/faqs/{id}` → Update FAQ
- DELETE `/faqs/{id}` → Delete FAQ
- All via Supabase JS client

---

**Step 2 Summary:**
- Clean, Airtable-like CRUD UI
- Drag-and-drop reordering (nice-to-have, not required)
- Show "2 slots configured" + "5 FAQs added" summary stats
- "Next" button enables only after at least 1 slot + 1 FAQ added

---

#### **STEP 3: Go Live**

**Purpose:** Trigger AI training and show success

**Visual Design:**
```
┌────────────────────────────────────────┐
│  🚀 Train Your AI Assistant            │
│                                        │
│  Everything is ready. Train your AI    │
│  on your business data and start       │
│  handling bookings automatically.      │
│                                        │
│  What happens:                         │
│  ✓ AI learns your business rules      │
│  ✓ AI understands booking slots       │
│  ✓ Chat widget goes live              │
│                                        │
│  Processing time: ~10 seconds          │
│                                        │
│  [Train AI Now] (Large Primary Button) │
│                                        │
└────────────────────────────────────────┘
```

**On Click "Train AI Now":**
1. Disable button, show "Training..." text
2. Show fake progress bar (animate 0% → 100% over 3 seconds)
3. Progress stages (with labels):
   - 0-33%: "Loading your data..."
   - 33-66%: "Processing business rules..."
   - 66-99%: "Configuring AI model..."
   - 99-100%: "Finalizing..."
4. After progress completes, show success state:

```
┌────────────────────────────────────────┐
│  ✅ AI Training Complete!              │
│                                        │
│  Your AI is now live and ready to     │
│  handle customer bookings.            │
│                                        │
│  Next steps:                           │
│  → Embed the chat widget on your site │
│  → Monitor conversations in dashboard │
│  → Customize AI responses             │
│                                        │
│  [Embed Chat Widget] (Primary)         │
│  [View Dashboard] (Secondary)          │
│                                        │
│  Demo API Response Simulation:         │
│  ✓ 47 historical conversations loaded │
│  ✓ Booking slots indexed              │
│  ✓ FAQs embedded as knowledge graph   │
│                                        │
└────────────────────────────────────────┘
```

**API Calls:**
- POST `/train` → Trigger training (fake - just wait 3 seconds)
- PUT `/merchants/{id}` → Set `ai_trained = true`

**UX Details:**
- Disable all navigation during training
- Show celebratory animation on success (confetti optional, but nice)
- "Embed Chat Widget" button routes to ChatWidget demo
- Store training status in localStorage for persistence

---

### 4️⃣ CHAT WIDGET (`/widget` or Modal/Sidebar)

**Purpose:** THE HERO FEATURE - demonstrate AI power with booking automation

**Design Pattern:** Intercom-style floating chat widget

**Visual Style:**
- Floating button in bottom-right corner (when not expanded)
- Slides in as a sidebar/modal when clicked
- Responsive: 90vw width on mobile, 380px on desktop
- Smooth animations (slide-in, fade)

**Closed State:**
```
┌─────────────┐
│   💬        │  ← Floating button
│             │
│  Chat with  │
│  our AI     │
└─────────────┘
```

**Expanded State:**
```
┌────────────────────────────────────────┐
│ Smax AI Assistant          [_] [x]     │
├────────────────────────────────────────┤
│                                        │
│ Hi there! 👋                          │
│ I'm your booking assistant. How can   │
│ I help you today?                      │
│                                        │
│ [View available times] [Book now]     │
│                                        │
│ User: I want to book a massage        │
│ tomorrow at 2 PM                      │
│                                        │
│ AI: Great! I have a 2 PM slot        │
│ available tomorrow. Let me get your   │
│ details...                            │
│                                        │
│ [Confirm Booking] [Choose Different]  │
│                                        │
│ ┌──────────────────────────────────┐ │
│ │ Type your message...           [📤] │
│ └──────────────────────────────────┘ │
│                                        │
└────────────────────────────────────────┘
```

**Chat Message Components:**

**AI Message:**
- Left-aligned, gray/light background
- Show avatar (optional: "🤖")
- Typing indicator while "thinking" (3 dots animation)
- Suggested action buttons below (if applicable):
  - "View Times"
  - "Book Now"
  - "Yes, confirm"
  - "Cancel"
  - etc.

**User Message:**
- Right-aligned, blue background
- Simple text
- Timestamp (optional)

**Suggested Actions (Inline Buttons):**
- Appear below AI messages
- Click → Auto-send as user message
- Disabled after selection
- Example: If AI returns `slots: [{date, time}]`, render as:
  ```
  [📅 Jan 27, 9:00 AM] [📅 Jan 27, 2:00 PM] [📅 Jan 28, 10:00 AM]
  ```

---

**Chat Flow Example:**

```
1. User message: "Can I book a massage tomorrow at 2 PM?"
   ↓
2. API Call to VITE_EDGE_CHAT_URL:
   POST {
     merchant_id: "merchant_1",
     message: "Can I book a massage tomorrow at 2 PM?"
   }
   ↓
3. API Response:
   {
     reply: "Perfect! I have a 2 PM slot tomorrow. Can I get your name and phone number?",
     slots: [
       { date: "2025-01-27", time: "14:00", duration: 60 }
     ],
     suggestedActions: ["Confirm 2 PM", "Show other times"]
   }
   ↓
4. Render AI message + suggested buttons
   ↓
5. User clicks "Confirm 2 PM" or types their name
   ↓
6. Continue conversation until booking confirmed
   ↓
7. Final message: "✅ Your booking is confirmed! Confirmation sent to your email."
```

---

**Technical Details:**

**Message Storage:**
- Use Zustand for local chat state (messages array)
- On send: Store message in local state immediately
- Call API with message
- Append AI response to chat
- Optional: Save conversation to Supabase `conversations` table

**API Integration:**
```typescript
const response = await fetch(VITE_EDGE_CHAT_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    merchant_id: session.org.id,
    message: userMessage
  })
})
const data = await response.json()
// data: { reply, slots?, suggestedActions? }
```

**Typing Indicator:**
- Show after user message sent
- Hide when AI response arrives
- Use CSS animation (3 dots with delay)

**Widget State Persistence:**
- Keep chat history during session (localStorage optional)
- Clear on page reload (or persist across pages)
- Close button → Collapse widget, keep messages
- X button on header → Collapse

**Error Handling:**
- If API fails → Show error message: "Sorry, I couldn't understand that. Try again."
- Retry button on error messages
- Fallback message if no response

---

**Visual Polish:**
- Smooth scroll to latest message
- Emoji support in messages
- Code formatting for special text
- Avatar icons (AI = 🤖, User = 👤)
- Status indicators (typing, sent, delivered)

---

### 5️⃣ CONVERSATIONS PAGE (`/conversations`)

**Purpose:** Show merchant the AI's work - demonstrate ROI

**Visual Design:**
- Table view with filters
- Real-time status updates (fake)
- Summary stats at top

**Header Stats:**
```
┌──────────────────────────────────────────┐
│ Total Conversations: 47                  │
│ AI Resolved: 44 (94%)  |  Escalated: 3  │
│ Bookings from AI: 23                     │
└──────────────────────────────────────────┘
```

**Filter Bar:**
```
┌──────────────────────────────────────────┐
│ Status: [All ▼] Intent: [All ▼] Date: ... │
│                              [Export CSV] │
└──────────────────────────────────────────┘
```

**Conversations Table:**
```
┌────────────────────────────────────────────────────────────┐
│ Visitor     │ Intent  │ Message Preview    │ Status  │ Time │
├────────────────────────────────────────────────────────────┤
│ John D.     │ Booking │ "Can I book a spa" │ ✅ Done │ 2m  │
│ Sarah M.    │ Inquiry │ "Do you have gift" │ ✅ Done │ 5m  │
│ Mike L.     │ Booking │ "Tomorrow 2 PM?"   │ ❌ Esc  │ 8m  │
│ Emma R.     │ Booking │ "Weekend slots?"   │ ✅ Done │ 12m │
│ ...         │ ...     │ ...                │ ...     │ ... │
└────────────────────────────────────────────────────────────┘
```

**Row Details:**
- **Visitor:** Fake name (randomized: John D., Sarah M., etc.)
- **Intent:** booking, inquiry, complaint, other (colored badge)
- **Message Preview:** First 40 chars of conversation
- **Status:**
  - ✅ Done (green) = AI fully resolved
  - ❌ Escalated (orange) = Passed to human
  - 🔄 Active (blue) = Ongoing
- **Time:** Relative time ("2m", "1h", "1d ago")

**Click Row:**
- Opens conversation detail modal/sidebar
- Shows full chat transcript
- Shows action taken (if booking) with details
- Copy button for booking confirmation

**Data & Interactions:**
- Load real conversations from Supabase `conversations` + `messages` tables
- Paginate if > 20 conversations (20 per page)
- Filter by status, intent, date range
- Search by visitor name or message content
- Sort by date (newest first)
- Refresh button → re-fetch conversations
- Export as CSV → Download conversation data

**Fake Data (if DB is empty):**
```typescript
const fakeConversations = [
  {
    id: '1',
    visitor: 'John Davis',
    intent: 'booking',
    preview: 'Can I book a 1-hour massage?',
    status: 'resolved',
    messages: 5,
    duration: '3 min',
    action: 'Booking created for Jan 27, 2 PM'
  },
  // ... more fake data
]
```

---

## UX & DESIGN SYSTEM

### Color Palette:
```
Primary: #3B82F6 (Blue)
Success: #10B981 (Green)
Error: #EF4444 (Red)
Warning: #F59E0B (Orange)
Gray: #6B7280 to #F3F4F6
Background: #F8FAFC (light gray)
```

### Typography:
```
Font: Inter (from Google Fonts)
Headings: 24-32px, weight 700
Subheadings: 16-20px, weight 600
Body: 14-16px, weight 400-500
Captions: 12px, weight 400, gray
```

### Spacing:
```
Base unit: 8px
Padding: 8px, 12px, 16px, 24px
Margin: 8px, 12px, 16px, 24px, 32px
Border radius: 6px (small), 8px (medium), 12px (large)
```

### Components:
```
Buttons:
  - Primary: Blue bg, white text, hover darker
  - Secondary: Gray bg, dark text
  - Danger: Red bg, white text
  - Link: Blue text, underline on hover
  - States: default, hover, active, disabled

Inputs:
  - Border: 1px solid #E2E8F0
  - Focus: 1px solid #3B82F6 + light blue shadow
  - Label: 12px gray text above
  - Error state: Red border + error message

Cards:
  - White background, 1px gray border
  - Box shadow: 0 1px 3px rgba(0,0,0,0.1)
  - Padding: 16-24px
  - Hover: subtle shadow increase

Toasts:
  - Position: top-right
  - Duration: 3 seconds auto-hide
  - Success: green bg
  - Error: red bg
  - Info: blue bg
```

### Animations:
```
Transitions: 0.2s ease (default)
Page transition: fade + slide
Modal: scale + fade in
Button hover: darken + slight lift
Loading spinner: smooth rotation
Skeleton loader: pulse animation
```

---

