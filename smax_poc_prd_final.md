# 📋 SMAX AI - POC PRODUCT REQUIREMENTS DOCUMENT

**Version:** 1.0 (Live POC)
**Status:** Active Development
**Date:** January 2025
**Audience:** Development Team, Product Stakeholders

---

## EXECUTIVE SUMMARY

Smax AI is a **production-grade proof-of-concept** for an AI-powered conversational commerce platform. The system is **currently live** with:

✅ **Real Supabase Cloud** with authentication
✅ **Real token.ai.vn API** integration (Vietnamese OpenAI wholesale)
✅ **Real AI conversations** using GPT-4
✅ **Real data persistence** for bookings and orders
✅ **Merchant dashboard** with conversation logs
✅ **Embedded chat widget** for customer interactions

**Current Status:**
- ✅ Backend infrastructure: COMPLETE
- ✅ Merchant dashboard: COMPLETE
- ✅ Chat widget HTML page: BUILT but NOT SYNCING
- ✅ Database integration: COMPLETE
- ✅ AI engine: COMPLETE

**Critical Issue:**
- ❌ Chat widget messages NOT appearing in real-time
- ❌ Widget state NOT persisting to database
- ❌ Real-time subscriptions NOT working between widget and dashboard

**Goal:** Fix chat widget to enable end-to-end AI conversation flow without mock data.

---

## 1️⃣ CURRENT SYSTEM ARCHITECTURE

### Technology Stack (Live)

```
Frontend:
  ✅ React 18 + Vite + TypeScript
  ✅ Tailwind CSS
  ✅ Zustand (state management)
  ✅ React Router v6
  ✅ Lucide React (icons)
  ✅ Supabase JS client

Backend:
  ✅ Supabase Cloud (PostgreSQL)
  ✅ Supabase Authentication (enabled)
  ✅ Supabase Real-time Subscriptions
  ✅ Supabase Edge Functions (ai-chat)

AI Engine:
  ✅ token.ai.vn API (https://api.token.ai.vn)
  ✅ GPT-4 model
  ✅ Dynamic system prompt (context-aware)

Database:
  ✅ merchants table
  ✅ products table
  ✅ booking_slots table
  ✅ faqs table
  ✅ conversations table
  ✅ messages table
  ✅ ai_task_logs table
  ✅ orders table (optional)
  ✅ bookings table (optional)
```

### Current Data Flow

```
IDEAL FLOW (What should happen):
┌─────────────────────────────────────────────────┐
│ 1. Visitor opens chat widget on website HTML    │
│    (test-chat.html or merchant website)         │
└────────────────────┬────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ 2. Chat widget initializes                      │
│    - Creates conversation in Supabase           │
│    - Sets up real-time subscription             │
│    - Displays greeting message                  │
└────────────────────┬────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ 3. Visitor types message                        │
│    (e.g., "Can I book a massage tomorrow?")     │
└────────────────────┬────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ 4. Widget sends message to Supabase Edge Func   │
│    POST /functions/v1/ai-chat                   │
│    - merchant_id                                │
│    - conversation_id                            │
│    - message                                    │
└────────────────────┬────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ 5. Edge Function processes                      │
│    - Loads merchant context (products, slots)   │
│    - Builds system prompt                       │
│    - Calls token.ai.vn API                      │
│    - Gets AI response                           │
│    - Detects actions (booking, product)         │
│    - Saves to messages table                    │
│    - Creates task log entry                     │
└────────────────────┬────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ 6. Widget receives response                     │
│    - Adds AI message to conversation            │
│    - Displays in chat window                    │
│    - Subscribes to real-time updates            │
└────────────────────┬────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ 7. Merchant sees in Conversations page          │
│    - New conversation appears in left panel     │
│    - Chat thread shows in center                │
│    - Task log shows AI actions on right         │
└────────────────────┬────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ 8. If booking created                           │
│    - Task log shows "Booking created"           │
│    - Booking appears in Bookings page           │
│    - Merchant can approve/modify                │
└─────────────────────────────────────────────────┘

ACTUAL FLOW (Current broken state):
┌─────────────────────────────────────────────────┐
│ 1. Visitor opens chat widget                    │
│    ✅ Widget loads                              │
│    ❌ No messages appear                        │
└────────────────────┬────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ 2. Visitor types message                        │
│    ✅ Input accepts text                        │
│    ❌ No visible response from AI               │
│    ❌ No error message shown                    │
└────────────────────┬────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│ 3. In console (browser dev tools)               │
│    ❓ May show errors (unclear)                 │
│    ❓ Messages may not reach Edge Function      │
│    ❓ or Edge Function may fail silently        │
└─────────────────────────────────────────────────┘
```

