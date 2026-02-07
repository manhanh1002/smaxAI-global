# INDEX - Bộ PRD AI-assisted Revenue Engine

## 📑 Danh sách tài liệu

### 1. **README.md** (Điểm khởi đầu)
   - Tổng quan về bộ PRD
   - Cách sử dụng cho từng vai trò
   - Liên hệ & support

### 2. **01_PRODUCT_OVERVIEW.md** (Tổng quan sản phẩm)
   - Giới thiệu chung
   - Mục tiêu chiến lược
   - Định vị thị trường
   - ICP & Giá trị đề xuất
   - Nguyên tắc thiết kế

### 3. **02_MARKET_PROBLEMS.md** (Vấn đề thị trường)
   - Pain points chính (lead loss, no-show, chaos booking)
   - Phân tích cạnh tranh
   - Market opportunity
   - Validation từ khách hàng

### 4. **03_PRODUCT_SCOPE.md** (Phạm vi MVP)
   - Core modules IN/OUT of scope
   - Feature list chi tiết
   - Vertical-specific templates
   - Release plan timeline

### 5. **04_FEATURE_DETAILS.md** (Chi tiết tính năng)
   - Module 1: Unified Conversation Context
   - Module 2: AI Conversation Assistant
   - Module 3: Booking Orchestration
   - Module 4: SOP Enforcement
   - Module 5: Human-in-the-loop Control

### 6. **05_AI_LOGIC_ARCHITECTURE.md** ⭐ (AI Logic - QUAN TRỌNG)
   - AI Architecture tổng thể
   - LLM Model Selection & Integration
   - Prompt Engineering Strategy
   - Context Management
   - Missing Info Detection
   - Reply Suggestion Engine
   - Cost & Performance Optimization
   - Error Handling & Fallback

### 7. **06_BOOKING_ORCHESTRATION_ENGINE.md** ⭐ (Booking Engine - CORE MOAT)
   - State Machine chi tiết
   - Transition Rules Matrix
   - Booking Data Model
   - Validation Rules
   - Slot Management System
   - Reminders & Notifications
   - Reschedule & Cancellation
   - Analytics & Metrics

### 8. **07_UX_UI_FLOWS.md** (UX/UI & Flows)
   - Information Architecture
   - Core User Flows (3 flows chính)
   - Screen Wireframes
   - Mobile Experience
   - Design System
   - Accessibility Requirements

### 9. **08_TECH_STACK_AI.md** ⭐ (Tech Stack - TECHNICAL)
   - Architecture Overview (Diagram)
   - Backend Stack (FastAPI, PostgreSQL, etc.)
   - Database Schema (SQL)
   - LLM Integration Stack (Claude, Anthropic API)
   - Embedding & Vector DB (Pinecone, bge-large)
   - Frontend Stack (React, React Native)
   - DevOps & Infrastructure (Docker, K8s, Pulumi)
   - Monitoring & Observability
   - Open Source Tools & Libraries
   - Cost Estimation
   - Performance Optimization
   - Security

## 🎯 Quick Navigation by Role

### For Product Managers
**Essential reading:**
1. README.md
2. 01_PRODUCT_OVERVIEW.md
3. 02_MARKET_PROBLEMS.md
4. 03_PRODUCT_SCOPE.md

**Nice to have:**
- 06_BOOKING_ORCHESTRATION_ENGINE.md (core moat)
- 07_UX_UI_FLOWS.md (user experience)

---

### For Designers (UX/UI)
**Essential reading:**
1. 07_UX_UI_FLOWS.md
2. 04_FEATURE_DETAILS.md
3. 01_PRODUCT_OVERVIEW.md

**Reference:**
- 03_PRODUCT_SCOPE.md (scope)
- 06_BOOKING_ORCHESTRATION_ENGINE.md (user mental model)

---

### For Backend Engineers
**Essential reading:**
1. 08_TECH_STACK_AI.md
2. 06_BOOKING_ORCHESTRATION_ENGINE.md
3. 05_AI_LOGIC_ARCHITECTURE.md

**Implementation guides:**
- 03_PRODUCT_SCOPE.md (what to build)
- 04_FEATURE_DETAILS.md (details)

**Reference:**
- 07_UX_UI_FLOWS.md (user flows)

---

### For AI/ML Engineers
**Essential reading:**
1. 05_AI_LOGIC_ARCHITECTURE.md
2. 08_TECH_STACK_AI.md
3. 04_FEATURE_DETAILS.md (AI modules)

**Details:**
- 06_BOOKING_ORCHESTRATION_ENGINE.md (where AI fits)
- 07_UX_UI_FLOWS.md (user experience of AI)

---

### For DevOps/Infrastructure
**Essential reading:**
1. 08_TECH_STACK_AI.md (entire file, focus on infrastructure section)
2. 03_PRODUCT_SCOPE.md (project timeline)

---

### For Business/Stakeholders
**Essential reading:**
1. README.md
2. 01_PRODUCT_OVERVIEW.md
3. 02_MARKET_PROBLEMS.md
4. (Then any document based on specific interest)

---

## 🔑 Key Concepts

### AI-Assisted (not Full Automation)
- AI suggests, human decides
- All actions need approval
- Full audit trail
- See: **05_AI_LOGIC_ARCHITECTURE.md**

