# 🚀 START HERE - Bộ PRD AI-assisted Revenue Engine

## Welcome! 👋

Bạn đang xem một bộ **PRD (Product Requirements Document)** chi tiết cho một SaaS platform giúp các doanh nghiệp booking (clinic, academy, spa, fitness) quản lý lead, booking và tăng show-up rate.

---

## ⚡ TL;DR (Tóm tắt 30 giây)

**Sản phẩm:** AI-Assisted Revenue Engine for Booking Businesses

**Vấn đề cần giải quyết:**
- 🔴 Lead bị bỏ lỡ (20-30% drop rate)
- 🔴 No-show rate cao (20-30%)
- 🔴 Quy trình booking manual & không nhất quán

**Giải pháp:**
- ✅ AI hỗ trợ sales (gợi ý reply, missing info detection)
- ✅ Booking state machine (có điều kiện, không phải chỉ link)
- ✅ SOP enforcement (bắt buộc tuân thủ quy trình)

**Tech stack chính:**
- Backend: Python + FastAPI + PostgreSQL
- AI: Claude Opus Sonnet (LLM)
- Frontend: React + React Native

---

## 📚 Bộ PRD gồm 9 tài liệu

```
00_START_HERE.md ← You are here!
├── README.md ← Navigation guide
├── INDEX.md ← Danh sách chi tiết
│
├── 01_PRODUCT_OVERVIEW.md (Tổng quan)
├── 02_MARKET_PROBLEMS.md (Vấn đề)
├── 03_PRODUCT_SCOPE.md (Scope MVP)
├── 04_FEATURE_DETAILS.md (Chi tiết)
│
├── 05_AI_LOGIC_ARCHITECTURE.md ⭐ (Logic AI)
├── 06_BOOKING_ORCHESTRATION_ENGINE.md ⭐ (Core moat)
├── 07_UX_UI_FLOWS.md (UX/UI)
└── 08_TECH_STACK_AI.md ⭐ (Tech stack)
```

---

## 🎯 Bạn là ai? (Choose your path)

### 👨‍💼 Product Manager / Executive
**Bạn cần biết:** Vision, market, scope, strategy  
**Đọc theo thứ tự:**
1. README.md (2 phút)
2. 01_PRODUCT_OVERVIEW.md (10 phút)
3. 02_MARKET_PROBLEMS.md (8 phút)
4. 03_PRODUCT_SCOPE.md (8 phút)

**Total: ~30 phút** ✓ Bạn hiểu xong strategy

---

### 🎨 Designer (UX/UI)
**Bạn cần biết:** User flows, wireframes, design system  
**Đọc theo thứ tự:**
1. 07_UX_UI_FLOWS.md (15 phút)
2. 04_FEATURE_DETAILS.md (10 phút)
3. 06_BOOKING_ORCHESTRATION_ENGINE.md (10 phút - để hiểu business logic)

**Total: ~35 phút** ✓ Bạn sẵn sàng design

---

### 💻 Backend Engineer
**Bạn cần biết:** Architecture, database, APIs, core logic  
**Đọc theo thứ tự:**
1. 03_PRODUCT_SCOPE.md (8 phút - feature checklist)
2. 08_TECH_STACK_AI.md (20 phút - architecture & tech)
3. 06_BOOKING_ORCHESTRATION_ENGINE.md (15 phút - core engine)
4. 05_AI_LOGIC_ARCHITECTURE.md (10 phút - AI integration)

**Total: ~50 phút** ✓ Bạn sẵn sàng code

---

### 🤖 AI/ML Engineer
**Bạn cần biết:** AI strategy, LLM integration, prompt engineering  
**Đọc theo thứ tự:**
1. 05_AI_LOGIC_ARCHITECTURE.md (20 phút - AI strategy)
2. 08_TECH_STACK_AI.md (15 phút - LLM stack)
3. 04_FEATURE_DETAILS.md (10 phút - AI features)

**Total: ~45 phút** ✓ Bạn ready làm AI

---

### 🔧 DevOps / Infrastructure
**Bạn cần biết:** Infrastructure, deployment, monitoring  
**Đọc theo thứ tự:**
1. 08_TECH_STACK_AI.md (focus on DevOps section - 15 phút)
2. 03_PRODUCT_SCOPE.md (timeline - 5 phút)

