# Tutora — Peer-to-Peer Tutoring Marketplace

**SLIIT | HCI Milestone 02 | WE106**

A mobile platform that connects university students with peer tutors for on-demand, subject-specific learning sessions.

---

## Team Members & Module Ownership

| Student ID | Name | Backend Module | Frontend Screens |
|---|---|---|---|
| IT23732254 | Ranathunga B.R.D.D | `server/src/modules/discovery/` | Tutor search & discovery |
| IT23730656 | Nethmi G.D.M | `server/src/modules/booking/` | Booking & scheduling |
| IT23730892 | Bandara A.G.D.C | `server/src/modules/session/` | Session management |
| IT23722286 | Gunasekara H.M.D.A.S | `server/src/modules/tutor/` | Tutor profile management |

> Auth (`server/src/modules/auth/`) and shared infrastructure are already implemented and should not be modified without team discussion.

---

## Prerequisites

Make sure you have these installed before starting:

- [Node.js](https://nodejs.org/) v18 or later
- npm (comes with Node.js)
- [Expo Go](https://expo.dev/go) app on your physical phone (iOS or Android)
- A MongoDB Atlas account (or use the shared cluster credentials from the team lead)

---

## Project Structure

```
Tutora-Mobile-App/
├── mobile/                     # React Native (Expo) frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/         # Auth screens: welcome, login, signup
│   │   │   ├── (tabs)/         # Main app screens (home, search, bookings, chat, profile)
│   │   │   └── _layout.tsx     # Root layout — wraps app with AuthProvider
│   │   ├── context/
│   │   │   └── AuthContext.tsx # Global auth state (user, login, logout, register)
│   │   ├── lib/
│   │   │   └── api.ts          # Axios instance — all API calls go through here
│   │   └── constants/
│   │       └── theme.ts        # Shared colors and spacing
│   └── package.json
│
└── server/                     # Node.js / Express backend
    ├── index.js                # Entry point — starts Express server
    ├── .env                    # Environment variables (NOT committed to git)
    ├── .env.example            # Template for .env
    └── src/
        ├── config/
        │   └── db.js           # MongoDB connection
        ├── middleware/
        │   └── auth.js         # JWT protect middleware
        └── modules/
            ├── auth/           # DONE — register, login, profile
            ├── discovery/      # IT23732254 — tutor search & filtering
            ├── booking/        # IT23730656 — create & manage bookings
            ├── session/        # IT23730892 — session tracking & history
            └── tutor/          # IT23722286 — tutor profiles & availability
```

---

## Initial Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Tutora-Mobile-App
```

### 2. Set up the backend

```bash
cd server
npm install
```

Copy the environment template and fill in your values:

```bash
cp .env.example .env
```

Open `server/.env` and set:

```env
MONGODB_URI="<your MongoDB connection string>"
JWT_SECRET="tutora_jwt_secret_2026_sliit_we106"
PORT=5000
```

> Get the `MONGODB_URI` from the team lead. Do **not** share or commit this file.

### 3. Set up the mobile app

```bash
cd ../mobile
npm install
```

---

## Running in Development

You need **two terminals** open at the same time.

### Terminal 1 — Start the backend server

```bash
cd server
npm run dev
```

The server runs on `http://localhost:5000`. You should see:

```
MongoDB Connected
Server running on port 5000
```

### Terminal 2 — Start the Expo dev server

```bash
cd mobile
npx expo start
```

Scan the QR code with **Expo Go** on your phone.

---

## Physical Device API Configuration

When testing on a real phone, the phone **cannot** reach `localhost`. You must use your computer's local WiFi IP address.

1. Find your machine's WiFi IP:
   - **Windows**: `ipconfig` → look for `IPv4 Address` under your WiFi adapter
   - **Mac/Linux**: `ifconfig` → look for `inet` under `en0`

2. Open `mobile/src/lib/api.ts` and update:

```typescript
const DEV_IP = '10.224.190.121'; // Replace with YOUR machine's WiFi IP
```

> Both your phone and computer must be on the **same WiFi network**.

---

## How to Add a New Module (Backend)

Each module follows the same pattern. Example for `discovery`:

```
server/src/modules/discovery/
├── Discovery.js           # Mongoose model (if needed)
├── discoveryController.js # Route handler functions
└── discoveryRoutes.js     # Express router
```

**discoveryRoutes.js**
```javascript
const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const { searchTutors } = require('./discoveryController');

router.get('/search', protect, searchTutors);

module.exports = router;
```

**Register the router in `server/index.js`**
```javascript
const discoveryRoutes = require('./src/modules/discovery/discoveryRoutes');
app.use('/api/discovery', discoveryRoutes);
```

---

## How to Add a New Screen (Frontend)

Screens live in `mobile/src/app/(tabs)/`. The filename becomes the route.

**Example: `mobile/src/app/(tabs)/search.tsx`**
```typescript
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Text>Search Screen</Text>
    </SafeAreaView>
  );
}
```

To make API calls, import the shared axios instance:
```typescript
import api from '@/lib/api';

const { data } = await api.get('/discovery/search?subject=math');
```

The JWT token is automatically attached to every request by the interceptor in `api.ts`.

---

## Git Workflow

1. **Never push directly to `main`**
2. Create a branch named after your module:
   ```bash
   git checkout -b feature/discovery-search
   ```
3. Commit your work with clear messages:
   ```bash
   git add .
   git commit -m "feat(discovery): add tutor search endpoint"
   ```
4. Push and open a Pull Request into `main`:
   ```bash
   git push origin feature/discovery-search
   ```
5. Get at least one team member to review before merging

### Branch naming convention

| Type | Example |
|---|---|
| New feature | `feature/booking-create` |
| Bug fix | `fix/session-status-update` |
| UI work | `ui/search-screen` |

---

## API Reference

### Auth endpoints (already implemented)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Get current user |
| PUT | `/api/auth/profile` | Yes | Update profile |

For protected routes, the token is sent automatically via the axios interceptor.

---

## Common Issues

**`Registration failed` / Network request failed**
- Check that the backend server is running (`npm run dev` in `server/`)
- Update `DEV_IP` in `mobile/src/lib/api.ts` to your machine's WiFi IP
- Ensure your phone and computer are on the same WiFi network

**`Server error 500` on register**
- Check server terminal for the error message
- Make sure `MONGODB_URI` in `server/.env` is correct and the Atlas cluster is accessible

**`Module not found` after `npm install`**
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

**Expo QR code not scanning**
- Make sure Expo Go is installed on your phone
- Try pressing `w` for web preview or `a` for Android emulator as alternatives
