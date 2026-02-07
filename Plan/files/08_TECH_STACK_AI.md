# 08_TECH_STACK_AI.md - Tech Stack AI & Infrastructure

## 1. Architecture Overview

### 1.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Web UI      │  │  Mobile App  │  │  Admin       │     │
│  │  React 18    │  │  React Native│  │  Dashboard   │     │
│  │  TypeScript  │  │  Flutter     │  │  React       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────┬──────────────────────────────────────┘
                     │ (REST API + WebSocket)
┌────────────────────▼──────────────────────────────────────┐
│                    API GATEWAY LAYER                        │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ FastAPI + Uvicorn                                   │  │
│  │ - Authentication (JWT, OAuth2)                      │  │
│  │ - Rate limiting                                     │  │
│  │ - CORS handling                                     │  │
│  │ - Request validation (Pydantic)                     │  │
│  └─────────────────────────────────────────────────────┘  │
└────────┬──────────────┬──────────────┬────────────────────┘
         │              │              │
    ┌────▼──┐   ┌──────▼────┐   ┌─────▼──────┐
    │ LLM   │   │  Booking  │   │  Integration│
    │ Routes│   │  Engine   │   │  Routes    │
    │       │   │  Routes   │   │            │
    └────┬──┘   └──────┬────┘   └─────┬──────┘
         │              │              │
┌────────▼──────────────▼──────────────▼──────────────────────┐
│                   BUSINESS LOGIC LAYER                       │
│                                                              │
│  ┌────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │ AI Assistant   │  │ Booking Engine   │  │ SOP Engine │ │
│  │ Services       │  │ (State machine)  │  │ (Rules)    │ │
│  └────────────────┘  └──────────────────┘  └────────────┘ │
│                                                              │
│  ┌────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │ Lead Manager   │  │ Conversation     │  │ Analytics  │ │
│  │               │  │ Manager          │  │            │ │
│  └────────────────┘  └──────────────────┘  └────────────┘ │
└────┬──────────┬──────────────┬───────────┬──────────────────┘
     │          │              │           │
┌────▼──────────▼──────────────▼───────────▼──────────────────┐
│                   DATA ACCESS LAYER                          │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ORM Layer (SQLAlchemy)                              │   │
│  │ - Lead/Conversation/Booking models                  │   │
│  │ - SOP configuration models                          │   │
│  │ - User/Organization models                          │   │
│  └─────────────────────────────────────────────────────┘   │
└────┬──────────────────────────────────────────────────────┘
     │
     ├─────────────┬─────────────┬──────────────┬──────────┐
     │             │             │              │          │
┌────▼─────┐  ┌────▼────┐  ┌────▼────┐  ┌─────▼──┐  ┌────▼───┐
│PostgreSQL│  │  Redis  │  │ Pinecone│  │ S3     │  │Message │
│          │  │  Cache  │  │ Vector DB  │Bucket │  │Queue   │
│  (Primary)  │ (Session)   │(Embeddings)│(Files)│  │RabbitMQ│
└──────────┘  └─────────┘  └─────────┘  └────────┘  └────────┘
```

---

## 2. Backend Stack

### 2.1 Core Backend Technologies

| Component | Technology | Version | Reason |
|-----------|-----------|---------|--------|
| **Language** | Python | 3.11+ | Fast dev, great ML ecosystem |
| **Web Framework** | FastAPI | 0.104+ | Async-first, type-safe, OpenAPI |
| **Server** | Uvicorn | 0.24+ | ASGI server, production-ready |
| **ORM** | SQLAlchemy | 2.0+ | Powerful, flexible, async support |
| **Database Driver** | asyncpg | 0.29+ | Async PostgreSQL driver |
| **Task Queue** | Celery | 5.3+ | Distributed task processing |
| **Message Broker** | RabbitMQ | 3.12+ | Robust, reliable, clustering |
| **Cache** | Redis | 7.0+ | Fast, flexible data structure store |
| **Environment** | python-dotenv | 1.0+ | Config management |
| **Logging** | structlog | 23.2+ | Structured logging, JSON output |
| **Testing** | pytest | 7.4+ | Testing framework |

### 2.2 Database Schema (PostgreSQL)

#### Core Tables

```sql
-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  plan_type VARCHAR(50), -- starter, professional, enterprise
  vertical VARCHAR(50), -- clinic, academy, beauty, fitness
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  role VARCHAR(50), -- admin, manager, sales, staff
  created_at TIMESTAMP DEFAULT NOW()
);

