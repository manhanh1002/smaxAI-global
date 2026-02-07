# 05_AI_LOGIC_ARCHITECTURE.md - Kiến trúc Logic AI

## 1. Tổng quan AI Architecture

### 1.1 Nguyên tắc lõi (Core Principle)

```
┌─────────────────────────────────────────────┐
│  AI-Assisted Revenue Engine Architecture   │
│                                             │
│  "AI gợi ý, Con người quyết định"          │
│  "AI suggests, Human decides"              │
└─────────────────────────────────────────────┘

        Human              AI
        ↓                 ↓
   ┌────────────────────────────────┐
   │   Conversation Context         │
   │   (Lead + History + Rules)     │
   └─────────────────┬──────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
    SUGGESTION LAYER        VALIDATION LAYER
    (What to do next)       (Enforce SOP)
        │                         │
        ├──→ AI replies           ├──→ Blocking rules
        ├──→ Missing info         ├──→ State validation
        ├──→ Next action          └──→ Checklist
        └──→ Context summary
        
        Human reviews → Approves → Execute → Log
```

---

## 2. AI Conversation Assistant - Chi tiết

### 2.1 Architecture

```
Lead Input (Message, Event, Action)
            ↓
    ┌───────────────────────────────┐
    │  1. CONTEXT ENRICHMENT        │
    │  - Load lead profile          │
    │  - Load conversation history  │
    │  - Load current SOP state     │
    │  - Load lead properties       │
    └───────────────────────────────┘
            ↓
    ┌───────────────────────────────┐
    │  2. AI ANALYSIS (LLM)         │
    │  - Summarize conversation     │
    │  - Detect missing info        │
    │  - Suggest next replies       │
    │  - Analyze intent             │
    └───────────────────────────────┘
            ↓
    ┌───────────────────────────────┐
    │  3. VALIDATION LAYER          │
    │  - Check SOP compliance       │
    │  - Apply blocking rules       │
    │  - Generate checklist         │
    │  - Add business context       │
    └───────────────────────────────┘
            ↓
    ┌───────────────────────────────┐
    │  4. UI PRESENTATION           │
    │  - Show suggestions           │
    │  - Highlight missing fields   │
    │  - Display checklist          │
    │  - Enable approve/edit        │
    └───────────────────────────────┘
```

### 2.2 LLM Model Selection

#### Primary Model: Claude Opus 3.5 Sonnet
**Lý do chọn:**
- Excellent at context understanding
- Good at following complex instructions
- Strong multi-turn conversation handling
- Cost-effective
- Fast inference (<2s)

**Fallback Model**: GPT-4 Turbo (if Claude unavailable)

**Usage tiers:**
| Task | Model | Context |
|------|-------|---------|
| Conversation summary | Claude Sonnet | Full history |
| Missing info detection | Claude Sonnet | Lead profile + conversation |
| Reply suggestion | Claude Opus | Full conversation + SOP |
| Intent classification | Claude Sonnet | Just message + context |

#### Fine-tuning Strategy (Future)
- Phase 2: Fine-tune small model (DistilBERT) for:
  - Intent classification (5 classes: greeting, inquiry, booking, cancel, reschedule)
  - Entity extraction (service type, date, slot)
  - Missing info detection
  
---

### 2.3 Prompt Engineering

#### System Prompt Template (Simplified)

```
You are a helpful sales assistant for a [VERTICAL] business.

CONTEXT:
- Customer profile: {lead_name}, {lead_phone}, {lead_source}
- Conversation history: {conversation_summary}
- Current SOP state: {current_state}
- Required fields: {required_fields}
- Missing fields: {missing_fields}

TASK: 
1. Summarize the conversation in 1-2 sentences (focus on intent)
2. List missing information in [Missing Info] section
3. Generate 2 reply options for the sales team:
   Option A: Formal/Professional
   Option B: Friendly/Casual
4. Suggest the next action (Book slot / Ask for budget / Send proposal)

RULES:
- Only suggest actions that match the SOP state
- Do not ask for info already known
- Be concise (max 3 sentences per suggestion)
- Always include a "why" for the suggestion
- Never assume information not mentioned

FORMAT:
[Conversation Summary]
...

[Missing Info]
- Field: reason why needed

[Reply Options]
Option A: ...
Option B: ...

[Next Action]
Action: [Action type]
Why: [Brief reason]
```

