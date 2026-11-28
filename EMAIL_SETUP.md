# 📧 Email / OTP Setup Guide (Hinglish)

## Problem kya hai?

Render **free web service** outbound SMTP ports **25, 465, 587 block** karta hai.
Iska matlab Gmail SMTP (`smtp.gmail.com`) Render par **kabhi kaam nahi karega**.
Isliye OTP email bhejne ke liye **HTTPS/HTTP API** wala provider chahiye.

> Reference: https://render.com/docs/free#outbound-smtp

Backend me ab 4 HTTP providers ka support hai. Koi **ek** configure karna kaafi hai:

| Provider | Free Limit | Signup? | Recommended |
|---|---|---|---|
| **Gmail relay (Google Apps Script)** | ~100 emails/day | ❌ Nahi | ⭐ Best |
| Brevo | 300 emails/day | ✅ Haan | Good |
| SendGrid | 100 emails/day | ✅ Haan | Good |
| Resend | 100 emails/day | ✅ Haan (domain verify) | Domain ho to |

---

## ⭐ Option A — Gmail Relay (sabse aasan, koi signup nahi)

Ye aapke hi Gmail (`satishrajput207001@gmail.com`) se email bhejta hai.

### Step 1: Apps Script kholo
1. Browser me https://script.google.com kholo
2. **New project** par click karo

### Step 2: Code paste karo
1. Left side me `Code.gs` file kholo
2. Poora purana code delete karo
3. Is repo ki file **`backend/google-apps-script/email-relay.gs`** ka poora code paste karo
4. Sabse upar wali line me:
   ```js
   const SECRET = 'mera-raasta-CHANGE-ME-TO-A-LONG-RANDOM-SECRET';
   ```
   ise apni koi lambi random string se badlo, jaise:
   ```js
   const SECRET = 'mera-raasta-9f8a7b6c5d4e3f2a1b';
   ```
   **Ise copy karke rakh lo** — Render me bhi yahi daalna hai.

### Step 3: Deploy karo
1. Upar right me **Deploy** → **New deployment**
2. Select type: **Web app**
3. Settings:
   - **Description:** `Mera Raasta Email Relay`
   - **Execute as:** `Me`
   - **Who has access:** `Anyone` ← ye zaroori hai
4. **Deploy** → Google permission maange to **Authorize access** → apna Gmail chuno → **Allow**
5. **Web app URL** copy karo. Ye kuch aisa dikhega:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

### Step 4: Render par env vars daalo
Render Dashboard → **backend service** → **Environment** → Add Environment Variable:

| Key | Value |
|---|---|
| `GAS_EMAIL_URL` | Step 3 me copy kiya hua URL |
| `GAS_EMAIL_SECRET` | Step 2 wala secret |

### Step 5: Deploy latest code
Render Dashboard → backend service → **Manual Deploy** → **Deploy latest commit**

> Agar Auto-Deploy on hai to GitHub push ke baad khud deploy ho jayega.
> Nahi hai to Manual Deploy karna zaroori hai.

### Step 6: Test karo
1. Website par naya account banao
2. 6-digit OTP email par aayega
3. OTP enter karke account verify karo

---

## Option B — Brevo (300 emails/day)

1. https://www.brevo.com par free account banao
2. **Senders** me `satishrajput207001@gmail.com` add karo aur verify karo
3. **SMTP & API** → **API Keys** → new API key banao
4. Render backend service me env var add karo:
   ```
   BREVO_API_KEY = xkeysib-...
   ```
5. Manual Deploy karo

Backend `SMTP_FROM` ya `SMTP_USER` wali email ko sender ke roop me use karega.
Isliye Brevo me wahi Gmail verify karna zaroori hai.

---

## Option C — SendGrid (100 emails/day)

1. https://sendgrid.com par free account banao
2. **Settings → Sender Authentication → Single Sender Verification** me Gmail verify karo
3. **Settings → API Keys** → new key banao
4. Render me env var:
   ```
   SENDGRID_API_KEY = SG....
   ```
5. Manual Deploy karo

---

## Local Testing (apne laptop par)

Local par Gmail SMTP chalta hai (Render par nahi). Isliye:

1. `frontend/.env` me local backend ka URL rakho:
   ```
   VITE_API_URL=http://localhost:5000
   ```
2. `npm run dev` chalao (backend + frontend dono start honge)
3. Register karo — Gmail SMTP se OTP aayega
4. Backend console me OTP bhi print hota hai (development me):
   ```
   [verify-otp] OTP for user@gmail.com = 123456
   ```

> Production build `.env.production` use karta hai, jo Render URL par point karta hai.

---

## Troubleshooting

### "Email service not configured" / OTP nahi aa raha
- Render → Environment me `GAS_EMAIL_URL` + `GAS_EMAIL_SECRET` set hain?
- Manual Deploy kiya?
- Render logs me dekho:
  - `✅ EMAIL SENT (Gmail relay)` → sab sahi
  - `❌ EMAIL FAILED (Gmail relay)` → error message dekho

### Apps Script "unauthorized"
- `GAS_EMAIL_SECRET` aur Apps Script ke `SECRET` bilkul same hone chahiye
- Secret me extra space ya quote na ho

### Apps Script URL open karne par "Script function not found"
- Deployment type **Web app** hona chahiye
- **Who has access: Anyone** hona chahiye

### OTP spam folder me
- Gmail relay se bheja gaya mail kabhi spam me ja sakta hai
- User ko spam folder check karne ko bolo

### "Service invoked too many times for one day"
- Gmail free quota (~100 recipients/day) khatam
- Agle din ya Brevo/SendGrid use karo

### Render logs me purana code chal raha hai
- Render → Manual Deploy → **Deploy latest commit**
- Ya Settings → Build & Deploy → **Auto-Deploy: Yes**

---

## Backend me priority order

`backend/src/utils/sendEmail.js` har configured provider ko is order me try karta hai:

1. **Resend** (`RESEND_API_KEY`)
2. **Brevo** (`BREVO_API_KEY`)
3. **SendGrid** (`SENDGRID_API_KEY`)
4. **Gmail relay** (`GAS_EMAIL_URL` + `GAS_EMAIL_SECRET`)
5. **SMTP** (sirf local/paid Render — free Render par skip)

Ek provider fail ho to agla automatically try hota hai.
