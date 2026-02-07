# 06_BOOKING_ORCHESTRATION_ENGINE.md - Booking Orchestration Engine (CORE MOAT)

## 1. Tổng quan

### 1.1 Định nghĩa

**Booking Orchestration Engine** là hệ thống quản lý vòng đời booking theo **state machine pattern**, từ khi lead được qualifying cho đến khi khách hàng show-up hoặc không show-up.

**KHÔNG LÀ:**
- ❌ Một calendar app (Google Calendar, Calendly)
- ❌ Gửi link booking (static)
- ❌ Simple appointment reminder

**LÀ:**
- ✓ State machine với điều kiện chuyển
- ✓ Validation rules enforced (blocking)
- ✓ Intelligent workflow (based on lead state)
- ✓ Full lifecycle tracking

### 1.2 Tại sao nó là CORE MOAT?

```
Competitors (ManyChat, SleekFlow, Wati):
→ Conversation management
→ Marketing automation
→ Basic CRM

Us (Our advantage):
→ Booking as a first-class entity
→ State machine with validation
→ SOP enforcement
→ Vertical-specific templates

Defensibility:
1. High switching cost (workflow data locked in)
2. Vertical-specific (hard to build generic)
3. Network effect (more templates = more valuable)
4. Operational leverage (saves 30% time for each customer)
```

---

## 2. Booking State Machine

### 2.1 Core States

```
           ┌─────────────────────────────────────────────┐
           │  Booking Lifecycle State Machine             │
           └─────────────────────────────────────────────┘

1. INQUIRY
   ↓ (Service chosen, contact confirmed)
2. SERVICE_SELECTED
   ↓ (Need to propose slot)
3. SLOT_PROPOSED
   ↓ (Customer accepted or proposed new)
4. SLOT_CONFIRMED (PRIMARY)
   ├─→ [Payment required?] → PAYMENT_PENDING → PAID
   ├─→ [No payment] → (skip to reminder)
   └─→ REMINDER_SENT (waiting for show-up)
       ↓
   ┌───┴──────────────────────┬──────────────────┐
   │                          │                  │
5. COMPLETED         6. NO_SHOW        7. RESCHEDULED
   (Customer came)   (Didn't come)     (Asked to change)
   │                  │                 │
   └─→ FOLLOW_UP      └─→ FOLLOW_UP    └─→ back to
      (Post-care)        (Reschedule        SLOT_PROPOSED
                          offer)
       

Other branches:
- CANCELLED (either party)
- ABANDONED (no activity 7 days)
- ERROR (issue with booking)
```

### 2.2 Detailed State Definitions

| State | Definition | Triggered by | Allowed actions |
|-------|-----------|--------------|-----------------|
| **INQUIRY** | Lead first contact, service not confirmed | Lead sends inquiry message | Ask service, schedule call, propose service |
| **SERVICE_SELECTED** | Service confirmed, need to check availability | Lead confirms service choice | Propose slot, ask additional questions |
| **SLOT_PROPOSED** | Slot proposed to customer, awaiting confirmation | Sales proposes 2-3 slots with description | Send reminder, propose another slot, cancel |
| **SLOT_CONFIRMED** | Customer confirmed slot, confirmed appointment | Customer confirms slot (explicit approval) | Send reminder, propose reschedule, cancel |
| **PAYMENT_PENDING** | Waiting for payment (if required) | Booking needs payment (rule-based) | Send payment link, remind, change slot |
| **PAID** | Payment received | Payment gateway callback | Confirm booking (move to SLOT_CONFIRMED) |
| **REMINDER_SENT** | Reminder sent, waiting for show-up | Auto-triggered 24h before appointment | Track show-up, cancel if customer says no |
| **COMPLETED** | Customer showed up and completed | Manual input from clinic staff | Follow-up action (schedule next, collect feedback) |
| **NO_SHOW** | Customer didn't show up without notice | Time after appointment passed without show-up | Attempt reschedule, mark for follow-up |
| **RESCHEDULED** | Customer asked to change appointment | Customer message "can I reschedule?" | Go back to SLOT_PROPOSED with new dates |
| **CANCELLED** | Either party cancelled the booking | Customer/Sales initiated cancellation | End flow, offer reschedule, close |
| **ABANDONED** | No activity for threshold time | Auto-trigger (e.g., 7 days no activity) | Re-engagement, close, or reopen |

