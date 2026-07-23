# 🔍 Fyndly

**Fyndly** is an AI-powered lost and found platform designed for communities, residential complexes, and college campuses. It makes finding lost belongings effortless using **Google Gemini AI** to automatically describe found items, match them with reported lost items, and verify true ownership.

---

## 🏗 How It Works (System Flow & Architecture)

```
┌─────────────────────────────────────────┐      ┌─────────────────────────────────────────┐
│              FINDER FLOW                │      │               OWNER FLOW                │
│  1. Upload Photo of found item          │      │  1. Describe lost item in detail        │
│  2. Pick location (Library, Gym, etc.)  │      │  2. Upload reference photo (Optional)   │
│  3. Zero typing required!               │      │  3. Pick location & date lost           │
└────────────────────┬────────────────────┘      └────────────────────┬────────────────────┘
                     │                                                │
                     ▼                                                ▼
┌─────────────────────────────────────────┐      ┌─────────────────────────────────────────┐
│       AI PHOTO ANALYZER (GEMINI)        │      │          AI PROFILE COMPILER            │
│  • Auto-detects item type, colors, brand│      │  • Extracts searchable tags from text   │
│  • Reads text/IDs visible on the item   │      │  • Standardizes item features           │
│  • Generates 3 secret verification Qs   │      │                                         │
└────────────────────┬────────────────────┘      └────────────────────┬────────────────────┘
                     │                                                │
                     └────────────────────┬───────────────────────────┘
                                          │
                                          ▼
                         ┌─────────────────────────────────┐
                         │       SMART MATCHING ENGINE     │
                         │                                 │
                         │ Step 1: Database Pre-Filter     │ (Instant)
                         │ Step 2: Tag & Feature Match     │ (Instant)
                         │ Step 3: AI Visual Inspector     │ (Deep check)
                         └────────────────┬────────────────┘
                                          │
                                          ▼
                         ┌─────────────────────────────────┐
                         │   OWNERSHIP VERIFICATION TEST   │
                         │  • Claimant answers secret Qs   │
                         │  • AI evaluates response        │
                         │  • Direct chat unlocked         │
                         └─────────────────────────────────┘
```

---

## ✨ Key Features

- 📸 **1-Click Found Upload**: Finders only upload a photo and pick a location — AI writes the entire description automatically.
- 🤖 **AI Photo Analysis**: Google Gemini AI reads the uploaded photo to identify object type, brand, colors, condition, visible text (OCR), and generates secret verification questions.
- 🎯 **3-Step Smart Matching**: Filters thousands of database items in seconds to find exact matches without wasting AI quota.
- 🔐 **Anti-Fraud Ownership Test**: Before contact details are shared, the claimant must answer an AI-generated secret challenge question to prove it's really theirs.
- 💬 **Private Messaging**: Verified owners and finders can securely chat within the app to arrange a safe return.

---

## 🛠 Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Vanilla CSS
- **Backend**: Next.js Serverless Route Handlers (Node.js)
- **AI Vision Model**: Google Gemini API (`gemini-flash-latest`)
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Auth**: NextAuth.js with encrypted passwords

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/dhanush0959/Fyndly.git
cd Fyndly
npm install
```

### 2. Set Up Environment Variables
Create a file named `.env.local` in the project root:

```env
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string

# NextAuth Secret & URL
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000

# Google Gemini API Key (Get a free key at https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploying to Vercel

1. Push your repository to GitHub.
2. Import the repository into [Vercel](https://vercel.com).
3. Go to **Project Settings → Environment Variables** and add:
   - `GEMINI_API_KEY`
   - `MONGODB_URI`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (set to `https://your-app-name.vercel.app`)
4. Click **Deploy**.

---

## 📜 License

This project is licensed under the MIT License.
