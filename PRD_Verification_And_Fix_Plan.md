# PRD: Smax AI Database Verification & Fix Plan

## 1. Problem Diagnosis
**Issue:** Users cannot save Products, Booking Slots, FAQs, or API Keys.
**Error Message:** `violates foreign key constraint "..._merchant_id_fkey"`
**Root Cause:** The frontend application is attempting to save data using a `merchant_id` that does not exist in the `merchants` database table. This "Zombie Session" occurs when `localStorage` retains an ID from a previous session/database state that has since been deleted or reset.

## 2. Database Schema Verification
We must ensure the following relationships are valid.

### Core Entity: `merchants`
- **id**: UUID (Primary Key)
- **owner_id**: UUID (Links to Supabase Auth User) - *Critical for session recovery*
- **name**: Text
- **business_type**: Text

### Dependent Entities (Must link to valid `merchants.id`)
1.  **`products`**
    - `merchant_id` -> `merchants.id`
2.  **`booking_slots`**
    - `merchant_id` -> `merchants.id`
3.  **`faqs`**
    - `merchant_id` -> `merchants.id`
4.  **`ai_configs`**
    - `merchant_id` -> `merchants.id`

## 3. Verification Plan (Features)

| Feature | Action | Required DB Check | Fix Strategy |
| :--- | :--- | :--- | :--- |
| **Session** | App Load | Check if `localStorage.merchant_id` exists in `merchants` table. | If missing -> Find by `owner_id` -> If missing -> Create new Merchant. |
| **Products** | Add/Edit Product | Insert into `products` with valid `merchant_id`. | Block UI if session invalid. Auto-recover session before save. |
| **Slots** | Add/Edit Slot | Insert into `booking_slots` with valid `merchant_id`. | Same as above. |
| **FAQs** | Add/Edit FAQ | Insert into `faqs` with valid `merchant_id`. | Same as above. |
| **Settings** | Save API Key | Upsert into `ai_configs` with valid `merchant_id`. | Ensure `ai_configs` row exists or is created on fly. |

## 4. Implementation Steps (The Fix)

### Step 1: Aggressive Session Recovery (Frontend)
Modify `store.ts` to perform a **blocking** check on application initialization.
- **Current Behavior:** Optimistic load from localStorage.
- **New Behavior:** 
    1. Read `merchant_id` from localStorage.
    2. IMMEDIATELY query Supabase: `SELECT id FROM merchants WHERE id = ?`.
    3. If not found:
        - Query: `SELECT * FROM merchants WHERE owner_id = ?`.
        - If found -> Update localStorage & Store.
        - If NOT found -> INSERT new merchant -> Update localStorage & Store.

### Step 2: Component-Level Protection
Update `StepTrainingData.tsx` and `AIConfiguration.tsx` to:
- Subscribe to the Store's `session` state.
- Disable "Save" buttons if `session.merchant.id` is unverified.
- Show a "Session Expired / Reloading..." spinner if recovery is in progress.

### Step 3: Database Integrity Check (Script)
Run a script to verify the current user's state in the database and print out:
- Current Auth User ID
- Associated Merchant ID(s)
- Count of Products/Slots/FAQs

## 5. Success Criteria
1. User logs in (or refreshes).
2. `merchants` table definitely contains the user's merchant row.
3. Adding a Product succeeds (Row appears in `products`).
4. Adding an API Key succeeds (Row appears in `ai_configs`).