---

## 2️⃣ IDENTIFIED ISSUES & ROOT CAUSES

### Issue #1: Widget Messages NOT Appearing

**Symptom:**
- User types message in chat widget
- Send button clicked
- Nothing happens
- No message appears in chat window
- No AI response

**Likely Root Causes:**

A. **Widget not calling Edge Function**
   - Fetch request may not be sent
   - URL may be incorrect
   - Authorization header missing
   - CORS issue (but Edge Function should allow it)

B. **Edge Function called but fails silently**
   - Invalid merchant_id or conversation_id
   - token.ai.vn API key invalid/expired
   - token.ai.vn API call fails
   - Error not returned to widget

C. **Response received but not displayed**
   - Widget state not updating correctly
   - Message list component not re-rendering
   - Response format unexpected

D. **Real-time subscription not active**
   - Messages table subscription not established
   - New messages not triggering widget update
   - Supabase auth token expired

### Issue #2: Widget NOT Syncing with Dashboard

**Symptom:**
- Chat widget creates conversations
- Merchant dashboard shows no new conversations
- Even if conversations exist, no messages show

**Likely Root Causes:**

A. **Real-time subscriptions not enabled on database**
   - `messages` table may not have real-time enabled
   - `conversations` table may not have real-time enabled
   - Requires toggle in Supabase dashboard

B. **Auth issues preventing database writes**
   - Widget using anonymous/public auth
   - Database RLS policies blocking inserts
   - Supabase auth session invalid

C. **Table schema mismatch**
   - Column names don't match insert queries
   - Data types incompatible
   - Required fields missing

---

## 3️⃣ REQUIRED FIXES (PRIORITY ORDER)

### CRITICAL: Fix #1 - Chat Widget Message Flow

**Objective:** Widget must successfully send and receive messages

**Tasks:**

#### 1.1 Verify Chat Widget Code Structure

File: `src/components/ChatWidget/ChatWidget.tsx`

**Checklist:**
- [ ] Component imports correct Supabase client
- [ ] Component has state for `messages`, `input`, `loading`
- [ ] Component creates conversation on mount
- [ ] `sendMessage()` function prevents empty inputs
- [ ] `sendMessage()` shows loading state

**Code review:**
```typescript
// MUST HAVE:
import { supabase } from '../../lib/supabase'

// MUST HAVE - create conversation on mount:
useEffect(() => {
  const initConversation = async () => {
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
    
    if (data) setConversationId(data.id)
    if (error) console.error('Failed to create conversation:', error)
  }
  
  initConversation()
}, [])

// MUST HAVE - send message function:
const sendMessage = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!input.trim() || !conversationId || loading) return
  
  // Add user message to UI immediately
  setMessages(prev => [...prev, {
    id: Date.now().toString(),
    role: 'user',
    content: input,
    timestamp: new Date()
  }])
  
  setInput('')
  setLoading(true)
  
  try {
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
          visitor_name: 'Visitor',
          message: input
        })
      }
    )
    
    const data = await response.json()
    
    if (data.success) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        content: data.reply,
        timestamp: new Date()
      }])
    } else {
      console.error('AI error:', data.error)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        content: `Error: ${data.error}`,
        timestamp: new Date()
      }])
    }
  } catch (error) {
    console.error('Chat error:', error)
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'ai',
      content: 'Sorry, something went wrong.',
      timestamp: new Date()
    }])
  } finally {
    setLoading(false)
  }
}
```