---

## 3. State Transition Rules

### 3.1 Transition Rules Matrix

```
FROM STATE          TO STATE          REQUIRED CONDITIONS
─────────────────────────────────────────────────────────

INQUIRY             SERVICE_SELECTED  ✓ service_type confirmed
                                      ✓ service in catalog

SERVICE_SELECTED    SLOT_PROPOSED     ✓ service_type != null
                                      ✓ at least 2 slots available
                                      ✓ customer_contact != null

SLOT_PROPOSED       SLOT_CONFIRMED    ✓ customer confirmed (explicit text)
                                      ✓ appointment_date != null
                                      ✓ appointment_slot != null

SLOT_CONFIRMED      PAYMENT_PENDING   ✓ payment_required == true
                                      ✓ payment_method != null

PAYMENT_PENDING     PAID              ✓ payment received (webhook)
                                      ✓ amount == booking_amount

PAID                REMINDER_SENT     ✓ appointment_time - now <= 24h

SLOT_CONFIRMED      REMINDER_SENT     ✓ no payment required
                    (OR direct if       ✓ appointment_time - now <= 24h
                     no payment)

REMINDER_SENT       COMPLETED         ✓ appointment time passed
                                      ✓ show_up == true (manual input)

REMINDER_SENT       NO_SHOW           ✓ appointment time passed
                                      ✓ show_up == false (manual input)

SLOT_CONFIRMED      RESCHEDULED       ✓ customer requests reschedule
REMINDER_SENT                         ✓ reason captured

*_*                 CANCELLED         ✓ explicit cancellation request
                                      ✓ reason captured

ANY                 ABANDONED         ✓ no activity for 7 days
                                      ✓ not in COMPLETED/NO_SHOW
```

### 3.2 Example: Clinic Booking Flow

```
Lead: "Tôi muốn bọc sứ cho răng cửa"

INQUIRY
├─ Sales: "Bọc sứ bao gồm... bạn có phải khách hàng mới không?"
└─ Lead: "Vâng, tôi là khách hàng mới"
   └─→ SERVICE_SELECTED (service confirmed)

SERVICE_SELECTED
├─ Sales: "Chúng tôi có 2 ngày khám: T3 lúc 9h hoặc T5 lúc 14h, bạn chọn ngày nào?"
└─ Lead: "Tôi chọn thứ 3 lúc 9h"
   └─→ SLOT_PROPOSED (slot proposed: T3 9:00)

SLOT_PROPOSED
├─ Lead: "Vâng, tôi xác nhận ngày T3 lúc 9h"
   └─→ SLOT_CONFIRMED (explicit confirmation)

SLOT_CONFIRMED
├─ [Check if payment required? Yes, for this service]
│  └─→ PAYMENT_PENDING
│      ├─ Auto-send: "Link thanh toán: ..."
│      └─ [Payment received via Stripe webhook]
│         └─→ PAID
│            └─→ [24h before appointment]
│               └─→ REMINDER_SENT
│
└─ [Or if no payment required]
   └─→ [24h before]
      └─→ REMINDER_SENT

REMINDER_SENT
├─ [Appointment time arrives]
├─ [Clinic staff input: "Customer came"]
└─→ COMPLETED
   └─→ [Suggest follow-up: schedule next appointment, collect review]

OR (if no-show):
   ├─ [Appointment time passed, no staff input]
   └─→ NO_SHOW (auto-transition after 30 min past time)
      └─→ [AI suggests: "Send reschedule offer"]
```

---

## 4. Booking Data Model

### 4.1 Booking Object Structure