**Total: ~20 phút** ✓ Bạn sẵn sàng setup infra

---

### 👥 Full Team / All-hands
**Bạn cần biết:** Everything  
**Recommended reading:**
1. README.md
2. 01_PRODUCT_OVERVIEW.md
3. 02_MARKET_PROBLEMS.md
4. Then dive deep by role

**Total: ~2-3 giờ** ✓ Full team alignment

---

## 🌟 Key Features (3 cột)

### 1️⃣ Unified Inbox
```
WhatsApp + Messenger + Web chat 
        ↓
   Một timeline duy nhất cho mỗi lead
        ↓
   Sales không bao giờ quên follow-up
```

### 2️⃣ AI-Assisted Sales
```
Conversation → AI analysis → Suggestions
                ↓
            Conversation summary
            Missing info detection
            Reply suggestions (2 options)
                ↓
            Sales approves → Send
            
"AI suggests, human decides"
```

### 3️⃣ Booking State Machine
```
INQUIRY → SERVICE_SELECTED → SLOT_PROPOSED
        → SLOT_CONFIRMED → REMINDER_SENT
        → COMPLETED / NO_SHOW

Mỗi step có điều kiện validation
Không thể skip required fields
```

---

## 💡 3 Reasons Why This Product is Good

### Reason 1: Market is huge
- **250,000+ booking-based businesses** trong Southeast Asia
- All need this: clinic, academy, beauty, fitness
- They're struggling with lead loss & no-show
- TAM: **$500M+**

### Reason 2: Technology is ready NOW
- Claude API (LLM) mature & affordable
- WhatsApp Business API stable
- No-code builders proven
- Timing perfect in 2024-2025

### Reason 3: Product has defensible moat
- **Booking state machine** - hard to copy
- **Vertical-specific templates** - deep knowledge
- **AI-assisted approach** - regulatory friendly
- **High switching cost** - workflow data locked in

---

## 📊 By The Numbers

| Metric | Value |
|--------|-------|
| **TAM (Total Addressable Market)** | $500M+ |
| **MVP timeline** | 3 months |
| **ICP: Booking businesses** | 250,000+ |
| **Core modules** | 6 modules |
| **Tech documents** | 8 docs |
| **Vertical templates (MVP)** | 3 templates |
| **Success metric: Lead retention** | 60% → 85% |
| **Success metric: No-show reduction** | 25% → 12% |

---

## 🛠️ Quick Facts

**Language:** Tiếng Việt (chủ yếu) + English (tech terms)  
**Format:** Markdown (.md files)  
**Total size:** ~150KB  
**Reading time:** 30 min (PM) - 3 hours (Full team)  
**Last updated:** Feb 2026  
**Status:** Draft / In Review  

---

## 🚀 Next Steps

### If you're a PM:
1. ✓ Finish reading this file
2. ✓ Read 01_PRODUCT_OVERVIEW.md
3. ✓ Schedule team reading session
4. ✓ Start recruiting design partners
5. ✓ Begin tech spike (Week 1-2)

### If you're an Engineer:
1. ✓ Finish reading this file
2. ✓ Read your role's recommended docs
3. ✓ Set up development environment
4. ✓ Create tech spike document
5. ✓ Start coding sprint

### If you're a Designer:
1. ✓ Finish reading this file
2. ✓ Read 07_UX_UI_FLOWS.md
3. ✓ Create wireframes from flows
4. ✓ Design system in Figma
5. ✓ Prototype core flows

---

## 📝 Document Quality

Each document includes:
- ✓ Clear structure (headings, sections)
- ✓ Diagrams & visual flows
- ✓ Code examples (where relevant)
- ✓ Real-world scenarios
- ✓ Decision reasoning
- ✓ Cross-references

---

## ❓ FAQs

**Q: Có phải phải đọc tất cả?**
A: Không! Đọc theo vai trò của bạn (xem mục "Choose your path" ở trên)

**Q: Tài liệu này có outdated không?**
A: Nó được update bi-weekly. Check "Last updated" date ở cuối mỗi file.

**Q: Có thể share ngoài không?**
A: Yes! It's designed for team alignment.