-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  phone VARCHAR(20),
  name VARCHAR(255),
  email VARCHAR(255),
  source VARCHAR(50), -- whatsapp, messenger, web, email, call
  source_id VARCHAR(255), -- phone number, messenger ID, etc.
  tags JSONB DEFAULT '{}'::jsonb,
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP,
  UNIQUE(organization_id, source, source_id)
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  channel VARCHAR(50), -- whatsapp, messenger, web_chat, email
  channel_id VARCHAR(255), -- chat thread ID, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  sender_type VARCHAR(20), -- lead, sales, system
  sender_id VARCHAR(255), -- user_id or lead_id
  content TEXT,
  message_type VARCHAR(50), -- text, image, file, suggestion, system
  metadata JSONB, -- attachments, AI metadata
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT one_type_per_message CHECK (sender_type IN ('lead', 'sales', 'system'))
);

-- Bookings (CORE)
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) NOT NULL,
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  state VARCHAR(50) NOT NULL, -- INQUIRY, SERVICE_SELECTED, etc.
  state_history JSONB DEFAULT '[]'::jsonb,
  
  service_id UUID,
  service_name VARCHAR(255),
  provider_id UUID,
  provider_name VARCHAR(255),
  location_id UUID,
  
  appointment_date DATE,
  appointment_time TIME,
  appointment_end_time TIME,
  
  required_fields JSONB,
  met_conditions JSONB,
  blocking_issues JSONB DEFAULT '[]'::jsonb,
  
  payment_required BOOLEAN DEFAULT false,
  payment_status VARCHAR(50),
  payment_amount DECIMAL(10, 2),
  
  show_up_status BOOLEAN, -- null, true, false
  show_up_verified_at TIMESTAMP,
  
  reschedule_count INTEGER DEFAULT 0,
  cancelled_at TIMESTAMP,
  cancelled_by VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_lead_id (lead_id),
  INDEX idx_state (state),
  INDEX idx_appointment_date (appointment_date)
);

-- SOP Definitions
CREATE TABLE sop_definitions (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  vertical VARCHAR(50),
  name VARCHAR(255),
  description TEXT,
  config JSONB NOT NULL, -- SOP rules and flows
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Interactions Log
CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  lead_id UUID REFERENCES leads(id),
  interaction_type VARCHAR(50), -- summary, missing_info, reply_suggestion
  model_used VARCHAR(100),
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  cost_cents INTEGER,
  latency_ms INTEGER,
  suggestion JSONB,
  user_action VARCHAR(50), -- approved, rejected, edited
  feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Slots
CREATE TABLE slots (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  provider_id UUID,
  service_id UUID,
  date DATE,
  start_time TIME,
  end_time TIME,
  status VARCHAR(50), -- available, reserved, booked, blocked
  booked_by_booking_id UUID REFERENCES bookings(id),
  reserved_by_user_id UUID,
  reservation_expires_at TIMESTAMP,
  can_double_book BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider_id, date, start_time)
);
```

---

## 3. LLM Integration Stack

### 3.1 LLM Orchestration

#### Primary LLM: Claude Opus 3.5 Sonnet

```python
# Using LangChain for abstraction
from langchain.chat_models import ChatAnthropic
from langchain.schema import HumanMessage, SystemMessage

class LLMService:
    def __init__(self):
        self.client = ChatAnthropic(
            model="claude-opus-4-5-20251101",
            max_tokens=2000,
            temperature=0.7,  # Balanced creativity
            api_key=os.getenv("ANTHROPIC_API_KEY"),
            timeout=30
        )
    
    async def generate_conversation_summary(
        self, 
        conversation: List[Message],
        max_length: int = 200
    ) -> str:
        """Summarize conversation for context"""
        
    async def detect_missing_info(
        self,
        lead: Lead,
        conversation: List[Message],
        required_fields: List[str]
    ) -> Dict[str, str]:
        """Detect missing information"""
        
    async def suggest_replies(
        self,
        lead: Lead,
        conversation: List[Message],
        context: dict
    ) -> List[str]:
        """Generate reply suggestions"""
        
    async def analyze_intent(
        self,
        message: str,
        context: dict
    ) -> Dict[str, any]:
        """Classify intent"""