```javascript
{
  // Identity
  booking_id: "uuid",
  lead_id: "uuid",
  organization_id: "uuid",
  
  // Timeline
  created_at: "2024-02-03T10:00:00Z",
  updated_at: "2024-02-03T14:30:00Z",
  appointment_date: "2024-02-10",
  appointment_time: "09:00",
  appointment_end_time: "09:30",
  
  // Service & Resource
  service_id: "uuid",
  service_name: "Bọc sứ toàn phục hồi",
  provider_id: "uuid", // Doctor/therapist/instructor
  provider_name: "Dr. Nguyễn Văn A",
  location_id: "uuid", // Clinic branch
  
  // State & Status
  state: "SLOT_CONFIRMED", // Current state
  state_history: [
    { state: "INQUIRY", at: "2024-02-03T10:00:00Z", by: "lead" },
    { state: "SERVICE_SELECTED", at: "2024-02-03T10:05:00Z", by: "sales" },
    { state: "SLOT_PROPOSED", at: "2024-02-03T10:10:00Z", by: "sales" },
    { state: "SLOT_CONFIRMED", at: "2024-02-03T10:15:00Z", by: "lead" }
  ],
  
  // Validation & Conditions
  required_fields: {
    service_type: true,
    customer_contact: true,
    appointment_date: true,
    appointment_slot: true,
    payment: false // not required for this service
  },
  met_conditions: {
    service_type: true,
    customer_contact: true,
    appointment_date: true,
    appointment_slot: true,
    payment: null // not applicable
  },
  blocking_issues: [], // If any, prevent state transition
  
  // Payment (if applicable)
  payment_required: false,
  payment_amount: null,
  payment_method: null,
  payment_status: null,
  payment_transaction_id: null,
  
  // Show-up Tracking
  show_up_status: null, // null | true | false
  show_up_verified_at: null,
  show_up_verified_by: null,
  show_up_notes: "",
  
  // Rescheduling
  reschedule_count: 0,
  reschedule_reason: null,
  previous_booking_ids: [], // If rescheduled from another
  
  // Cancellation
  cancelled_at: null,
  cancelled_by: null, // "customer" | "provider" | "system"
  cancellation_reason: null,
  
  // Reminders & Communication
  reminder_sent_times: [
    { time: "2024-02-09T09:00:00Z", type: "24h_before", status: "sent" }
  ],
  last_communication_at: "2024-02-03T10:15:00Z",
  notes: "VIP customer, allergic to anesthesia X",
  
  // Metadata
  tags: ["new_customer", "referral"],
  custom_fields: {}, // For vertical-specific fields
  
  // Integration
  calendar_event_id: "google_calendar_event_id",
  external_booking_id: null, // If synced to other system
}
```

---

## 5. Validation Rules Engine

### 5.1 Validation Framework

```
When trying to transition to new state:

1. Check prerequisites
   └─ Does current state allow this transition?

2. Check blocking rules
   └─ Are all required fields filled?

3. Check conditions
   └─ Do external conditions allow? (e.g., slots available)

4. Check permissions
   └─ Does user have permission to make this change?

5. If all pass → Allow transition
   If any fail → Block + show reason + suggest fix
```

### 5.2 Blocking Rules Examples

**Rule 1: Cannot propose slot without service confirmed**
```
Rule: CANNOT transition to SLOT_PROPOSED
  if service_type == null

Error message:
"Không thể đề xuất lịch trước khi xác nhận dịch vụ.
Gợi ý: Hỏi khách: 'Bạn muốn làm dịch vụ nào?'"

Auto-fix suggestion:
"Gợi ý: {AI-suggested reply for asking about service}"
```

**Rule 2: Cannot confirm slot if no availability**
```
Rule: CANNOT transition to SLOT_CONFIRMED
  if appointment_date.hasAvailability() == false

Error message:
"Ngày T3 09:00 không còn slot. Vui lòng chọn lại ngày."

Available slots: T3 14:00, T4 10:00, T5 15:00
```

