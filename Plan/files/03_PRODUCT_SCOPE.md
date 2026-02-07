# 03_PRODUCT_SCOPE.md - Phạm vi Sản phẩm (MVP)

## 1. MVP Scope - Phase 1

### 1.1 Core Modules IN Scope

```
┌─────────────────────────────────┐
│  MVP BOOKING OPERATIONS SYSTEM  │
└─────────────────────────────────┘

✓ UNIFIED CONVERSATION CONTEXT
  - Gom messages từ WhatsApp, Messenger, Web chat
  - Lead profile + conversation history
  - Real-time message sync

✓ AI CONVERSATION ASSISTANT
  - Conversation summary
  - Missing info detection
  - Reply suggestions (2 options)
  - NOT: Auto-send (always manual approval)

✓ BOOKING ORCHESTRATION ENGINE (CORE)
  - State machine (INQUIRY → ... → COMPLETED)
  - Slot management & proposal
  - Confirmation workflow
  - Reminder system

✓ SALES SOP ENFORCEMENT ENGINE
  - No-code SOP builder
  - State validation & blocking rules
  - Real-time checklist
  - SOP templates per vertical (clinic, academy, beauty)

✓ HUMAN-IN-THE-LOOP CONTROL
  - All AI actions need approval
  - Audit log of decisions
  - Role-based permissions (admin, manager, sales, staff)

✓ OPERATIONAL METRICS DASHBOARD
  - Lead count by source/date
  - Booking funnel metrics
  - Show-up rate
  - SOP compliance tracking
```

### 1.2 Core Modules OUT of Scope (Future)

```
✗ AI PREDICTION & SCORING
  - Lead scoring
  - Show-up probability
  - Churn prediction
  - (Reserved for Phase 2)

✗ REVENUE ATTRIBUTION
  - Campaign ROI
  - Channel attribution
  - Customer LTV
  - (Complex, defer to Phase 2)

✗ COMPLEX CRM
  - Deal tracking
  - Sales pipeline
  - Forecast
  - (Not needed for MVP)

✗ ADVANCED AUTOMATION
  - Auto-confirmation
  - Auto-rescheduling
  - Full bot conversations
  - (Requires more trust)

✗ VIDEO/CALL INTEGRATION
  - Video consultations
  - Phone call integration
  - (Focus on messaging first)

✗ INVENTORY MANAGEMENT
  - Product stock tracking
  - (Not needed for service businesses)
```

---

## 2. Feature List by Module

### 2.1 Unified Conversation Context

**Features:**
- [ ] Load WhatsApp conversations via WhatsApp Business API
- [ ] Load Messenger via Facebook Messenger API
- [ ] Web chat widget (Iframe-based)
- [ ] Email conversation thread grouping
- [ ] Lead profile (name, phone, tags, properties)
- [ ] Conversation timeline with metadata
- [ ] Message search & filtering
- [ ] Conversation tagging

**Not included:**
- ❌ SMS integration
- ❌ Video message handling
- ❌ Complex media management

---

### 2.2 AI Conversation Assistant

**Features:**
- [ ] Conversation summary (last 10 messages → 2-3 sentences)
- [ ] Missing field detection (with LLM analysis)
- [ ] Reply suggestion (2 options: Professional + Friendly)
- [ ] Intent classification (inquiry, booking ready, cancel, reschedule)
- [ ] Tone detection (urgent, casual, formal)
- [ ] Context awareness (lead history, SOP state)

**User interactions:**
- [ ] View suggestion
- [ ] Choose Option A or B
- [ ] Edit suggestion before sending
- [ ] Reject suggestion (log feedback)
- [ ] Send original message (no AI)

**Not included:**
- ❌ Auto-send
- ❌ Multi-language translation (yet)
- ❌ Advanced sentiment analysis

---

### 2.3 Booking Orchestration Engine (CORE)

