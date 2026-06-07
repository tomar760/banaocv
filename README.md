# BanaoCV 🚀

**India ka #1 AI Resume Builder — Hindi mein bolo, professional resume banega.**

[banaocv.in](https://banaocv.in) · Free · Fast · Mobile-First

---

## Features

- 🤖 **AI Resume Generator** — Hindi mein bolo, English resume banega
- 🎨 **50+ Templates** — Fresher, Experienced, Creative, Govt, IT
- ✏️ **Full Editor** — Canva jaisi editing
- 📊 **ATS Score Checker** — Interview chances badhao
- 🎯 **JD Match** — Job description se resume optimize karo
- ✉️ **Cover Letter** — AI se professional cover letter
- 📱 **Mobile First** — Phone pe perfectly kaam karta hai
- 💰 **₹99 Premium** — Ek baar ki payment

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JS |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + Google OAuth |
| AI | OpenAI GPT-4 |
| Payment | Razorpay |
| Storage | Cloudinary |
| Hosting | Vercel |

---

## Setup — Local Development

### 1. Clone karo

```bash
git clone https://github.com/yourusername/banaocv.git
cd banaocv
```

### 2. Dependencies install karo

```bash
npm install
```

### 3. Environment variables setup karo

```bash
cp backend/.env.example backend/.env
# .env file mein apni keys daalo
```

### 4. Supabase tables banao

Supabase dashboard mein yeh SQL run karo:

```sql
-- Resumes table
create table resumes (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  title       text not null default 'My Resume',
  data        jsonb,
  template    text default 'clean-fresher',
  color       text default '#1B3A6B',
  score       int default 0,
  share_code  text unique,
  views       int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Payments table
create table payments (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id),
  plan        text not null,
  amount      int not null,
  payment_id  text unique,
  order_id    text,
  status      text default 'pending',
  created_at  timestamptz default now()
);

-- RLS policies
alter table resumes  enable row level security;
alter table payments enable row level security;

create policy "Users own resumes"  on resumes  for all using (auth.uid() = user_id);
create policy "Users own payments" on payments for all using (auth.uid() = user_id);

-- Increment views function
create or replace function increment_views(resume_code text)
returns void as $$
  update resumes set views = views + 1 where share_code = resume_code;
$$ language sql;
```

### 5. Shuru karo

```bash
npm run dev
# http://localhost:3000 pe open hoga
```

---

## Deploy on Vercel

```bash
# Vercel CLI install
npm i -g vercel

# Deploy
vercel

# Environment variables Vercel dashboard mein daalo
```

---

## Environment Variables

`.env.example` dekho — sab variables wahan listed hain.

**Zaroori keys:**
- `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`
- `OPENAI_API_KEY`
- `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET`
- `JWT_SECRET`

---

## Folder Structure

```
banaocv/
├── index.html          — Homepage
├── editor.html         — Resume Editor
├── templates.html      — Templates
├── pricing.html        — Pricing
├── dashboard.html      — User Dashboard
├── login.html          — Login/Signup
├── assets/
│   ├── css/            — Stylesheets
│   └── js/             — Frontend JS
├── components/         — Reusable nav/footer
├── backend/            — Node.js API
│   ├── server.js
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   └── config/
├── .gitignore
├── vercel.json
└── README.md
```

---

## Contact

- Email: support@banaocv.in
- Website: [banaocv.in](https://banaocv.in)

---

Made with Aditya Tomar in India 🇮🇳
