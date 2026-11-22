# Mera Raasta

An Indian education and career guidance platform with personalized roadmaps, AI coaching, and career recommendations.

## Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB Atlas
- **AI**: OpenAI API for career counseling

## Quick Start

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

## Development

```bash
node scripts/dev.js
```

Frontend: http://localhost:5173
Backend: http://localhost:5000/api/health

## Seed Database

```bash
npm run seed            # careers / courses / colleges etc. (content)
npm run seed:demo       # demo accounts (optional, manual only)
npm run cleanup:demo    # demo accounts + unka data delete
```

> Demo accounts ab server start par auto-create nahi hote. Fresh DB par
> register karke apna account banao.

## Login Credentials

Koi fixed demo login nahi hai. Register page se account banao, ya manually:

```bash
npm run seed:demo
```

Isse ye accounts bante hain (sirf development ke liye):
- **Student**: rahul@student.com / password123
- **Parent**: priya@parent.com / password123
- **Mentor**: amit@mentor.com / password123