---

#### 1.2 Verify Environment Variables in HTML Test Page

File: `test-chat.html` or `public/chat-test.html`

**Issue:** If you're embedding widget via script tag, ensure:

```html
<!-- ❌ WRONG - hardcoded URL:
<script src="http://localhost:5173/src/components/ChatWidget.tsx"></script>
-->

<!-- ❌ WRONG - missing config:
<div id="smax-widget"></div>
-->

<!-- ✅ CORRECT - either:

Option A: Iframe embed
<iframe 
  src="http://localhost:5173/chat-widget"
  style="width:400px;height:600px;border:none;border-radius:12px;position:fixed;bottom:20px;right:20px;"
></iframe>

Option B: Script tag (requires export from React)
<script>
  window.smaxConfig = {
    apiUrl: "http://localhost:5173",
    supabaseUrl: "YOUR_SUPABASE_URL",
    supabaseKey: "YOUR_SUPABASE_ANON_KEY",
    merchantId: "merchant_1"
  }
</script>
<script src="http://localhost:5173/smax-widget.js"></script>
<div id="smax-chat-widget"></div>

Option C: React component (if building test page in React)
<ChatWidget merchantId="merchant_1" />
-->
```

**Action:** Choose ONE approach and ensure environment variables are passed correctly.

---

#### 1.3 Enable Real-time on Database Tables

**In Supabase Dashboard:**

1. Go to **Project Settings → Database → Tables**
2. For each table, click to edit:
   - [ ] `messages` → Enable real-time
   - [ ] `conversations` → Enable real-time
   - [ ] `ai_task_logs` → Enable real-time

**Command (if using Supabase CLI):**
```bash
supabase db push

# Or manually in SQL Editor:
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_task_logs;
```

---

#### 1.4 Verify Authentication & RLS Policies

**Check Supabase Auth:**

1. Go to **Settings → Database → RLS Policies**
2. For `messages` table:
   ```
   ❓ Is RLS enabled or disabled?
   If ENABLED: ensure policy allows inserts for authenticated users
   If DISABLED: OK for demo, but not secure
   ```

3. Policy example (if RLS enabled):
   ```sql
   CREATE POLICY "Allow authenticated users to insert messages" ON public.messages
   FOR INSERT TO authenticated
   WITH CHECK (true);
   
   CREATE POLICY "Allow users to read messages" ON public.messages
   FOR SELECT TO authenticated
   USING (true);
   ```

---

#### 1.5 Add Debug Logging to Chat Widget

Add console logs to identify where it breaks:

```typescript
const sendMessage = async (e: React.FormEvent) => {
  e.preventDefault()
  
  const userMessage = input.trim()
  console.log('1. Sending message:', userMessage)
  
  if (!userMessage || !conversationId || loading) {
    console.log('2. BLOCKED - Empty input or no conversationId:', { 
      empty: !userMessage, 
      noConv: !conversationId, 
      loading 
    })
    return
  }
  
  console.log('3. Message passed validation')
  
  setMessages(prev => [...prev, {
    id: Date.now().toString(),
    role: 'user',
    content: userMessage,
    timestamp: new Date()
  }])
  console.log('4. User message added to state')
  
  setInput('')
  setLoading(true)
  
  try {
    console.log('5. Calling Edge Function at:', 
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`)
    
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
          visitor_name: 'Visitor',
          message: userMessage
        })
      }
    )
    
    console.log('6. Edge Function response status:', response.status)
    
    const data = await response.json()
    console.log('7. Edge Function response:', data)
    
    if (data.success) {
      console.log('8. Success! AI replied:', data.reply)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        content: data.reply,
        timestamp: new Date()
      }])
    } else {
      console.error('9. Edge Function returned error:', data.error)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        content: `Error: ${data.error}`,
        timestamp: new Date()
      }])
    }
  } catch (error) {
    console.error('10. Caught exception:', error)
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'ai',
      content: 'Sorry, something went wrong.',
      timestamp: new Date()
    }])
  } finally {
    setLoading(false)
  }
}
```

**Testing:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Send a message
4. Look for console logs 1-10
5. Note where it stops
6. This tells you exactly where the issue is

---

### CRITICAL: Fix #2 - Edge Function Error Handling

**Objective:** Edge Function must return clear error messages

File: `supabase/functions/ai-chat/index.ts`

**Verify:**

```typescript
// MUST return error details:
return new Response(
  JSON.stringify({
    success: false,
    error: error.message || 'Unknown error',
    details: {
      timestamp: new Date().toISOString(),
      functionName: 'ai-chat'
    }
  }),
  {
    headers: { 'Content-Type': 'application/json' },
    status: 500
  }
)