```

#### Fallback & Error Handling

```python
class LLMService:
    MODELS = [
        "claude-opus-4-5-20251101",  # Primary
        "claude-sonnet-4-5-20250929",  # Secondary
        "gpt-4-turbo-preview"  # Fallback
    ]
    
    async def call_with_fallback(self, prompt, max_retries=3):
        for attempt in range(max_retries):
            try:
                for model in self.MODELS:
                    try:
                        return await self._call_model(model, prompt)
                    except RateLimitError:
                        continue
                    except Exception as e:
                        log.error(f"Model {model} failed: {e}")
            except Exception as e:
                if attempt == max_retries - 1:
                    raise
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
```

### 3.2 Prompt Management

```python
# Prompts stored as templates
class PromptTemplates:
    
    CONVERSATION_SUMMARY = """
You are a helpful sales assistant for a {vertical} business.

CONTEXT:
- Customer: {lead_name}
- Conversation: {conversation_history}
- Current SOP state: {sop_state}

TASK: Summarize conversation in 1-2 sentences (focus on intent)

[Summary]
..."""
    
    MISSING_INFO_DETECTION = """
You are analyzing a customer conversation.

CONVERSATION:
{conversation}

REQUIRED FIELDS:
{required_fields}

For each missing field, explain:
1. Why it's needed
2. How to ask
3. Can we infer from other data?

[Missing Info]
..."""
    
    REPLY_SUGGESTION = """
Generate 2 reply options...
[Option A]
..."""
    
    @staticmethod
    def render(template: str, **kwargs) -> str:
        return template.format(**kwargs)
```

---

## 4. Embedding & Vector Database

### 4.1 Embedding Strategy

```python
from sentence_transformers import SentenceTransformer

class EmbeddingService:
    def __init__(self):
        # Lightweight, multilingual model optimized for semantic search
        self.model = SentenceTransformer(
            'bge-large-zh-v1.5',  # Optimized for Vietnamese & Chinese
            device='cuda' if torch.cuda.is_available() else 'cpu'
        )
    
    async def embed_conversation(self, conversation: List[Message]) -> np.ndarray:
        """Create embedding for conversation"""
        text = " ".join([msg.content for msg in conversation])
        return self.model.encode(text)
    
    async def embed_lead(self, lead: Lead) -> np.ndarray:
        """Create embedding for lead profile"""
        text = f"{lead.name} {lead.properties.get('notes', '')}"
        return self.model.encode(text)
```

### 4.2 Pinecone Vector Database

```python
import pinecone

class VectorDB:
    def __init__(self):
        pinecone.init(
            api_key=os.getenv("PINECONE_API_KEY"),
            environment=os.getenv("PINECONE_ENV")
        )
        self.index = pinecone.Index("conversations")
    
    async def store_conversation_embedding(
        self, 
        lead_id: str, 
        conversation_id: str,
        embedding: np.ndarray,
        metadata: dict
    ):
        """Store conversation embedding for semantic search"""
        self.index.upsert([(
            f"{lead_id}_{conversation_id}",
            embedding.tolist(),
            {"lead_id": lead_id, "vertical": metadata["vertical"]}
        )])
    
    async def find_similar_conversations(
        self,
        embedding: np.ndarray,
        top_k: int = 3,
        vertical: str = None
    ) -> List[dict]:
        """Find similar conversations for few-shot examples"""
        results = self.index.query(
            embedding.tolist(),
            top_k=top_k,
            filter={"vertical": vertical} if vertical else None
        )
        return results
```

---

## 5. Frontend Stack

### 5.1 Web Frontend

```
Technology Stack:
- Framework: React 18
- Language: TypeScript
- State: Redux Toolkit (or Zustand for simplicity)
- Styling: Tailwind CSS
- UI Components: Shadcn/ui or Material-UI
- Forms: React Hook Form + Zod
- HTTP: Axios
- Real-time: Socket.io

Key packages:
- react-query: Data fetching & caching
- zustand: State management
- tailwindcss: Styling
- react-hook-form: Form handling
- zod: Schema validation
- date-fns: Date manipulation
- recharts: Charts & analytics
```

### 5.2 Mobile App

```
Option 1: React Native
- Framework: React Native / Expo
- State: Redux / Zustand
- UI: React Native Paper / Native Base
- Real-time: Socket.io-client-js
- Storage: AsyncStorage + WatermelonDB

Option 2: Flutter
- Framework: Flutter / Dart
- State: Provider / BLoC
- UI: Material Design
- Real-time: web_socket_channel
- Storage: Hive / SQLite

Recommendation: Start with React Native (code sharing with web)
Later: Consider Flutter for iOS performance
```

---

## 6. DevOps & Infrastructure

### 6.1 Containerization

```dockerfile
# Dockerfile for backend
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 6.2 Kubernetes Deployment

```yaml
# kubernetes manifest (simplified)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: booking-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: booking-api:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
```

### 6.3 Infrastructure-as-Code (IaC)