**Rule 3: Cannot move to REMINDER_SENT before 24h**
```
Rule: CANNOT transition to REMINDER_SENT
  if (appointment_time - now) > 24h

Reason: Reminder too early, customer might forget

Note: System will auto-transition when 24h mark reaches
```

### 5.3 Validation Checklist UI

```
When sales tries to move booking from INQUIRY to SERVICE_SELECTED:

┌────────────────────────────────────┐
│ BOOKING STATE CHANGE CHECK         │
│                                    │
│ Current: INQUIRY                   │
│ Next: SERVICE_SELECTED             │
│                                    │
│ Required fields for SERVICE_SELECTED│
│                                    │
│ ✓ Service type:                    │
│   "Bọc sứ toàn phục hồi"           │
│                                    │
│ ✓ Customer contact:                │
│   "0901234567"                     │
│                                    │
│ ⚠ First-time visit confirmation:   │
│   (Missing) → Ask: "Bạn từng khám  │
│   tại clinic này không?"            │
│                                    │
│ ✓ Conditions met: 5/5              │
│                                    │
│ [ALLOW] [CANCEL]                   │
└────────────────────────────────────┘
```

---

## 6. Slot Management System

### 6.1 Slot Definition

```javascript
{
  slot_id: "uuid",
  provider_id: "uuid",
  service_id: "uuid",
  date: "2024-02-10",
  start_time: "09:00",
  end_time: "09:30",
  duration_minutes: 30,
  
  // Slot availability
  status: "available", // available | reserved | booked | blocked
  booked_by: null, // booking_id if booked
  reserved_by: null, // user_id if reserved (during proposal)
  reservation_expires_at: null, // auto-release if not confirmed
  
  // Capacity
  max_capacity: 1,
  current_bookings: 0,
  can_double_book: false,
  
  // Rules
  min_notice_hours: 24, // Must book 24h before
  cancellation_allowed_until: "2024-02-09T09:00:00Z"
}
```

### 6.2 Slot Proposal Logic

```
When sales proposes slots to customer:

1. Query available slots
   - Filter by service_id
   - Filter by date range (next 7 days)
   - Filter by provider availability
   - Filter by min_notice_hours

2. Select best 3 slots
   - Prioritize preferred times (from lead profile or SOP)
   - Distribute across days (don't all offer same day)
   - Avoid too-far-future (don't propose 2 months out)

3. Format for customer
   - Show clear time display (Thứ 3, 10/02, 09:00)
   - Show what to expect (30 phút, cam kết không chờ, ...)
   - Include provider name if multi-provider

4. Reserve slots temporarily (30 min)
   - If customer confirms → book
   - If customer rejects → release slot back to pool
   - If 30 min passes → auto-release
```

### 6.3 Double Booking Prevention

```
When confirming slot:

1. Lock slot record
2. Check: is slot still available?
   - If booked by another → show error "Slot vừa mới bị book"
   - If available → continue
3. Update slot status to "booked"
4. Link booking_id to slot
5. Release lock

Race condition handling:
- Use database-level locking (SELECT FOR UPDATE)
- If lost race → suggest alternative slots
- Notify customer immediately
```

---

## 7. Reminders & Notifications

### 7.1 Reminder Strategy

```
Timeline for appointment on 2024-02-10 09:00:

T-7 days (2024-02-03 09:00): Confirmation reminder
       └─ "Nhắc nhở: Bạn có xác nhận appointment T3 10/02 lúc 09:00?"

T-3 days (2024-02-07 09:00): Preparation reminder
       └─ "Preparation: Vui lòng đến sớm 10 phút"

T-1 day (2024-02-09 09:00): 24-hour reminder
       └─ "Nhắc nhở: Ngày mai (T3 10/02) bạn có appointment nha"

T-2 hours (2024-02-10 07:00): Final reminder
       └─ "Nhắc nhở: Appointment của bạn trong 2 giờ"

T+30 min (2024-02-10 09:30): Show-up check
       └─ If not marked as show-up, send: "Bạn có tới không?"

Configuration:
- Each reminder type can be enabled/disabled per SOP
- Reminder timing can be customized
- Message templates can be personalized
```