#### Example in Practice

**Input:**
```
Lead: Nguyễn Văn A
Phone: 0901234567
Channel: WhatsApp
SOP State: Initial Contact
Conversation:
  - Sales: "Xin chào Bạn A, clinic nha khoa chúng tôi có thể giúp gì?"
  - Lead: "Tôi muốn bọc sứ cho răng cửa, bao nhiêu tiền?"
  
Missing fields: appointment_date, service_type (need confirm), budget_range
```

**Expected Output (AI):**
```
[Conversation Summary]
Customer A wants porcelain crown for front teeth, interested in pricing.

[Missing Info]
- appointment_date: Need to check availability and propose a slot
- exact_service: Confirm if it's full crown vs veneer
- patient_history: Check if first-time visit

[Reply Options]
Option A (Professional):
"Cảm ơn Bạn A! Bọc sứ cho răng cửa của chúng tôi là [XX,000 VND]. 
Trước tiên, tôi cần biết:
1. Bạn có lịch khám thường xuyên với clinic nha khoa nào không?
2. Bạn có ngày nào trong tuần tới phù hợp để tham khảo?"

Option B (Casual):
"Chào Bạn A! Bọc sứ răng cửa giá [XX,000 VND] nha 😊 
Để cho Bạn tư vấn chi tiết nhất, clinic mình cần biết:
- Bạn khám nha khoa ở đâu trước đó?
- Tuần tới Bạn rảnh ngày nào?"

[Next Action]
Action: Propose Appointment Slot
Why: After confirming patient history, next step is to propose 2-3 time slots
```

---

### 2.4 Context Management Strategy

#### What's in Context

**Load from Database:**
1. **Lead Profile** (lightweight, ~500 chars)
   - Name, phone, email
   - Source, created_at
   - Tags, properties
   - Current SOP state

2. **Conversation History** (sliding window)
   - Last 10 messages (or until 3000 tokens)
   - Sender role (Sales/Lead)
   - Timestamp
   - Attachments metadata

3. **SOP Rules** (dynamic)
   - Current state allowed actions
   - Required fields for next state
   - Blocking rules
   - Response templates

#### Context Size Optimization

```
Total context budget: ~3000 tokens (Claude Sonnet)

Allocation:
- System prompt: ~600 tokens
- Lead profile: ~100 tokens
- Conversation history: ~1500 tokens
- SOP state: ~200 tokens
- Expected output: ~600 tokens

If conversation history > 1500 tokens:
  → Use conversation summarizer (separate call)
  → Keep only summary + last 5 messages
  → This reduces error from long context
```

#### Conversation Summarization (Helper Task)

```
Task: Summarize conversation for context window

Input: Full conversation history

Output format:
[Summary]: 2-3 key points about customer intent
[Key Info Extracted]:
  - Service: 
  - Preferred date:
  - Budget:
[Tone]: Professional / Casual / Urgent
[Current Stage]: Inquiry / Interested / Ready to book
```

---

## 3. Missing Info Detection Engine

### 3.1 Architecture

```
Conversation Analysis
        ↓
    ┌──────────────────────────────┐
    │ Extract Known Information    │
    │ (NER + Pattern matching)     │
    └──────────────────────────────┘
        ↓
    ┌──────────────────────────────┐
    │ Load Required Fields         │
    │ (From SOP definition)        │
    └──────────────────────────────┘
        ↓
    ┌──────────────────────────────┐
    │ Compare: Required vs Known   │
    │ + LLM judgment for implicit  │
    └──────────────────────────────┘
        ↓
    ┌──────────────────────────────┐
    │ Generate Suggestions         │
    │ (Why ask, How to ask)        │
    └──────────────────────────────┘
        ↓
    Missing Info List
    [Priority rank]
```

### 3.2 Field Detection Rules

#### Method 1: Pattern-based (Fast, deterministic)

