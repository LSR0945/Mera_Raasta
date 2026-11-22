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

## Email Verification

Registration ke baad user ke email par verification link jata hai. Link click karne par
website ka `/verify-email` page khulta hai aur account verify ho jata hai. Verify hone tak login block rehta hai.

`backend/.env` me Gmail SMTP set karo:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-char-app-password   # normal Gmail password kaam nahi karega
SMTP_FROM="Mera Raasta <your-gmail@gmail.com>"
CLIENT_URL=http://localhost:5173      # production me apna domain
```

App Password: Google Account -> Security -> 2-Step Verification ON -> App passwords.

## Login Credentials

Koi fixed demo login nahi hai. Register page se account banao, ya manually:

```bash
npm run seed:demo
```

Isse ye accounts bante hain (sirf development ke liye):
- **Student**: rahul@student.com / password123
- **Parent**: priya@parent.com / password123
- **Mentor**: amit@mentor.com / password123