// Check for specific errors:

// ❌ token.ai.vn API error:
if (!response.ok) {
  const errorText = await response.text()
  throw new Error(`token.ai.vn API error: ${response.status} - ${errorText}`)
}

// ❌ Invalid merchant:
if (!merchant) {
  throw new Error('Merchant not found')
}

// ❌ Invalid conversation:
if (!conversationId) {
  throw new Error('Conversation not found')
}
```

**Testing Edge Function directly:**
```bash
# In terminal, test the function:
curl -X POST https://your-project.supabase.co/functions/v1/ai-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{
    "merchant_id": "merchant_1",
    "conversation_id": "test-conv-123",
    "visitor_name": "Test",
    "message": "Hello"
  }' | jq .

# Should see either:
# {success: true, reply: "...", actions: [...]}
# OR
# {success: false, error: "..."}
```

---

### CRITICAL: Fix #3 - Message Persistence & Display

**Objective:** Messages must save to database AND display in widget

**Checklist:**

1. **Messages are saved to database:**
   ```
   Go to Supabase Dashboard → messages table
   After sending a message, should see new row with:
   - conversation_id: [correct ID]
   - role: "visitor" or "ai"
   - content: [message text]
   - created_at: [timestamp]
   ```

2. **Widget displays messages from database:**
   ```typescript
   // On component mount, load existing messages:
   useEffect(() => {
     const loadMessages = async () => {
       if (!conversationId) return
       
       const { data, error } = await supabase
         .from('messages')
         .select('*')
         .eq('conversation_id', conversationId)
         .order('created_at', { ascending: true })
       
       if (data) setMessages(data)
       if (error) console.error('Failed to load messages:', error)
     }
     
     loadMessages()
   }, [conversationId])
   ```

3. **Widget subscribes to real-time updates:**
   ```typescript
   // Subscribe to new messages:
   useEffect(() => {
     if (!conversationId) return
     
     const subscription = supabase
       .from(`messages:conversation_id=eq.${conversationId}`)
       .on('*', (payload) => {
         console.log('New message from DB:', payload)
         if (payload.eventType === 'INSERT') {
           setMessages(prev => [...prev, payload.new])
         }
       })
       .subscribe()
     
     return () => {
       supabase.removeSubscription(subscription)
     }
   }, [conversationId])
   ```

---

### HIGH: Fix #4 - Dashboard Conversation Sync

**Objective:** Merchant dashboard must show conversations & messages in real-time

File: `src/pages/Conversations.tsx`

**Verify:**

1. **Conversations panel loads:**
   ```typescript
   useEffect(() => {
     const loadConversations = async () => {
       const { data, error } = await supabase
         .from('conversations')
         .select('*')
         .eq('merchant_id', merchant.id)
         .order('created_at', { ascending: false })
       
       if (data) setConversations(data)
     }
     
     loadConversations()
   }, [merchant.id])
   ```

2. **Subscribes to new conversations:**
   ```typescript
   const subscription = supabase
     .from(`conversations:merchant_id=eq.${merchant.id}`)
     .on('INSERT', (payload) => {
       setConversations(prev => [payload.new, ...prev])
     })
     .subscribe()
   ```

3. **Chat thread loads messages:**
   ```typescript
   useEffect(() => {
     if (!selectedConversation) return
     
     const { data } = await supabase
       .from('messages')
       .select('*')
       .eq('conversation_id', selectedConversation.id)
       .order('created_at', { ascending: true })
     
     setMessages(data || [])
   }, [selectedConversation?.id])
   ```

4. **Task log shows AI actions:**
   ```typescript
   useEffect(() => {
     if (!selectedConversation) return
     
     const { data } = await supabase
       .from('ai_task_logs')
       .select('*')
       .eq('conversation_id', selectedConversation.id)
       .order('created_at', { ascending: true })
     
     setTaskLogs(data || [])
   }, [selectedConversation?.id])
   ```

---

### MEDIUM: Fix #5 - Booking CRUD Operations

**Objective:** AI must be able to create bookings, visible in UI

**Current Status:**
- ❓ AI detects booking intent but doesn't create record
- ❓ Booking page shows manually created bookings only
- ❓ No integration between widget booking and database

**Required Changes:**

File: `supabase/functions/ai-chat/index.ts`

```typescript
// After AI response, check if it should create booking:
function detectAndCreateBooking(aiMessage, context, conversationId, merchantId) {
  // If AI confirmed booking:
  if (aiMessage.includes('booking confirmed') || aiMessage.includes('booked')) {
    // Extract details from message (complex - may need NLP)
    // For now: save as pending booking
    
    const bookingData = {
      conversation_id: conversationId,
      merchant_id: merchantId,
      visitor_name: 'Visitor',
      date: '2025-01-27', // Extract from message
      time: '14:00',      // Extract from message
      service: 'Service', // Extract from message
      status: 'pending'   // Merchant reviews before confirming
    }
    
    const booking = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single()
    
    return {
      type: 'booking_created',
      title: 'Booking created',
      details: { booking_id: booking.id },
      status: 'success'
    }
  }
}
```

**Testing:**
1. Chat with AI: "Book me a massage tomorrow at 2 PM"
2. AI should respond: "Perfect! I've booked you for tomorrow at 2 PM"
3. Check Bookings page in dashboard
4. Should see new booking with status "pending"

---

### MEDIUM: Fix #6 - Order CRUD Operations

**Objective:** AI must be able to log orders when customer purchases

**Current Status:**
- ❓ No order creation in AI flow
- ❓ Orders page (if exists) shows nothing
- ❓ No product purchase tracking

**Required Changes:**

Similar to booking flow:
```typescript
function detectAndCreateOrder(aiMessage, context) {
  if (aiMessage.includes('purchase') || aiMessage.includes('order')) {
    // Extract product and quantity
    // Create order record
    // Update order status
  }
}
```

---

## 4️⃣ TESTING PLAN

### Test Case 1: Widget → AI → Response

**Preconditions:**
- ✅ Supabase cloud running with authentication
- ✅ token.ai.vn API key configured in Edge Function
- ✅ Real-time enabled on messages table
- ✅ Chat widget page open

**Steps:**
1. Open `test-chat.html` or React chat component
2. Type: "Can I book a massage tomorrow?"
3. Click Send
4. Observe console logs (should see 1-10)
5. AI should respond: "Sure! What time works for you?"
6. Open Supabase Dashboard → messages table
7. Should see 2 new rows (user + AI)

**Expected Result:** ✅ Message appears, AI responds, data saved

---

### Test Case 2: Widget → Dashboard Sync

**Preconditions:** Same as Test Case 1

**Steps:**
1. Send message in widget
2. Open Merchant Dashboard → Conversations page
3. Should see new conversation in left panel
4. Click conversation
5. Should see full chat thread in center
6. Right panel should show task log

**Expected Result:** ✅ Conversation appears in dashboard, syncs in real-time

---

### Test Case 3: AI Booking Creation

**Steps:**
1. Chat: "I want to book a service"
2. AI: "Great! What date and time?"
3. Chat: "Tomorrow at 2 PM"
4. AI: "Perfect! Booking confirmed for tomorrow at 2 PM"
5. Go to Bookings page
6. Should see new booking

**Expected Result:** ✅ Booking created, visible in database

---

### Test Case 4: AI Product Recommendation

**Steps:**
1. Chat: "What products do you recommend?"
2. AI: Should see list from products table
3. Chat: "I want to buy [product]"
4. AI: Should create order or log purchase intent

**Expected Result:** ✅ AI recommends real products, can create orders

---

## 5️⃣ DEPLOYMENT CHECKLIST

### Pre-deployment

- [ ] All 6 fixes implemented
- [ ] Console logs added for debugging
- [ ] Real-time enabled on database tables
- [ ] RLS policies verified (or disabled for demo)
- [ ] token.ai.vn API key configured in Edge Function
- [ ] Environment variables set correctly
- [ ] Edge Function deployed: `supabase functions deploy ai-chat`

### Deployment

- [ ] Frontend built: `npm run build`
- [ ] Supabase migrations up to date: `supabase db push`
- [ ] Test widget on fresh browser (no cache)
- [ ] Check console for errors
- [ ] Verify all test cases pass

### Post-deployment

- [ ] Monitor Supabase logs for Edge Function errors
- [ ] Check messages table for new data
- [ ] Verify real-time updates work
- [ ] Test widget on multiple browsers
- [ ] Record demo video for stakeholders

---

## 6️⃣ SUCCESS CRITERIA

**POC is LIVE when:**

✅ Widget sends message → AI responds in < 5 seconds
✅ Messages appear in chat window
✅ Messages saved to database
✅ Dashboard shows conversations in real-time
✅ Chat thread syncs between widget and dashboard
✅ AI recommends real products from database
✅ AI books real slots from database
✅ Bookings appear in Bookings page
✅ Orders appear in Orders page (if applicable)
✅ Task log shows all AI actions
✅ No mock data - everything from database
✅ Merchant can manually reply to customer
✅ System handles errors gracefully
✅ Performance: < 5 second response time

---

## 7️⃣ CRITICAL ISSUES TO INVESTIGATE

### Issue Investigation Guide

**If Test Case 1 fails (no message appears):**

```
Check in this order:
1. Browser console for fetch errors
   → Look for CORS, 404, auth errors
