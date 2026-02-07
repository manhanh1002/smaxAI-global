# 04_FEATURE_DETAILS.md - Chi tiết Tính năng từng Module

## 1. Unified Conversation Context - Chi tiết

### 1.1 Lead Profile Component

**Data Model:**
```javascript
{
  lead_id: "uuid",
  organization_id: "uuid",
  phone: "0901234567",
  name: "Nguyễn Văn A",
  email: "a@example.com",
  source: "whatsapp", // whatsapp|messenger|web|email|phone
  source_id: "phone_number|messenger_id",
  tags: ["vip", "referral", "hot"],
  properties: {
    first_contact_date: "2024-02-03",
    preferred_time: "morning",
    allergies: "anesthesia X",
    notes: "Referred by Dr. B"
  },
  created_at: "2024-02-03T10:00:00Z",
  updated_at: "2024-02-03T14:30:00Z",
  last_activity_at: "2024-02-03T14:30:00Z"
}
```

**Features:**
- View lead summary at a glance
- Edit lead properties
- Add/remove tags
- Quick notes
- Activity timeline
- Source badge
- Contact info display

---

### 1.2 Conversation Timeline

**Timeline Display:**
```
Timeline view (most recent at top)

2024-02-03 14:30 [Lead] "Vâng, xác nhận T3 lúc 9h"
                  └─ State: Lead confirmed appointment

2024-02-03 14:25 [Sales] "Bạn có rảnh T3 lúc 9h không?"
                  └─ From AI assistant (approved)

2024-02-03 14:20 [System] Reminder scheduled for 2024-02-09 09:00
                  └─ Automated action

2024-02-03 14:15 [Lead] "Tôi muốn bọc sứ, bao nhiêu tiền?"
                  └─ Initial inquiry

Features:
- Group by conversation
- Filter by channel
- Search by keyword
- Message details on click
- Timestamp for each message
- Sender type indicator (Lead/Sales/System/AI)
```

---

### 1.3 Message Sync Engine

**Sync process:**
```
Webhook ← WhatsApp Business API
  │
  ├─ Message received
  ├─ Extract: from, to, content, timestamp
  ├─ Find/create conversation
  ├─ Store message
  └─ Trigger AI analysis

Real-time:
- New message → UI updates (WebSocket)
- AI suggestion appears within 2-5 seconds
- UI shows "suggestion pending" while processing
```

---

## 2. AI Conversation Assistant - Chi tiết

### 2.1 Conversation Summary Feature

**Input:**
```
Last 10 messages from conversation:
1. Sales: "Xin chào, clinic..."
2. Lead: "Tôi muốn bọc sứ"
3. Sales: "Dạ, dịch vụ bọc sứ của chúng tôi..."
...
```

**Output:**
```
[Conversation Summary]
Customer A wants porcelain crown for front teeth, 
interested in pricing and availability.

[Key Points]
- Service: Porcelain crown
- Status: Interested
- Next step: Propose appointment date

[Sentiment]
Friendly, interested, not urgent
```

**UI Display:**
- Small card below conversation
- Auto-update on new messages
- Collapsible/expandable
- Copy to clipboard button

---

### 2.2 Missing Info Detection

**System analysis:**
```
Required fields (from SOP):
- service_type ✓ (mentioned: "bọc sứ")
- appointment_date ✗ (not mentioned)
- appointment_slot ✗ (not mentioned)
- patient_contact ✓ (known from phone)
- confirm_first_visit ✗ (not confirmed)

Missing fields:
1. appointment_date - Required to propose slot
2. confirm_first_visit - Required for medical history
```

**UI Display:**
```
[Missing Info]
⚠ appointment_date (required)
   "Need to propose a specific date/time"
   
⚠ confirm_first_visit (required)
   "Need to ask if first visit to clinic"

[Priority] Highest to lowest
```

---

### 2.3 Reply Suggestion Workflow

**Generation:**
```
Input: conversation_history + context + SOP rules
  ↓
LLM generates: 2 reply options
  ├─ Option A (Professional, formal tone)
  └─ Option B (Friendly, casual tone)
  ↓
Output: 
{
  option_a: "Cảm ơn...",
  option_b: "Chào bạn!...",
  why: "To ask for missing date",
  next_action: "Wait for date response"
}
```

**UI:**
```
[Reply Suggestions]

[Option A] Professional
Cảm ơn bạn A! Dịch vụ bọc sứ của chúng tôi... 
Để đề xuất lịch khám phù hợp, bạn có rảnh ngày nào 
tuần tới không?
[Use] [Edit] [Copy]

[Option B] Friendly  
Chào bạn A! 👋 Bọc sứ giá...
Tuần tới bạn rảnh ngày nào mình sắp xếp nhé 😊
[Use] [Edit] [Copy]

[Why this suggestion?]
To confirm appointment date so we can propose specific slots

[Custom reply]
[Type your own...]
```

---

### 2.4 Intent Classification

**Classification:**
```
Message: "Tôi không thể đi được ngày 10"

Intent: reschedule_request
Confidence: 0.95
Entities:
  - date: "10" (current appointment date)
  - action: "cannot attend"

Suggested action:
→ Transition to RESCHEDULED state
→ Show: "Would customer like to pick new date?"
```

---

