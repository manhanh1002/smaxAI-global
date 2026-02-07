# PRD - AI-assisted Revenue Engine cho Booking-based Businesses

**Bộ tài liệu định dạng Markdown chi tiết cho nền tảng SaaS hỗ trợ AI chuyên biệt cho các doanh nghiệp dựa trên booking**

---

## 📋 Danh sách tài liệu trong bộ PRD

### 1. **[01_PRODUCT_OVERVIEW.md](01_PRODUCT_OVERVIEW.md)**
   - Tổng quan sản phẩm
   - Mục tiêu chiến lược
   - Định vị thị trường
   - ICP (Ideal Customer Profile)
   - Giá trị đề xuất

### 2. **[02_MARKET_PROBLEMS.md](02_MARKET_PROBLEMS.md)**
   - Vấn đề thị trường chi tiết
   - Pain points của từng ngành
   - Phân tích cạnh tranh
   - Gap analysis
   - Cơ hội thị trường

### 3. **[03_PRODUCT_SCOPE.md](03_PRODUCT_SCOPE.md)**
   - Phạm vi sản phẩm MVP
   - Core modules
   - In-scope vs Out-of-scope
   - Feature roadmap
   - Các giai đoạn phát triển

### 4. **[04_FEATURE_DETAILS.md](04_FEATURE_DETAILS.md)**
   - Chi tiết từng module
   - Tính năng chính
   - Quy trình làm việc
   - Không-chức-năng yêu cầu

### 5. **[05_AI_LOGIC_ARCHITECTURE.md](05_AI_LOGIC_ARCHITECTURE.md)** ⭐
   - Kiến trúc logic AI tổng thể
   - Nguyên tắc AI-assisted (không tự động)
   - Lưu đồ quyết định AI
   - Prompt engineering strategy
   - Context management
   - Model selection & fine-tuning

### 6. **[06_BOOKING_ORCHESTRATION_ENGINE.md](06_BOOKING_ORCHESTRATION_ENGINE.md)** ⭐
   - Chi tiết engine booking (CORE MOAT)
   - State machine workflow
   - Các trạng thái và điều kiện chuyển
   - Validation rules
   - Reschedule & cancellation flows
   - Integration points

### 7. **[07_UX_UI_FLOWS.md](07_UX_UI_FLOWS.md)** ⭐
   - User flows chi tiết
   - Screen wireframes description
   - Interaction patterns
   - Information architecture
   - Mobile & desktop considerations
   - Accessibility requirements

### 8. **[08_TECH_STACK_AI.md](08_TECH_STACK_AI.md)** ⭐
   - Kiến trúc backend
   - AI/ML stack chi tiết
   - LLM selection & integration
   - Vector database & embeddings
   - Open-source tools & libraries
   - Infrastructure requirements

### 9. **[09_INTEGRATION_PARTNERS.md](09_INTEGRATION_PARTNERS.md)**
   - Integration points
   - API specifications
   - WhatsApp Business API
   - Facebook Messenger
   - Email gateway
   - Calendar & booking systems
   - Third-party SOP templates

### 10. **[10_DATA_SCHEMA.md](10_DATA_SCHEMA.md)**
   - Database schema design
   - Lead data model
   - Conversation data structure
   - Booking state machine schema
   - SOP configuration schema
   - Analytics & metrics schema

### 11. **[11_METRICS_KPI.md](11_METRICS_KPI.md)**
   - Success metrics
   - KPI tracking
   - Dashboard specifications
   - Operational metrics
   - User engagement metrics
   - Business metrics

### 12. **[12_IMPLEMENTATION_ROADMAP.md](12_IMPLEMENTATION_ROADMAP.md)**
   - Chi tiết roadmap theo pha
   - Dependency mapping
   - Resource allocation
   - Risk management
   - Go-to-market strategy

---

## 🎯 Thông tin chính về sản phẩm

### Định vị
> **AI-Assisted Revenue Operations Platform for Booking & Lead-based Businesses**

Không dự đoán, không attribution, không tự động chốt – **AI đóng vai trò trợ lý & ép quy trình**.

### Mục tiêu chính
Xây dựng nền tảng SaaS tập trung vào:
- **Lead → Booking → Show-up**: chuyển đổi toàn chuỗi
- **AI hỗ trợ** thay vì tự động ra quyết định
- **Giảm thất thoát lead** và chuẩn hóa quy trình
- **Tăng tỉ lệ hoàn tất booking** với enforcement engine

### ICP (Ideal Customer Profile)
- **Clinics**: Nha khoa, Thẩm mỹ, Y tế
- **Education**: Academy, Training center, Du học
- **Beauty & Wellness**: Spa, Salon, Yoga
- **Local services**: Fitness, Consultation, Dịch vụ theo slot

### Core Modules
1. **Unified Conversation Context** - Gom WhatsApp, Messenger, Web chat, Email
2. **AI Conversation Assistant** - Hỗ trợ sales với gợi ý
3. **Booking Orchestration Engine** - State machine booking (CORE MOAT)
4. **Sales SOP Enforcement Engine** - Bắt buộc tuân thủ quy trình
5. **Human-in-the-loop Control** - Con người quyết định cuối
6. **Operational Metrics Dashboard** - Metrics không attribution

---

## 🔑 Nguyên tắc thiết kế chính

### 1. AI-Assisted, không Fully Automatic
- AI **gợi ý** không **quyết định**
- Sales **xác nhận** trước mỗi hành động
- Toàn bộ hành động được **ghi log**
- Con người **luôn kiểm soát** quy trình

### 2. Booking là State Machine, không đơn giản gửi link
- Booking có **các trạng thái rõ ràng**
- **Điều kiện validation** tại mỗi bước
- **Không thể bỏ qua** thông tin bắt buộc
- **Tracking vòng đời** từ proposal → show-up