```python
# Using Pulumi for IaC
import pulumi
import pulumi_aws as aws

# Create RDS PostgreSQL
db = aws.rds.Instance("booking-db",
    allocated_storage=20,
    storage_type="gp3",
    engine="postgres",
    engine_version="15",
    instance_class="db.t3.micro",
    db_name="booking",
    username="admin",
    password=pulumi.Config().require_secret("db_password"),
    skip_final_snapshot=False
)

# Create ElastiCache Redis
redis = aws.elasticache.Cluster("booking-cache",
    engine="redis",
    engine_version="7.0",
    node_type="cache.t3.micro",
    num_cache_nodes=1
)

# Create S3 bucket
s3_bucket = aws.s3.Bucket("booking-files",
    acl="private",
    versioning=aws.s3.BucketVersioningArgs(
        enabled=True
    )
)

# Export endpoints
pulumi.export("db_endpoint", db.endpoint)
pulumi.export("redis_endpoint", redis.cache_nodes[0].address)
```

---

## 7. Monitoring & Observability

### 7.1 Metrics Collection

```python
from prometheus_client import Counter, Histogram, Gauge
from datetime import datetime

# Metrics
ai_calls_counter = Counter(
    'ai_calls_total',
    'Total LLM API calls',
    ['model', 'task_type', 'status']
)

ai_latency_histogram = Histogram(
    'ai_latency_seconds',
    'LLM API call latency',
    ['model'],
    buckets=(0.5, 1, 2, 5, 10)
)

booking_state_gauge = Gauge(
    'booking_state_total',
    'Current booking states',
    ['organization_id', 'state']
)

# Usage
@router.post("/api/ai/suggest-reply")
async def suggest_reply(request: SuggestReplyRequest):
    start_time = datetime.now()
    try:
        result = await llm_service.suggest_replies(...)
        ai_calls_counter.labels(
            model="claude-opus",
            task_type="reply_suggestion",
            status="success"
        ).inc()
        return result
    except Exception as e:
        ai_calls_counter.labels(
            model="claude-opus",
            task_type="reply_suggestion",
            status="error"
        ).inc()
        raise
    finally:
        latency = (datetime.now() - start_time).total_seconds()
        ai_latency_histogram.labels(model="claude-opus").observe(latency)
```

### 7.2 Logging

```python
import structlog

logger = structlog.get_logger()

# Structured logging
logger.info(
    "ai_interaction_completed",
    interaction_id=interaction_id,
    model="claude-opus",
    lead_id=lead_id,
    task_type="reply_suggestion",
    latency_ms=1200,
    cost_cents=5,
    token_usage={"prompt": 2300, "completion": 450},
    user_action="approved"
)

# Output format (JSON for log aggregation)
{
  "timestamp": "2024-02-03T10:15:00Z",
  "level": "info",
  "event": "ai_interaction_completed",
  "interaction_id": "uuid",
  "model": "claude-opus",
  "lead_id": "uuid",
  "task_type": "reply_suggestion",
  "latency_ms": 1200,
  "cost_cents": 5
}
```

### 7.3 Monitoring Stack

```
Stack:
- Metrics: Prometheus
- Logs: ELK Stack (Elasticsearch, Logstash, Kibana)
- Traces: Jaeger
- Alerting: AlertManager
- Dashboards: Grafana
- Error tracking: Sentry

Key dashboards:
1. API Health (latency, error rate, uptime)
2. LLM Performance (cost, latency, accuracy)
3. Business Metrics (lead count, booking conversion, show-up rate)
4. Database Health (connections, slow queries)
5. Cache Hit Rate (Redis efficiency)
```

---

## 8. Open Source Tools & Libraries

### 8.1 AI & NLP

| Library | Purpose | License |
|---------|---------|---------|
| **LangChain** | LLM orchestration framework | MIT |
| **LlamaIndex** | RAG & context indexing | MIT |
| **sentence-transformers** | Embeddings & semantic search | Apache 2.0 |
| **Hugging Face Transformers** | NLP models | Apache 2.0 |
| **spacy** | NLP pipelines | MIT |
| **NLTK** | Natural language processing | Apache 2.0 |
| **Pydantic** | Data validation | MIT |

### 8.2 Backend Utilities

| Library | Purpose | License |
|---------|---------|---------|
| **FastAPI** | Web framework | MIT |
| **SQLAlchemy** | ORM | MIT |
| **Celery** | Task queue | BSD |
| **Redis** | Cache & message broker | BSD |
| **asyncpg** | Async PostgreSQL | Apache 2.0 |
| **python-jose** | JWT handling | MIT |
| **passlib** | Password hashing | BSD |

### 8.3 Frontend Libraries