### Booking State Machine
- Booking is a series of states with conditions
- Not just a link
- Validation at each step
- See: **06_BOOKING_ORCHESTRATION_ENGINE.md**

### SOP Enforcement
- No-code builder
- Blocking rules
- Real-time checklist
- See: **03_PRODUCT_SCOPE.md** & **04_FEATURE_DETAILS.md**

### Vertical-specific
- Clinic SOP ≠ Academy SOP
- Pre-built templates
- Customizable
- See: **03_PRODUCT_SCOPE.md**

### No Prediction, No Attribution
- Only operational metrics
- Focus on process, not predict
- Simple & transparent
- See: **01_PRODUCT_OVERVIEW.md**

---

## 📊 Document Statistics

| Document | Pages | Focus | Audience |
|----------|-------|-------|----------|
| README | 2 | Overview & navigation | All |
| 01_PRODUCT_OVERVIEW | 3 | Product vision & strategy | PM, Executive |
| 02_MARKET_PROBLEMS | 2 | Market validation | PM, Executive |
| 03_PRODUCT_SCOPE | 2 | MVP definition | PM, Engineering |
| 04_FEATURE_DETAILS | 2 | Features deep dive | Engineering, Designer |
| 05_AI_LOGIC_ARCHITECTURE | 3 | AI implementation | AI/ML, Backend |
| 06_BOOKING_ORCHESTRATION_ENGINE | 3 | Core moat | Backend, All |
| 07_UX_UI_FLOWS | 2 | UX design | Designer, PM |
| 08_TECH_STACK_AI | 4 | Technology stack | Backend, DevOps, AI/ML |

**Total: ~23 pages of detailed PRD**

---

## 🚀 How to Use This PRD

### Step 1: Understand the Vision
Read: README.md → 01_PRODUCT_OVERVIEW.md

### Step 2: Validate the Market
Read: 02_MARKET_PROBLEMS.md

### Step 3: Know the Scope
Read: 03_PRODUCT_SCOPE.md

### Step 4: Go Deep
Based on your role, read:
- **Designers**: 07_UX_UI_FLOWS.md + 04_FEATURE_DETAILS.md
- **Engineers**: 08_TECH_STACK_AI.md + 06_BOOKING_ORCHESTRATION_ENGINE.md
- **AI/ML**: 05_AI_LOGIC_ARCHITECTURE.md
- **All teams**: 06_BOOKING_ORCHESTRATION_ENGINE.md (core moat)

### Step 5: Stay Updated
- Review bi-weekly in team syncs
- Update when product changes
- Add decisions to Decision Log (future version)

---

## 💡 Key Questions Answered by PRD

**"What are we building?"**
→ 01_PRODUCT_OVERVIEW.md + 03_PRODUCT_SCOPE.md

**"Why does the market need this?"**
→ 02_MARKET_PROBLEMS.md + 01_PRODUCT_OVERVIEW.md

**"How does the user use it?"**
→ 07_UX_UI_FLOWS.md + 04_FEATURE_DETAILS.md

**"How do we build it?"**
→ 08_TECH_STACK_AI.md + 06_BOOKING_ORCHESTRATION_ENGINE.md + 05_AI_LOGIC_ARCHITECTURE.md

**"What are the core moat features?"**
→ 06_BOOKING_ORCHESTRATION_ENGINE.md + 05_AI_LOGIC_ARCHITECTURE.md

**"What's NOT in scope?"**
→ 03_PRODUCT_SCOPE.md (section 4)

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 2026 | Initial MVP PRD |
| - | - | (Future updates) |

---

## 🔗 Related Resources

### Public Documentation
- [Anthropic Claude API](https://docs.claude.com)
- [FastAPI](https://fastapi.tiangolo.com)
- [SQLAlchemy](https://www.sqlalchemy.org)
- [LangChain](https://python.langchain.com)

### Design Tools
- Figma (for UI design from wireframes)
- FigJam (for collaboration)

### Development Tools
- Docker for containerization
- GitHub for version control
- Sentry for error tracking

---

## ❓ FAQ

**Q: Can I share this PRD externally?**
A: Yes, it's designed for team alignment. Share with design partners and stakeholders.

**Q: How often should this be updated?**
A: Bi-weekly or when product direction changes.

**Q: Which section is most important?**
A: 06_BOOKING_ORCHESTRATION_ENGINE.md (core moat) and 05_AI_LOGIC_ARCHITECTURE.md (AI strategy)

**Q: Can we start development with this PRD?**
A: Yes, it's MVP-ready. Use 03_PRODUCT_SCOPE.md as the feature checklist.

**Q: Is there a technical specification document?**
A: 08_TECH_STACK_AI.md contains technical specs. 06_BOOKING_ORCHESTRATION_ENGINE.md contains the domain model.

**Q: Who should approve this PRD?**
A: Product Manager + Tech Lead + Design Lead

---

## 📞 Support & Updates

**Document Owner**: [Product Manager Name]  
**Tech Owner**: [Tech Lead Name]  
**Last Updated**: Feb 2026  
**Next Review**: (Bi-weekly)  

---

**Document Format**: Markdown (.md)  
**Total Size**: ~150KB  
**Readability**: ✓ GitHub-compatible, ✓ CLI-friendly  

---

Enjoy building! 🚀