### 3. SOP Enforcement
- **No-code SOP builder** cho mỗi ngành
- **Tự động validate** trước chuyển trạng thái lead
- **Checklist real-time** giúp sales
- **Dashboard quản lý** từng bước

### 4. Không Prediction, không Attribution
- Không dự đoán revenue
- Không attribution modeling
- **Operational metrics chỉ** (lead count, booking, show-up)
- Tập trung vào **process enforcement** không predict

---

## 🚀 Công nghệ chính

### LLM & AI
- **LLM chính**: Claude Opus 3.5 Sonnet (hoặc GPT-4 Turbo)
- **Embedding model**: Bge-large-en-v1.5
- **Vector DB**: Pinecone / Qdrant
- **Framework**: LangChain / LlamaIndex

### Backend
- **Language**: Python 3.11+
- **Framework**: FastAPI
- **Database**: PostgreSQL + Redis
- **Message Queue**: Celery + RabbitMQ

### Frontend
- **Web**: React 18 + TypeScript
- **Mobile**: React Native hoặc Flutter
- **State Management**: Redux / Zustand

### Infrastructure
- **Container**: Docker + Kubernetes
- **Cloud**: AWS / GCP
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack

---

## 📖 Cách sử dụng bộ PRD này

### Cho Product Managers
1. Đọc **01_PRODUCT_OVERVIEW.md** để hiểu tổng quan
2. Xem **03_PRODUCT_SCOPE.md** cho roadmap
3. Tham khảo **11_METRICS_KPI.md** để track progress

### Cho Engineers (Backend)
1. **08_TECH_STACK_AI.md** - Architecture & tech stack
2. **10_DATA_SCHEMA.md** - Database design
3. **06_BOOKING_ORCHESTRATION_ENGINE.md** - Core engine logic
4. **09_INTEGRATION_PARTNERS.md** - API specifications

### Cho Engineers (AI/ML)
1. **05_AI_LOGIC_ARCHITECTURE.md** - AI strategy
2. **08_TECH_STACK_AI.md** - LLM stack & models
3. **04_FEATURE_DETAILS.md** - AI features cụ thể

### Cho Designers (UX/UI)
1. **07_UX_UI_FLOWS.md** - User flows & wireframes
2. **04_FEATURE_DETAILS.md** - Feature details
3. **03_PRODUCT_SCOPE.md** - MVP scope

### Cho Leaders & Stakeholders
1. **01_PRODUCT_OVERVIEW.md** - Tổng quan
2. **02_MARKET_PROBLEMS.md** - Market opportunity
3. **12_IMPLEMENTATION_ROADMAP.md** - Go-to-market plan

---

## 📊 Cấu trúc folder

```
prd/
├── README.md (file này)
├── 01_PRODUCT_OVERVIEW.md
├── 02_MARKET_PROBLEMS.md
├── 03_PRODUCT_SCOPE.md
├── 04_FEATURE_DETAILS.md
├── 05_AI_LOGIC_ARCHITECTURE.md
├── 06_BOOKING_ORCHESTRATION_ENGINE.md
├── 07_UX_UI_FLOWS.md
├── 08_TECH_STACK_AI.md
├── 09_INTEGRATION_PARTNERS.md
├── 10_DATA_SCHEMA.md
├── 11_METRICS_KPI.md
└── 12_IMPLEMENTATION_ROADMAP.md
```

---

## 🔗 Mối quan hệ giữa các tài liệu

```
01_PRODUCT_OVERVIEW ──┬──> 02_MARKET_PROBLEMS
                      └──> 03_PRODUCT_SCOPE ──┬──> 04_FEATURE_DETAILS
                                             ├──> 07_UX_UI_FLOWS
                                             └──> 12_IMPLEMENTATION_ROADMAP

04_FEATURE_DETAILS ──┬──> 05_AI_LOGIC_ARCHITECTURE
                     ├──> 06_BOOKING_ORCHESTRATION_ENGINE
                     └──> 10_DATA_SCHEMA

08_TECH_STACK_AI ──┬──> 09_INTEGRATION_PARTNERS
                   └──> 10_DATA_SCHEMA

06_BOOKING_ORCHESTRATION_ENGINE
08_TECH_STACK_AI
10_DATA_SCHEMA ────> 11_METRICS_KPI

All ────────────────> 12_IMPLEMENTATION_ROADMAP
```

---

## 📝 Lịch sử cập nhật

| Phiên bản | Ngày | Ghi chú |
|-----------|------|--------|
| 1.0 | Feb 2026 | PRD ban đầu - MVP scope |
| - | - | - |

---

## ❓ FAQ về bộ PRD này

**Q: Sao chia thành nhiều file thay vì 1 file duy nhất?**
A: Để dễ quản lý, phân công và cập nhật từng phần độc lập. Mỗi file có thể được phát triển song song.

**Q: Thứ tự đọc như thế nào?**
A: Phụ thuộc vào vai trò:
- PM: 01 → 02 → 03 → 11 → 12
- Engineers: 08 → 10 → 05/06 → 09
- Designers: 07 → 04 → 03

**Q: Có cần update thường xuyên không?**
A: Có. Nên review & update sau mỗi sprint hoặc khi có thay đổi product.

**Q: Ai chịu trách nhiệm maintain bộ PRD?**
A: Product Manager chính + Tech Lead (cho phần AI & Tech stack)

---

## 📞 Liên hệ & Support

- **Product Owner**: [Tên]
- **Tech Lead**: [Tên]
- **Slack Channel**: #product-prd
- **Update frequency**: Bi-weekly review

---

**Última actualización**: Feb 2026
**Status**: Draft / In Review / Approved ✓
**Version**: 1.0-MVP
