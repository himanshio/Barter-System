# SkillSwap - Hyperlocal AI-Driven Skill Exchange Platform

## Overview
SkillSwap is a premium, investor-demo ready web application built on the MERN stack. It empowers users to exchange skills via a hybrid barter, credit, and payment ecosystem driven by an intelligent matching algorithm and geospatial discovery.

## Tech Stack
* **Frontend**: React.js (Vite), TailwindCSS v4, Framer Motion, Redux Toolkit, Socket.io-client.
* **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.io, Cloudinary, JWT.

## Setup Instructions

### 1. Backend Setup
1. Navigate to `/server`
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example`:
   * Set your `MONGO_URI`.
   * Set your `JWT_SECRET`.
   * Add Cloudinary credentials for avatar uploads.
4. Start the server: `npm run dev` (Runs on port 5000)

### 2. Frontend Setup
1. Navigate to `/client`
2. Install dependencies: `npm install`
3. Start the Vite dev server: `npm run dev` (Runs on port 5173)

## Core Features Implemented
* **Glassmorphism UI**: High-end UI with Framer Motion animations.
* **Geospatial Matching Engine**: MongoDB `$near` indexing for hyperlocal search.
* **Real-time Chat**: Socket.io 1-to-1 messaging with deal offer capabilities.
* **Credit Wallet**: Mocked Stripe integration for purchasing internal platform credits.
* **Tinder-style Swipe Dash**: Explore AI-recommended skill matches intuitively.

## Deployment Guide
1. **Frontend**: Deploy the `/client` folder via Vercel or Netlify. Update the `CLIENT_URL` in backend `.env` and configure React axios base URLs.
2. **Backend**: Deploy the `/server` folder via Render, Heroku, or AWS EC2. Update the `ENDPOINT` in the frontend socket code and API requests.
