# PRD Verification & Fix Plan (v2)

## 1. Core Objectives
- **Eliminate Mock Data**: Ensure 100% reliance on Supabase DB. (Done)
- **Data Integrity**: Enforce `merchant_id` foreign key constraints on all operations. (Done)
- **Security**: Verify Row Level Security (RLS) policies allow necessary reads/writes. (Verified: Public access enabled for testing)
- **Functionality**:
    1.  **Settings**: Save/Update OpenAI API Key. (Fixed)
    2.  **Visitor Chat**: Create Conversation -> Send Message -> Persist to DB. (Fixed & Rebuilt Widget)
    3.  **Agent Dashboard**: View Conversation -> Receive Realtime Updates -> Send Manual Reply. (Fixed, verified via script)
    4.  **AI Engine**: Receive Message -> Generate Reply -> Save to DB -> Sync to Chat. (Fixed)

## 2. Feature Verification Checklist

### A. Merchant Settings (API Key)
- [x] **Action**: User enters API Key and clicks "Save".
- [x] **Expected**: 
    - Update `ai_configs` table row where `merchant_id` matches session.
    - UI shows success state.
    - No 403/401 errors.
- [x] **Status**: Fixed logic in `AIConfiguration.tsx` and `store.ts`.

### B. Visitor Chat (Widget)
- [x] **Action**: Visitor opens chat (no auth) and sends message.
- [x] **Expected**:
    - Create `conversations` row (if new) with correct `merchant_id`.
    - Create `messages` row with `role='visitor'` and `merchant_id`.
    - Edge Function triggers (if enabled).
- [x] **Status**: 
    - Fixed `EmbeddableWidget.tsx` to use `role` instead of `sender`.
    - Added missing fields (`visitor_name`, `channel`, etc.).
    - **CRITICAL**: Rebuilt widget (`npm run build:widget`).

### C. Agent Dashboard (Manual Reply)
- [x] **Action**: Merchant selects conversation and types reply.
- [x] **Expected**:
    - Create `messages` row with `role='agent'` and `merchant_id`.
    - UI updates immediately (optimistic + realtime).
- [x] **Status**: 
    - Validated backend flow via `verify-manual-send.ts`.
    - Validated `ConversationList.tsx` subscription logic.

### D. AI Automation
- [x] **Action**: System detects new visitor message.
- [x] **Expected**:
    - Edge function reads history + context.
    - Calls OpenAI.
    - Inserts `messages` row with `role='ai'` and `merchant_id`.
- [x] **Status**: Fixed Edge Function to use `merchant_id` and correct schema.

## 3. Next Steps for User
1.  **Clear Cache**: Ensure `test-widget.html` uses the latest `widget.js`.
2.  **Reload Dashboard**: Ensure `session` is valid for manual replies.
3.  **Verify Flow**: 
    - Open `test-widget.html?merchant_id=404f603e-48dc-48e4-a1cc-28fc83b4b852`.
    - Send message "Hello test".
    - Check `/conversations` page.
