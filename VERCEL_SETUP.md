# Vercel Deployment Setup Guide

If you are experiencing "Failed to fetch" errors on login or the Chat Widget is not replying, it is likely due to missing Environment Variables in your Vercel project settings.

## 1. Required Environment Variables

Go to your Vercel Project -> **Settings** -> **Environment Variables** and add the following:

### Frontend Variables (Required for Login & App)
| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | Your Supabase Project URL (e.g., https://xyz.supabase.co) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase Anon Key |

### Backend Variables (Required for Chat AI)
| Key | Value |
|-----|-------|
| `SUPABASE_URL` | Same as `VITE_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase Service Role Key (Found in Supabase -> Settings -> API) |
| `OPENAI_API_KEY` | Your OpenAI API Key (sk-...) |

> **Note**: The backend variables are needed for the new `/api/chat` function to work.

## 2. Redeploy
After adding these variables, you must **Redeploy** your project for changes to take effect.
1. Go to **Deployments**.
2. Click the three dots on the latest deployment -> **Redeploy**.

## 3. Troubleshooting
- If you see "Connection failed", double-check `VITE_SUPABASE_URL`.
- If the Chat Widget sends a message but gets no reply, check `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY`.