```javascript
const fieldPatterns = {
  service_type: {
    patterns: [/bọc sứ|bọc nha|điều trị|tẩy trắng|cấy implant/i],
    example: "Customer mentions service name"
  },
  appointment_date: {
    patterns: [/hôm nay|ngày mai|tuần tới|\d{1,2}\/\d{1,2}/],
    example: "Customer mentions specific date/day"
  },
  phone_confirmed: {
    patterns: [/^(\+84|0)[0-9]{9}$/],
    example: "Phone number in valid format"
  },
  email: {
    patterns: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/],
    example: "Valid email format"
  }
};

// Usage:
for (const field in requiredFields) {
  const detected = fieldPatterns[field].patterns.some(p => p.test(conversation));
  knownFields[field] = detected;
}
```

#### Method 2: LLM-based (Accurate, can infer)

```
Task: Extract missing information

Conversation: [conversation]
Required fields: [list]

For each missing field, explain:
1. Why it's needed (business reason)
2. How to ask (suggested phrasing)
3. Inference: Can we infer from other data? (Y/N)

Example inference:
- If customer says "tuần tới Thứ Ba", 
  we know appointment_date = next Tuesday
- If customer is a clinic staff (source = walk-in),
  we can skip "first_time_visit" confirmation
```

---

## 4. AI Reply Suggestion Engine

### 4.1 Architecture

```
What to say? (Reply Suggestion)
        ↓
    ┌──────────────────────────────┐
    │ 1. Context Building          │
    │ - Lead intent                │
    │ - Missing fields             │
    │ - SOP rules for this state   │
    │ - Reply templates (if any)   │
    └──────────────────────────────┘
        ↓
    ┌──────────────────────────────┐
    │ 2. LLM Generation            │
    │ - Generate 2-3 options       │
    │ - Different tones            │
    │ - Different lengths          │
    └──────────────────────────────┘
        ↓
    ┌──────────────────────────────┐
    │ 3. Validation & Ranking      │
    │ - Check SOP compliance       │
    │ - Check tone match           │
    │ - Rank by relevance          │
    └──────────────────────────────┘
        ↓
    ┌──────────────────────────────┐
    │ 4. UI Presentation           │
    │ - Show top 2 options         │
    │ - Allow editing              │
    │ - Log which one used         │
    └──────────────────────────────┘
```

### 4.2 Reply Generation Prompt

```
You are a sales assistant for a [VERTICAL] business.

CONTEXT:
- Customer: {lead_name}
- Previous message: {last_customer_message}
- Conversation tone: {detected_tone}
- Current SOP state: {current_state}
- Missing fields: {missing_fields}
- Allowed templates: {templates}

TASK: Generate 2 reply options

Option A (Professional):
- Use formal tone
- Address customer by full name
- Include business context (clinic name, services)
- Be clear and structured

Option B (Friendly):
- Use casual tone
- More emoji/conversational
- Direct and quick
- Fit for chat platform

REQUIREMENTS:
1. Must ask for AT LEAST 1 missing field
2. Must stay within SOP for this state
3. Each reply <= 2 messages (respect chat flow)
4. Include specific next steps
5. Ask in priority order (most important first)

FORMAT:
[Option A - Professional]
Message 1: ...
Message 2: ...

[Option B - Friendly]
Message 1: ...
Message 2: ...

[Reasoning]
- Why these fields?
- Why this tone?
- Next action after reply?
```

---

## 5. Human-in-the-loop Control Mechanism

### 5.1 Approval Flow

```
AI Suggestion Generated
        ↓
┌───────────────────────────────┐
│  UI Shows Suggestion          │
│  - Option A (Professional)    │
│  - Option B (Friendly)        │
│  - Edit button                │
│  - Reject button              │
└───────────────────────────────┘
        ↓
    Human Decision
    ┌─────────────┬──────────────┬──────────┐
    │             │              │          │
   USE A      USE B (edit)    REJECT      (custom)
    │             │              │          │
    └─────────────┴──────────────┴──────────┘
            ↓
┌───────────────────────────────┐
│  Log the Decision             │
│  - Which option              │
│  - Any edits made            │
│  - Timestamp                 │
│  - User role                 │
└───────────────────────────────┘
            ↓
        Send Message
            ↓
    Update Conversation Log
```