**Features:**
- [ ] Booking state machine (10+ states)
- [ ] State transition validation
- [ ] Blocking rules enforcement
- [ ] Slot availability management
- [ ] Slot proposal workflow
- [ ] Confirmation workflow
- [ ] Payment integration (simple - just send link)
- [ ] Reminder scheduling (24h, 2h before)
- [ ] Show-up tracking (manual input)
- [ ] Reschedule flow
- [ ] Cancellation flow
- [ ] Booking history & audit log

**Integrations:**
- [ ] Calendar sync (Google Calendar read)
- [ ] Payment gateway (Stripe webhook for confirmation)
- [ ] SMS/WhatsApp reminder (via Twilio or similar)

**Not included:**
- ❌ Complex payment checkout
- ❌ Refund processing
- ❌ Capacity planning/analytics

---

### 2.4 Sales SOP Enforcement Engine

**Features:**
- [ ] No-code SOP builder (drag-drop states)
- [ ] Define required fields per state
- [ ] Define blocking rules
- [ ] Response templates per state
- [ ] Real-time checklist display
- [ ] Compliance scoring
- [ ] Pre-built templates (Clinic, Academy, Beauty)
- [ ] State validation before transition

**Customization:**
- [ ] Custom fields per vertical
- [ ] Custom state names
- [ ] Custom business rules

**Not included:**
- ❌ Advanced workflow logic (if-then-else)
- ❌ Conditional field visibility
- ❌ Dynamic rules based on data

---

### 2.5 Human-in-the-Loop Control

**Features:**
- [ ] Require approval for all AI suggestions
- [ ] Activity log (who did what, when)
- [ ] User roles (admin, manager, sales, staff)
- [ ] Permission matrix (RBAC)
- [ ] Audit trail export
- [ ] Reject feedback logging

**Not included:**
- ❌ Advanced permission granularity
- ❌ Approval workflows
- ❌ Delegation

---

### 2.6 Operational Metrics Dashboard

**Metrics:**
- [ ] Total leads by source (WhatsApp, Messenger, Web, Email)
- [ ] Lead by date
- [ ] Lead status distribution
- [ ] Booking created vs completed
- [ ] Booking cancellation rate
- [ ] No-show rate (manual input)
- [ ] Average response time (lead to first booking proposal)
- [ ] SOP compliance %
- [ ] Avg time in each state
- [ ] Slot utilization

**Visualizations:**
- [ ] Line charts (trends)
- [ ] Pie charts (distribution)
- [ ] Funnels
- [ ] Tables with filters

**Not included:**
- ❌ Predictive analytics
- ❌ Attribution modeling
- ❌ Forecasting

---

## 3. Platform Support

### 3.1 Platform Requirements

**Web:**
- [ ] Desktop application (React)
- [ ] Responsive design (tablet-friendly)
- [ ] Browser: Chrome, Firefox, Safari (last 2 versions)

**Mobile:**
- [ ] iOS app (React Native or Flutter)
- [ ] Android app (React Native or Flutter)
- [ ] Minimum iOS 13, Android 9

**Not included:**
- ❌ Desktop app (Windows/Mac)
- ❌ Progressive web app (yet)

---

## 4. Vertical-Specific Templates

### 4.1 Template 1: Clinic Dental

**SOP States:**
1. INQUIRY (Nhu cầu cơ bản)
2. PATIENT_HISTORY (Confirm bệnh sử)
3. SERVICE_SELECTED (Chọn dịch vụ & giá)
4. APPOINTMENT_PROPOSED (Đề xuất ngày giờ)
5. APPOINTMENT_CONFIRMED (Xác nhận)
6. PAYMENT_PENDING (Nếu cần thanh toán)
7. REMINDER_SENT (Nhắc 24h trước)
8. COMPLETED (Khách tới)
9. NO_SHOW (Khách không tới)
10. FOLLOW_UP (Follow-up sau khám)

**Required fields:**
- service_type, appointment_date, patient_phone, patient_history (allergy)

