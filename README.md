# FabBazaar™

A lightweight luxury home-textile storefront with a Node/Express API and a Next.js storefront.

## Stack
- Frontend: Next.js + Tailwind
- Backend: Express + TypeScript + Zod
- Data: MongoDB-backed customer accounts and orders, with seeded product catalog data

## Run locally

Backend:
```bash
cd backend
npm install
# Copy .env.example to .env and configure MongoDB/JWT/admin settings first
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

The storefront runs at http://localhost:3000 and the API at http://localhost:4000.

From the project root, run the combined checks after installing each package's dependencies:
```bash
npm run build
npm run lint
npm test
```
`npm run build` builds both the frontend and backend. `npm run lint` runs the frontend ESLint checks, and `npm test` runs the backend API tests.

## Run FabBazaar locally or on your phone
- Build the backend after changing code: `npm run build:backend`.
- Start the API in one terminal: `npm run start:backend`.
- Start the storefront in another terminal: `npm run dev:frontend`.
- On the same Wi-Fi network as your computer, open the Network URL printed by Next.js, such as `http://10.11.41.60:3000`. Do not use `localhost` on your phone: that name points to the phone itself. The API listens on the computer's network interfaces and allows local Wi-Fi storefront requests while running in development.

## Deploy to Vercel
- Deploy `frontend` as the storefront project and `backend` as a separate Express project from this repository. The backend's root `index.ts` exports the Express app for Vercel; it connects to MongoDB and initializes the catalogue/admin account on demand.
- Set the backend's Production environment variables in Vercel: `MONGODB_URI`, `JWT_SECRET` (at least 32 random characters), `ADMIN_EMAIL`, `ADMIN_PASSWORD` (at least 12 characters), and `FRONTEND_ORIGINS` (the exact public storefront origin, such as `https://fabbazaar.vercel.app`). Never put these values in source control.
- In MongoDB Atlas, allow Vercel's serverless connections and scope the application database user to the `fabbazaar` database. `0.0.0.0/0` allows connections from any IP and should only be used with a strong, private database password and least-privilege database access.
- Set the frontend's Production `NEXT_PUBLIC_API_URL` to the absolute API origin followed by `/api`, for example `https://fabbazaar-api.vercel.app/api`, then redeploy the storefront.

## Customer and administrator sign-in
- Customer accounts can be created from the storefront sign-in page.
- Registration, customer IDs, profile updates, password changes, account deletion requests, and order records are stored in MongoDB.
- Administrator accounts are provisioned by the backend from `ADMIN_EMAIL` and `ADMIN_PASSWORD`; administrator access is never available through public registration.
- Copy `backend/.env.example` to `backend/.env`. Set a reachable `MONGODB_URI`, a unique administrator email, an administrator password of at least 12 characters, and a private `JWT_SECRET` of at least 32 characters before starting the API. In production, set `FRONTEND_ORIGINS` to the comma-separated list of trusted storefront origins. The API does not fall back to in-memory customer storage when MongoDB is unavailable.
- Set `NEXT_PUBLIC_API_URL` in `frontend/.env.local` if the API is not running at `http://localhost:4000/api`.
- Sign-in sessions use one-hour access tokens kept in the current browser tab. Password changes invalidate existing access tokens; signing out or closing the tab clears the browser copy.
- Razorpay accepts test keys only. Set `RAZORPAY_KEY_ID` (starting with `rzp_test_`) and `RAZORPAY_KEY_SECRET` to enable checkout; never use live keys in this test flow. Payment verification is performed server-side against Razorpay before an order is marked paid.

## Riwaz bedsheet collection
The `Riwaz 93x108` source folder contains 13 designs, each with A/B/C colour variants and six photos per variant. The storefront lists all 39 variants at ₹699 (MRP ₹2,399), with each set described as one 93 × 108 inch bedsheet and two matching pillow covers. Product photos are converted to optimized WebP files in `frontend/public/images/riwaz` for web delivery.

## Product, support and promotion tools
- Administrators can create and edit catalogue listings on `/admin/products`. The separate listing editor accepts up to six JPEG, PNG, WebP or AVIF images, each no larger than 10 MB. Local deployments store uploaded images in `backend/uploads` and the storefront proxies them through `/uploads`. Image uploads are disabled on Vercel until persistent object storage is configured; serverless filesystems are not durable.
- Product listings can be assigned to Rivaaz, Jaipuri Collection or Bazaar Exclusive; shoppers can filter those collections on the product page.
- `/support` provides automated answers for product, shipping, cancellation and damaged-parcel questions. Submissions are saved as support tickets in MongoDB; administrators review and resolve them at `/admin/support`.
- To send ticket notifications automatically, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` and `SUPPORT_EMAIL` in `backend/.env`. Without SMTP credentials, tickets are still saved and the support page offers a prepared email to `support@fabbazaar.com` for the customer to send.
- Administrators create discount codes at `/admin/promotions`. Customers redeem active codes at checkout; the API recalculates the discount against current catalogue prices before creating a payment order.
- The storefront switches between light and dark appearance at 7:00 and 19:00 using the browser device's local clock. The Jaipur block-print background is a seamless repeat.