| Library | Purpose | License |
|---------|---------|---------|
| **React** | UI framework | MIT |
| **Redux Toolkit** | State management | MIT |
| **Tailwind CSS** | Styling | MIT |
| **Shadcn/ui** | UI components | MIT |
| **React Hook Form** | Form handling | MIT |
| **Zod** | Schema validation | MIT |
| **Socket.io-client** | Real-time communication | MIT |

### 8.4 DevOps & Infrastructure

| Tool | Purpose | License |
|------|---------|---------|
| **Docker** | Containerization | Apache 2.0 |
| **Kubernetes** | Orchestration | Apache 2.0 |
| **Prometheus** | Metrics | Apache 2.0 |
| **Grafana** | Monitoring | AGPL-3.0 |
| **ELK Stack** | Logging | SSPL/Elastic |
| **Jaeger** | Tracing | Apache 2.0 |
| **Pulumi** | IaC | Apache 2.0 |

---

## 9. Cost Estimation

### 9.1 Monthly Infrastructure Costs

```
AWS costs (estimated for 100 customers):

Compute:
- ECS: 3 instances (t3.medium) = $60/month
- Lambda (for async tasks): $10/month

Database:
- RDS PostgreSQL (db.t3.small): $30/month
- Backup storage: $10/month

Cache & Storage:
- ElastiCache (cache.t3.micro): $20/month
- S3 (2GB): $1/month

Networking:
- NAT Gateway: $32/month
- Data transfer (10GB): $10/month

LLM API:
- Claude API: ~$500/month (at $500K/month)
  (50K = $5 cost per customer)

Vector DB:
- Pinecone (Pro): $100/month

Monitoring:
- CloudWatch: $20/month
- Third-party (Sentry): $30/month

Total: ~$820/month (for 100 customers)
Per customer: $8.20/month (plus LLM costs)

Margin analysis:
- Starter plan: $500K/month
- Margin after infrastructure: 98% (good!)
```

---

## 10. Performance & Optimization

### 10.1 Caching Strategy

```python
# Redis caching layers
from redis import Redis
from functools import lru_cache

class CachingService:
    def __init__(self):
        self.redis = Redis.from_url(os.getenv("REDIS_URL"))
    
    async def get_lead_with_cache(self, lead_id: str) -> Lead:
        # Check cache first
        cached = await self.redis.get(f"lead:{lead_id}")
        if cached:
            return Lead.parse_obj(json.loads(cached))
        
        # Load from DB
        lead = await db.get(Lead, lead_id)
        
        # Cache for 1 hour
        await self.redis.setex(
            f"lead:{lead_id}",
            3600,
            lead.json()
        )
        return lead
    
    async def get_sop_rules_with_cache(
        self, 
        organization_id: str
    ) -> Dict:
        cache_key = f"sop:{organization_id}"
        cached = await self.redis.get(cache_key)
        
        if cached:
            return json.loads(cached)
        
        rules = await db.query(SOP, org_id=organization_id)
        await self.redis.setex(cache_key, 86400, json.dumps(rules))
        return rules
```

### 10.2 Query Optimization

```python
# Database query optimization
from sqlalchemy import select
from sqlalchemy.orm import selectinload

class LeadRepository:
    async def get_lead_with_conversations(
        self, 
        lead_id: str
    ) -> Lead:
        # Use selectinload to prevent N+1
        query = select(Lead).options(
            selectinload(Lead.conversations).selectinload(
                Conversation.messages
            )
        ).where(Lead.id == lead_id)
        
        return await session.execute(query)
```

---

## 11. Security

### 11.1 API Security

```python
from fastapi_jwt_bearer import JWTBearer
from fastapi import Security

security = JWTBearer()

@app.post("/api/conversations/{lead_id}/messages")
async def send_message(
    lead_id: str,
    message: MessageRequest,
    credentials: str = Security(security)
):
    # Verify JWT token
    # Check organization access
    # Validate input
    # Process
    pass
```

### 11.2 Data Protection

```
- Database: Encrypted at rest (AWS KMS)
- In transit: TLS 1.3
- PII: Masked in logs
- Backups: Encrypted, tested regularly
- GDPR: Right to be forgotten via API
```

---

**Tài liệu liên quan:**
- [05_AI_LOGIC_ARCHITECTURE.md](05_AI_LOGIC_ARCHITECTURE.md)
- [06_BOOKING_ORCHESTRATION_ENGINE.md](06_BOOKING_ORCHESTRATION_ENGINE.md)
- [10_DATA_SCHEMA.md](10_DATA_SCHEMA.md)
- [09_INTEGRATION_PARTNERS.md](09_INTEGRATION_PARTNERS.md)

**Última actualización**: Feb 2026  
**Status**: In Review  
**Version**: 1.0-MVP