### 7.2 Two-way Reminder with Response Tracking

```
System sends: "Bạn có xác nhận appointment T3 10/02 lúc 09:00 không?"

Customer responds:
- "Có" (Yes) → Auto-update: confirmed_by_reminder = true
- "Không" (No) → Trigger: reschedule flow
- "Thay đổi" (Change) → Trigger: reschedule flow
- No response → Auto-resend 6h later (configurable)
```

---

## 8. Reschedule & Cancellation Flows

### 8.1 Reschedule Flow

```
Customer says: "Tôi không thể đi được ngày 10, có thể thay đổi không?"

System detects: reschedule intent
       ↓
Transition: SLOT_CONFIRMED → RESCHEDULED
       ↓
Action sequence:
1. Log: reschedule_reason = "customer_cannot_attend"
2. Release current slot (back to available)
3. Propose new slots:
   - Query available slots
   - Filter by service + provider (same as before, or ask customer)
   - Show 3 options
4. If customer confirms new slot:
   - RESCHEDULED → SLOT_PROPOSED → SLOT_CONFIRMED (new)
   - Keep reference to previous booking_id
5. If customer cancels all:
   - → CANCELLED

Note:
- Reschedule count incremented
- If > 3 reschedules → flag as "unstable customer"
```

### 8.2 Cancellation Flow

```
Customer says: "Tôi không cần appointment nữa"

System detects: cancellation intent
       ↓
AI Assistant suggests:
"Xác nhận: Bạn muốn hủy appointment T3 10/02 09:00? 
Lý do: {customer said or ask}
[Xác nhận hủy] [Giữ lại]"
       ↓
(User approves cancellation)
       ↓
Transition: * → CANCELLED
       ↓
Action sequence:
1. Log: cancelled_by = "customer", cancellation_reason = "..."
2. Release slot (back to available)
3. If payment already made:
   - Calculate refund (policy-based)
   - Initiate refund process
   - Notify finance
4. Auto-offer: "Bạn có muốn rebook sau không?"
   - Yes → Go to SERVICE_SELECTED state
   - No → End flow, send: "Cảm ơn, chúng tôi mong sẽ gặp bạn lần tới"

Note:
- Keep booking record (don't delete)
- Use for analytics (why customers cancel)
```

---

## 9. Integration with SOP Enforcement

### 9.1 SOP-specific Booking Rules

```
Each organization can define SOP rules that affect booking:

SOP Rule Example (Clinic):
"For first-time dental patients:
  - Must confirm allergy/medical history
  - Must propose slot after medical history confirmed
  - Must send prep instructions 3 days before"

Mapping to booking engine:
- Add custom_field: "medical_history_confirmed" (required)
- Add validator: before SLOT_PROPOSED state
- Add reminder: 3 days before (auto-generate from prep docs)

Implementation:
booking.required_fields.medical_history = true
booking.met_conditions.medical_history = false
// blocking until confirmed
```

---

## 10. Analytics & Metrics

### 10.1 Booking Metrics Dashboard

```
Metrics to track:

Basic funnel:
- Inquiries: 100
- Service selected: 85 (85%)
- Slots proposed: 80 (80%)
- Confirmed: 60 (60%)
- Completed: 48 (48%)

No-show & cancellation:
- Total created: 60
- Completed: 48 (80%)
- No-show: 8 (13%)
- Cancelled: 4 (7%)

Timing metrics:
- Avg time from inquiry to confirmation: 2.5h
- Avg time from confirmation to appointment: 3.2 days
- Avg reschedule count: 0.3

Slot efficiency:
- Slots proposed: 95
- Slots confirmed: 60 (63% conversion)
- Slots wasted (not confirmed): 35
- Double-booking incidents: 0 (perfect!)
```

### 10.2 Logging for Audit