### 5.2 Rejection Feedback Loop

**When user rejects AI suggestion:**
```
User clicks REJECT
        ↓
    Show dialog:
    "Why did you reject this? (optional)"
    - Too formal
    - Too casual
    - Missing information
    - Wrong action
    - Other: [text field]
        ↓
    Log feedback: {suggestion_id, reason}
        ↓
    (Later) Use for model fine-tuning
```

---

## 6. State Machine Intelligence

### 6.1 Smart State Transitions

```
Current State: Service Selected

LLM analyzes conversation:
"Customer mentioned: 'Thứ Ba tuần tới nha'"

Smart Detection:
- Has service? Yes (already selected)
- Has appointment_date? Yes (Tues next week)
- Has contact confirmed? Yes (phone from profile)

Question: Can we auto-move to next state?

Rules:
1. If ALL required fields present → Suggest state change
2. If required field MISSING → Suggest ask before moving
3. If customer said "không, tôi không muốn" → Mark as dropped
4. If no activity for 3 days → Mark as abandoned

Action:
- Suggest to sales: "Information complete! Ready to propose slot"
- Wait for sales approval
- Move state only after human confirms
```

### 6.2 Blocking Rules

**State Machine Guards:**
```
CAN NOT move from "Service Selected" to "Slot Proposed"
UNLESS:
✓ service_type confirmed (not null)
✓ appointment_date provided
✓ customer_contact valid

IF missing any:
→ Show blocking message
→ Auto-focus the missing field
→ AI generates ask for that field
→ Wait for input before allowing state change
```

---

## 7. LLM Cost & Performance Optimization

### 7.1 Cost Strategy

**Tiered approach:**

```
High Value (full Claude Opus):
- Reply suggestions (customer-facing)
- Complex conversation analysis
- Estimated: 100 calls/month per lead

Medium Value (Claude Sonnet):
- Missing info detection
- Conversation summarization
- Intent classification
- Estimated: 500 calls/month per lead

Low Value (Rule-based):
- Field extraction (pattern matching)
- State validation
- Checklist generation
- Cost: ~0

Average Cost per Lead:
- Small lead (1-2 interactions): 5K VND
- Medium lead (3-5 interactions): 15K VND
- Large lead (10+ interactions): 30K VND
- Margin: keep <20% of subscription revenue
```

### 7.2 Caching & Optimization

```
Request Pattern:
1. Load lead context → Cache 1 hour
2. Load SOP rules → Cache 24 hours
3. Summarize conversation → Cache until new message
4. LLM call → No cache (real-time needed)

Estimated token usage per call:
- System prompt: 500
- Context: 1500
- Request: 300
- Expected output: 600

Total: ~2900 tokens/call = ~0.1 VND/call
10 calls/lead/month = 1K VND/lead/month
= Acceptable margin
```

---

## 8. Error Handling & Fallback

### 8.1 LLM Failure Scenarios

```
Scenario 1: LLM API timeout
→ Show cached last suggestion or
→ Show template-based suggestion
→ Log error for monitoring

Scenario 2: LLM returns malformed JSON
→ Parse best effort
→ Fall back to template
→ Alert operations

Scenario 3: LLM understanding error
→ User rejects suggestion
→ Log feedback
→ Show alternative suggestions
→ Escalate to human review if repeated
```

---

## 9. Monitoring & Observability

### 9.1 Key Metrics to Track

```
AI Quality:
- Suggestion acceptance rate (Target: >80%)
- Rejection reasons (categorize)
- Time to acceptance (Target: <30s)
- Cost per suggestion

AI Accuracy:
- Missing info detection accuracy (>90%)
- State transition correctness (>95%)
- Reply relevance (A/B test)

User Experience:
- Time saved per lead (Target: 30% reduction)
- User satisfaction with suggestions
- NPS for AI features
```

### 9.2 Logging Requirements