**Q: File nào quan trọng nhất?**
A: 
1. 06_BOOKING_ORCHESTRATION_ENGINE.md (core moat)
2. 05_AI_LOGIC_ARCHITECTURE.md (AI strategy)
3. 08_TECH_STACK_AI.md (technical blueprint)

**Q: Bắt đầu từ đâu?**
A: Bạn đang ở đây! Next: 01_PRODUCT_OVERVIEW.md

---

## 🎓 Learning Paths

### Path 1: PM Track (2 hours)
```
00_START_HERE
  ↓ (5 min)
README → 01 → 02 → 03
  ↓ (25 min)
Pick 2 deep-dives:
  ↓
06_BOOKING_ORCHESTRATION_ENGINE (15 min)
07_UX_UI_FLOWS (15 min)
  ↓ (30 min)
DONE ✓
```

### Path 2: Engineering Track (3 hours)
```
00_START_HERE
  ↓ (5 min)
README → 03_PRODUCT_SCOPE
  ↓ (15 min)
By specialty:
  
  Backend:
    08_TECH_STACK_AI (30 min)
    06_BOOKING_ORCHESTRATION_ENGINE (20 min)
    
  AI/ML:
    05_AI_LOGIC_ARCHITECTURE (30 min)
    08_TECH_STACK_AI (20 min)
    
  DevOps:
    08_TECH_STACK_AI (20 min)
    
Overlap reading:
    04_FEATURE_DETAILS (20 min)
  ↓ (120 min total)
DONE ✓
```

---

## 💬 Questions?

- **Product questions?** → Check 01_PRODUCT_OVERVIEW.md
- **Market validation?** → Check 02_MARKET_PROBLEMS.md
- **Feature scope?** → Check 03_PRODUCT_SCOPE.md
- **Design/UX?** → Check 07_UX_UI_FLOWS.md
- **Technical?** → Check 08_TECH_STACK_AI.md
- **AI strategy?** → Check 05_AI_LOGIC_ARCHITECTURE.md
- **Booking logic?** → Check 06_BOOKING_ORCHESTRATION_ENGINE.md

---

## ✨ Pro Tips

1. **Use Markdown viewer** - Open in VS Code for better formatting
2. **Bookmark this file** - Use as table of contents
3. **Share with your team** - Download & share all 9 files
4. **Create decision log** - As you read, note decisions & questions
5. **Schedule 1-hour sync** - Team discusses key sections together

---

## 🎯 What You'll Know After Reading

After reading the full PRD, you'll understand:

- ✅ **What** we're building (AI-assisted booking platform)
- ✅ **Why** the market needs it (huge TAM, real pain)
- ✅ **Who** we're serving (clinic, academy, beauty, fitness owners)
- ✅ **How** we're building it (state machine, AI-assisted, SOP enforcement)
- ✅ **With what** technology (Claude, FastAPI, React, PostgreSQL)
- ✅ **When** we launch (3-month MVP timeline)
- ✅ **How much** it costs (infrastructure & AI)

---

## 🚀 Ready to dive in?

### Your next step is ONE of these:

**If PM/Executive:**
→ Read [01_PRODUCT_OVERVIEW.md](01_PRODUCT_OVERVIEW.md)

**If Designer:**
→ Read [07_UX_UI_FLOWS.md](07_UX_UI_FLOWS.md)

**If Backend Engineer:**
→ Read [08_TECH_STACK_AI.md](08_TECH_STACK_AI.md)

**If AI/ML Engineer:**
→ Read [05_AI_LOGIC_ARCHITECTURE.md](05_AI_LOGIC_ARCHITECTURE.md)

**If DevOps:**
→ Read [08_TECH_STACK_AI.md](08_TECH_STACK_AI.md) (DevOps section)

**If Full team / All-hands:**
→ Read [README.md](README.md) first, then [01_PRODUCT_OVERVIEW.md](01_PRODUCT_OVERVIEW.md)

---

---

**Bộ tài liệu này được tạo để:**
- Align toàn team trên product vision
- Enable nhanh chóng development
- Làm reference cho future decisions
- Serve khách hàng & design partners

**Chúc bạn happy reading! 🎉**

---

*Última actualización: Feb 2026*  
*Status: Ready to share*  
*Version: 1.0-MVP*