## 3. Booking Orchestration - Chi tiết

### 3.1 State Transition UI

**Visual workflow:**
```
INQUIRY  ─→  SERVICE_SELECTED  ─→  SLOT_PROPOSED  ─→ SLOT_CONFIRMED
  │                                                          │
  │ (If needs payment)                                       ↓
  └─────────────────────→  PAYMENT_PENDING  ────────→ PAID ────┐
                                                               │
                                                               ↓
                                    REMINDER_SENT  ←─────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ↓                     ↓                     ↓
              COMPLETED           NO_SHOW            RESCHEDULED
              (Finished)         (Didn't come)    (Go back to SLOT_PROPOSED)
```

### 3.2 Booking Confirmation Checklist

**Before confirming SLOT_CONFIRMED:**
```
[Booking State Change]

Current: SLOT_PROPOSED
Target: SLOT_CONFIRMED

Prerequisites check:
✓ Service selected: Bọc sứ
✓ Date provided: T3, 10/02
✓ Time provided: 09:00
✓ Customer phone: 0901234567
✓ Slot still available: Yes
✓ Min notice met (24h): Yes

All checks passed! ✓

[Confirm state change] [Cancel] [Edit]
```

---

## 4. SOP Enforcement Engine - Chi tiết

### 4.1 No-code SOP Builder UI

**State editor:**
```
[State: SERVICE_SELECTED]

Required Fields:
- [x] service_type
- [x] appointment_date  
- [x] appointment_slot
- [ ] payment_method (optional)

Blocking Rules:
[+ Add rule]
1. ✗ Cannot proceed if service_type is null
   "Error: Service type must be confirmed"
   
2. ✗ Cannot proceed if appointment_date is null
   "Error: Appointment date must be proposed"
   
[+ Add another rule]

Message Templates:
[+ Add template]

"Service bọc sứ thường mất 30 phút, 
bạn bận ngày nào tuần tới?"

[Save] [Cancel] [Duplicate]
```

---

### 4.2 Template Gallery

**Pre-built templates:**
```
[Clinic Templates]
├─ Clinic Dental (Nha khoa)
├─ Medical Clinic (Phòng khám)
├─ Aesthetic Clinic (Thẩm mỹ)
├─ Physiotherapy
└─ General Medical

[Academy Templates]
├─ Language Center (Tiếng Anh)
├─ Programming Course
├─ Art Class
└─ General Academy

[Beauty Templates]
├─ Hair Salon
├─ Spa
├─ Yoga Studio
└─ General Beauty
```

**One-click import:**
```
[Select template] → [Import] → [Customize] → [Publish]
```

---

## 5. SOP Compliance Tracking

### 5.1 Compliance Score

**Real-time calculation:**
```
Total bookings in this period: 20

Compliance check:
- Service confirmed before slot proposal: 19/20 (95%)
- Appointment date provided before confirmation: 20/20 (100%)
- Payment link sent if payment required: 18/18 (100%)
- Reminder sent 24h before: 15/17 (88%)

Overall Compliance Score: 95%

Grade: A (90-100%)
```

---

## 6. Human-in-the-loop Controls

### 6.1 Approval Workflows

**Suggestion approval:**
```
AI suggests: [Reply option A]
User sees: [Use] [Use Option B] [Edit] [Reject]

If [Use]:
  → Message sent as-is
  → Log: "Used AI option A"
  → Continue

If [Edit]:
  → Open editor with AI suggestion as template
  → User modifies
  → Send edited message
  → Log: "Edited AI suggestion"

If [Reject]:
  → Show dialog: "Why did you reject? (optional)"
  → Log feedback
  → Show alternative suggestions
```

---

### 6.2 Activity Audit Log

**Log format:**
```
[Activity Log]

2024-02-03 14:30
├─ User: sales_01
├─ Action: Approved AI reply suggestion
├─ Details: Option A, no edits
├─ Lead: Nguyễn Văn A
├─ Cost: 5 cents (LLM)
└─ Result: Message sent successfully

2024-02-03 14:20
├─ User: sales_01
├─ Action: Moved booking state
├─ From: SLOT_PROPOSED
├─ To: SLOT_CONFIRMED
├─ Validation: Passed (all fields present)
└─ Result: Success
```

---

## 7. Metrics Dashboard

### 7.1 Main Dashboard

```
[Dashboard Overview]

Key Metrics (Today):
- New leads: 12 (+20% vs yesterday)
- Bookings created: 8 (67% conversion)
- Bookings confirmed: 5 (62% of created)
- No-show rate: 12% (↓ from 25% last month)
- Avg response time: 15 min
- SOP compliance: 94%

[Charts]
- Lead source pie chart (WhatsApp 60%, Messenger 40%)
- Booking funnel (visual)
- No-show trend (line chart)
- Response time (bar chart)
```

---

**Tài liệu liên quan:**
- [05_AI_LOGIC_ARCHITECTURE.md](05_AI_LOGIC_ARCHITECTURE.md)
- [06_BOOKING_ORCHESTRATION_ENGINE.md](06_BOOKING_ORCHESTRATION_ENGINE.md)
- [07_UX_UI_FLOWS.md](07_UX_UI_FLOWS.md)

**Última actualización**: Feb 2026  
**Status**: In Review  
**Version**: 1.0-MVP
