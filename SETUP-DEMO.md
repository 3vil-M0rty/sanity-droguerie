# Sanity Droguerie: get the demo running

The backend and frontend zips are your Sanity code plus today's changes. They contain no `node_modules` and no `.env`, so keep your own `.env`.

## 1. Backend environment variables (Render, or `backend/.env`)

Add these next to your existing variables.

```
# Cloudinary: photos, logos and documents
# Console → Dashboard → "API environment variable"
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>

# WhatsApp Business (Meta Cloud API): messages sent straight from the app
WHATSAPP_TOKEN=<permanent System User token>
WHATSAPP_PHONE_NUMBER_ID=<phone number id>
PUBLIC_API_URL=https://<your-backend-url>      # the PDF links in WhatsApp messages point here
```

- **Without the WhatsApp variables**, the WhatsApp button opens WhatsApp (phone or WhatsApp Web) with the message and the PDF link already filled in. You just press Send. This also works for a demo.
- **With the Meta API**, the message leaves directly from the app. Meta only delivers a free-form message if the customer has written to your WhatsApp number in the last 24 hours. Before the demo, send "hi" from your phone to the business number, then send the reminder to that phone.
- In Cloudinary, go to **Settings → Security** and enable "Allow delivery of PDF and ZIP files". This isn't strictly needed, because private documents open through a signed download link, but it's a useful safety net.

## 2. Install and deploy

```
cd backend && npm install      # adds the "cloudinary" package
cd frontend && npm install && npm run build
```

Deploy both as you usually do (Render + Vercel).

## 3. Seed the demo shop

Run this from `backend/`. It uses your `.env`, which says `NODE_ENV=production`, so the seed needs `--force`:

```
npm run seed:droguerie -- --force
```

It creates **Droguerie Al Baraka** (Casablanca):

- 61 articles with their photos (uploaded to Cloudinary) and the shop logo
- 3 wholesalers you partly owe
- 6 customers on the carnet
- 2 weeks of till sales, with today's till open

To start over: `npm run unseed:droguerie`, then seed again.

| Login | Email | Password |
|---|---|---|
| Owner (Si Hassan) | droguerie@sanity.test | Droguerie@123 |
| Shop assistant (Ayoub) | vendeur@sanity.test | Vendeur@123 |

For a live WhatsApp send during the demo: open **Carnet**, then **Détails** on a customer. On their customer card, set the phone to your own number. Then press **WhatsApp**.

## 4. Demo walkthrough (10 minutes)

1. **Ma boutique**: today's sales, the till, who owes the most, what to reorder.
2. **Caisse**: scan or search an article, sell it, pay in cash or on credit (carnet).
3. **Carnet**: a customer's open debts, receive a payment (it settles the oldest debts first), and the **WhatsApp** reminder with the statement PDF.
4. **Achat rapide**: a supplier delivery goes into stock in one screen.
5. **Fournisseurs**: what you owe each supplier, and recording a payment.
6. **Articles**: families with photos, low-stock alerts.
7. Switch the language to **العربية** at the bottom left.

## What changed today

- `services/storageService.js`: a new **Cloudinary** driver. It's used first when configured, then R2, then local disk. Photos are public WebP files with thumbnails. Documents are private, opened through signed links that expire. The per-client quota is unchanged.
- WhatsApp from the droguerie screens (Ma boutique, Carnet, a customer's account) now goes through the backend (`/api/messaging`). That means the Meta API when it's configured, otherwise WhatsApp opens ready to send. Users without the "send" permission (the shop assistant) still get the plain WhatsApp link.
- The droguerie seed now adds article photos and the shop logo. These are generated pictures without text, so they look the same on any server.
- I removed the old, unused `config/cloudinary.js` and `services/cloudinaryService.js`.
- Backend tests: 77 files, 559 tests, all passing. The frontend builds.