**Reminders:**
- T-7d: Confirmation
- T-3d: Prep instructions
- T-1d: Final reminder
- T-2h: Last reminder

---

### 4.2 Template 2: Academy Training

**SOP States:**
1. INQUIRY (Nhu cầu)
2. COURSE_SELECTED (Chọn khóa)
3. TRIAL_PROPOSED (Đề xuất trial)
4. TRIAL_CONFIRMED (Confirm)
5. ENROLLMENT_PROPOSED (Đề xuất enrollment)
6. PAID (Thanh toán)
7. CLASS_REMINDER (Nhắc trước class)
8. ATTENDED (Tới class)
9. NOT_ATTENDED (Không tới)
10. FOLLOW_UP (Follow-up)

**Required fields:**
- course_type, trial_date, student_level, contact_phone

---

### 4.3 Template 3: Beauty & Wellness

**SOP States:**
1. INQUIRY
2. SERVICE_SELECTED
3. SLOT_PROPOSED
4. SLOT_CONFIRMED
5. REMINDER_SENT
6. COMPLETED
7. NO_SHOW
8. REBOOKING (Follow-up for rebook)

**Required fields:**
- service_type, provider (stylist/therapist), appointment_date

---

## 5. Success Criteria (MVP Definition of Done)

### 5.1 Product Criteria

- [ ] Can manage 1000+ leads simultaneously
- [ ] AI suggestions accuracy >80%
- [ ] State transitions work without bugs
- [ ] All blocking rules enforced
- [ ] Reminders sent on time
- [ ] Show-up tracking works

### 5.2 User Experience Criteria

- [ ] Onboarding < 15 minutes
- [ ] Sales can send first suggestion within 30 seconds
- [ ] All core workflows < 5 clicks
- [ ] Mobile friendly
- [ ] No critical bugs (P0)

### 5.3 Business Criteria

- [ ] Can serve clinic customers
- [ ] Can serve academy customers
- [ ] Can serve beauty customers
- [ ] Signed 5-10 design partners
- [ ] NPS > 50 from beta users

---

## 6. Out of Scope (Decision Log)

### 6.1 Why not...?

**Q: Why not build full CRM?**
A: Scope creep. SMBs don't need deal tracking. Focus on booking operations only.

**Q: Why not support SMS?**
A: WhatsApp + Messenger cover 90% of SMB use case. SMS adds complexity without proportional value.

**Q: Why not auto-send replies?**
A: Trust issue. Sales still need to approve (especially for medical/educational).

**Q: Why not predict no-show?**
A: ML complexity + low ROI in MVP. Operational improvements (reminders) work better.

**Q: Why not support appointment types (group, 1-on-1)?**
A: Can be added later as enhancement.

---

## 7. Release Plan

### 7.1 MVP Timeline

```
Week 1-2: Foundation
- [ ] Database schema
- [ ] Core API endpoints
- [ ] Authentication (JWT)

Week 3-4: AI Layer
- [ ] LLM integration
- [ ] Conversation summary
- [ ] Missing info detection
- [ ] Reply suggestion

Week 5-6: Booking Engine
- [ ] State machine implementation
- [ ] Slot management
- [ ] Transition validation

Week 7-8: SOP Engine
- [ ] SOP builder UI
- [ ] Templates
- [ ] Enforcement rules

Week 9-10: Frontend
- [ ] Dashboard
- [ ] Conversation center
- [ ] Booking management

Week 11-12: Testing & Polish
- [ ] E2E testing
- [ ] Bug fixes
- [ ] Performance optimization

Total: ~3 months for MVP
```

---

**Tài liệu liên quan:**
- [01_PRODUCT_OVERVIEW.md](01_PRODUCT_OVERVIEW.md)
- [02_MARKET_PROBLEMS.md](02_MARKET_PROBLEMS.md)
- [04_FEATURE_DETAILS.md](04_FEATURE_DETAILS.md)

**Última actualización**: Feb 2026  
**Status**: In Review  
**Version**: 1.0-MVP