2. Edge Function logs (Supabase dashboard)
   → Go to Functions → ai-chat → Logs
   → Look for token.ai.vn API errors
3. token.ai.vn directly
   → Use curl to test API
   → Verify API key and endpoint
4. Database
   → Check if messages table received insert
   → Check conversations table has valid row
5. Widget code
   → Verify sendMessage function exists
   → Check state updates correctly
   → Check message list re-renders
```

**If Test Case 2 fails (dashboard doesn't sync):**

```
Check in this order:
1. Real-time enabled on tables
   → Supabase dashboard → settings
   → Verify messages/conversations have real-time
2. RLS policies
   → If RLS enabled, ensure policies allow reads
   → Test: SELECT * FROM messages (in SQL editor)
3. Supabase client subscription code
   → Verify .on() subscription syntax
   → Check callback fires (add console.log)
   → Verify auth token is valid
4. Browser WebSocket connection
   → DevTools → Network → WS
   → Should see active WebSocket to Supabase
```

---

## 8️⃣ ESCALATION PATH

**If stuck:** Follow this order

1. **Self-debug with console logs** (30 min)
2. **Check Supabase logs** (15 min)
3. **Test Edge Function directly with curl** (10 min)
4. **Verify token.ai.vn API** (10 min)
5. **Review database schema** (10 min)
6. **Check RLS/auth policies** (10 min)
7. **Review React component code** (20 min)
8. **Escalate to senior dev** if still stuck

**When escalating, provide:**
- Console error messages (full text)
- Supabase Edge Function logs
- Database schema verification
- curl test output from token.ai.vn
- Current component code snippets

---

## 9️⃣ DEFINITION OF DONE

This PRD is complete when:

- [ ] Widget messages appear and sync in real-time
- [ ] Dashboard shows all conversations without refresh
- [ ] AI creates bookings/orders in database
- [ ] All test cases pass
- [ ] No console errors
- [ ] Response time < 5 seconds
- [ ] Demo works repeatably
- [ ] Stakeholders can see value