**Every AI interaction must log:**
```json
{
  "interaction_id": "uuid",
  "timestamp": "ISO8601",
  "lead_id": "uuid",
  "ai_task": "reply_suggestion|missing_info|state_transition",
  "model_used": "claude-opus-3-5-sonnet",
  "prompt_tokens": 2300,
  "completion_tokens": 450,
  "cost_cents": 5,
  "latency_ms": 1200,
  "suggestion": {...},
  "user_action": "approved|rejected|edited",
  "feedback": "if any",
  "final_output": "what was actually sent"
}
```

---

## 10. Future AI Enhancements (Phase 2+)

### 10.1 Fine-tuning & Custom Models

```
Data collection (Phase 1):
- Collect 1000+ conversation pairs
- Annotate for:
  - Intent
  - Missing fields
  - Best reply tone
  - State transitions

Model fine-tuning (Phase 2):
- Fine-tune small model (DistilBERT, 6B params)
- Cost: ~50K VND/month inference vs 100K+ Claude
- Performance: 95%+ accuracy on intent/entity

Custom vocabulary:
- Build vertical-specific NER
  (clinic terms, education terms, spa terms)
```

### 10.2 Semantic Search with Embeddings

```
Use case:
- When new lead comes in, find similar past leads
- Suggest SOP/templates from similar contexts
- Improve suggestion relevance

Implementation:
- Embed each conversation with sentence-transformer
- Store in Pinecone (vector DB)
- Similarity search: find top 3 similar conversations
- Use as few-shot examples for LLM

Cost: ~1K VND/lead stored
Benefit: +10-15% suggestion quality
```

---

## 11. AI Architecture Diagram (Complete)

```
┌─────────────────────────────────────────────────────────┐
│                  USER INTERACTION LAYER                 │
│  Sales Interface ← Response ← AI Suggestions            │
└────────────┬────────────────────────────────────────────┘
             │
    ┌────────▼──────────────────────────────┐
    │   REQUEST HANDLER (FastAPI)           │
    │   - Route to appropriate AI task      │
    │   - Load context                      │
    │   - Call LLM                          │
    │   - Validate output                   │
    │   - Return to UI                      │
    └────────┬──────────────────────────────┘
             │
    ┌────────▼─────────────────────────────────────────┐
    │         AI MODULES (Parallel Processing)         │
    │                                                  │
    │  ┌──────────────┐  ┌──────────────────────┐    │
    │  │ Conversation │  │ Missing Info         │    │
    │  │ Summarizer   │  │ Detector             │    │
    │  └──────────────┘  └──────────────────────┘    │
    │                                                  │
    │  ┌──────────────┐  ┌──────────────────────┐    │
    │  │ Reply        │  │ State Transition     │    │
    │  │ Suggester    │  │ Evaluator            │    │
    │  └──────────────┘  └──────────────────────┘    │
    └────────┬─────────────────────────────────────────┘
             │
    ┌────────▼──────────────────────────────┐
    │   LLM INTERFACE (LangChain)           │
    │   - Route to Claude/GPT               │
    │   - Handle retries                    │
    │   - Cost tracking                     │
    │   - Latency monitoring                │
    └────────┬──────────────────────────────┘
             │
    ┌────────▼──────────────────────────────┐
    │   LLM MODELS                          │
    │   - Claude Opus 3.5 Sonnet (primary) │
    │   - Claude Sonnet (fallback)         │
    │   - GPT-4 Turbo (future)             │
    └────────┬──────────────────────────────┘
             │
    ┌────────▼──────────────────────────────┐
    │   DATA LAYER                          │
    │   - PostgreSQL (lead, conversation)  │
    │   - Redis (cache, session)           │
    │   - Pinecone (embeddings - future)   │
    └───────────────────────────────────────┘
```

---

**Tài liệu liên quan:**
- [04_FEATURE_DETAILS.md](04_FEATURE_DETAILS.md)
- [06_BOOKING_ORCHESTRATION_ENGINE.md](06_BOOKING_ORCHESTRATION_ENGINE.md)
- [08_TECH_STACK_AI.md](08_TECH_STACK_AI.md)
- [10_DATA_SCHEMA.md](10_DATA_SCHEMA.md)

**Última actualización**: Feb 2026  
**Status**: In Review  
**Version**: 1.0-MVP