```json
Every state change is logged:
{
  "event_id": "uuid",
  "booking_id": "uuid",
  "timestamp": "2024-02-03T10:15:00Z",
  "event_type": "state_change",
  "from_state": "SLOT_PROPOSED",
  "to_state": "SLOT_CONFIRMED",
  "triggered_by": "customer", // customer | sales | system
  "triggered_by_id": "lead_xyz",
  "message_content": "Vâng, tôi xác nhận ngày T3 lúc 9h",
  "data_snapshot": {
    "appointment_date": "2024-02-10",
    "appointment_time": "09:00",
    "service_id": "uuid",
    "provider_id": "uuid"
  },
  "validation_passed": true,
  "validation_checks": [
    { rule: "service_confirmed", passed: true },
    { rule: "appointment_date_valid", passed: true },
    { rule: "slot_available", passed: true }
  ]
}
```

---

## 11. Edge Cases & Error Handling

### 11.1 Common Edge Cases

| Case | Handling |
|------|----------|
| **Customer books same slot twice** | Reject second booking in same state, suggest alternative |
| **Provider unavailable after slot confirmed** | Auto-reschedule customer (if possible), send apology + compensation offer |
| **Payment fails** | Stay in PAYMENT_PENDING, retry 3x, then offer alternative payment method |
| **Customer confirms but never responds to reminders** | After 3 reminders, auto-transition to NO_SHOW at appointment time |
| **Booking for time in the past** | Reject, show error: "Không thể booking cho thời gian trong quá khứ" |
| **Customer wants to book but all slots full** | Show waitlist option or suggest next available date |

---

## 12. Booking Engine API (Internal)

### 12.1 Core Methods

```python
class BookingEngine:
    
    def create_booking(lead_id, organization_id) -> Booking:
        """Create new booking, starts in INQUIRY state"""
        
    def get_available_slots(
        service_id, 
        date_range, 
        provider_id=None
    ) -> List[Slot]:
        """Get available slots for proposal"""
        
    def propose_slots(
        booking_id, 
        slot_ids: List[str]
    ) -> Booking:
        """Propose slots to customer"""
        
    def confirm_slot(
        booking_id, 
        selected_slot_id: str
    ) -> Booking:
        """Customer confirms a slot"""
        
    def request_reschedule(
        booking_id, 
        reason: str
    ) -> Booking:
        """Customer requests to reschedule"""
        
    def cancel_booking(
        booking_id, 
        reason: str, 
        cancelled_by: str  # customer | provider | system
    ) -> Booking:
        """Cancel booking"""
        
    def record_show_up(
        booking_id, 
        showed_up: bool,
        notes: str = ""
    ) -> Booking:
        """Record if customer showed up"""
        
    def validate_state_transition(
        booking_id, 
        target_state: str
    ) -> ValidationResult:
        """Check if transition is allowed"""
        
    def get_required_actions(booking_id) -> List[Action]:
        """Get SOP-based required actions"""
```

---

## 13. Future Enhancements (Phase 2+)

### 13.1 Smart Slot Proposal
- ML-based: suggest best times based on lead booking history
- A/B test different proposal strategies
- Measure impact on confirmation rate

### 13.2 Waitlist Management
- Auto-notify when slot becomes available
- Prioritize by waitlist order
- Integrate with queue management

### 13.3 Dynamic Pricing
- Adjust pricing based on demand (if slots filling fast)
- Offer discounts for off-peak times
- Volume discounts for recurring bookings

---

**Tài liệu liên quan:**
- [04_FEATURE_DETAILS.md](04_FEATURE_DETAILS.md)
- [05_AI_LOGIC_ARCHITECTURE.md](05_AI_LOGIC_ARCHITECTURE.md)
- [10_DATA_SCHEMA.md](10_DATA_SCHEMA.md)
- [11_METRICS_KPI.md](11_METRICS_KPI.md)

**Última actualización**: Feb 2026  
**Status**: In Review  
**Version**: 1.0-MVP
