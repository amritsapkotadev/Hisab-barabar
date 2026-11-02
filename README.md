# Hisab Barabar - Expense Splitting App

<div align="center">

![Hisab Barabar](https://img.shields.io/badge/Version-1.0.0-purple)
![React Native](https://img.shields.io/badge/React%20Native-0.79-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-8.15-green)

**Split bills, track expenses, and settle up with friends effortlessly.**

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## 📱 About

**Hisab Barabar** (meaning "Accounts Settled") is a comprehensive expense-splitting application that helps you manage shared expenses with friends, roommates, or travel companions. Split bills fairly, track who owes what, and settle up easily.

### Why Hisab Barabar?

- ✅ **Smart Splitting**: Equal, unequal, percentage, or share-based splits
- ✅ **Group Management**: Create groups for trips, roommates, or any shared expenses
- ✅ **Optimized Settlements**: Minimize transactions when settling up
- ✅ **Cross-Platform**: iOS and Android apps plus a web landing/admin site
- ✅ **Sync**: Shared server data with 24h offline reads on mobile
- ✅ **Budget Tracking**: Set budgets and see a gauge
- ✅ **Beautiful UI**: Modern, neutral design with light/dark themes

---

## 🏗️ Project Structure

```
hisab-barabar/
├── mobile-app/              # Expo React Native client (iOS & Android)
│   ├── app/                 # Expo Router screens
│   ├── components/          # Reusable UI (Toast, OfflineStatus, modals)
│   ├── services/            # API client, cache/offline journal, notifications
│   ├── contexts/            # AuthContext
│   ├── hooks/               # theme, refresh, preferences
│   ├── i18n/                # English + Nepali
│   └── docs/                # Mobile audit, plan, caching, architecture
│
├── web-app/                 # Next.js monolith (landing + admin + API)
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/         # Backend API routes
│   │   │   ├── admin/       # Admin dashboard
│   │   │   ├── join/        # Invite landing page
│   │   │   ├── page.tsx     # Landing page
│   │   │   └── layout.tsx
│   │   ├── components/      # Landing components
│   │   ├── lib/             # MongoDB, Firebase, Email, idempotency
│   │   ├── middleware/      # Auth helpers (not Next middleware)
│   │   ├── models/          # Mongoose models
│   │   └── utils/           # Settlement/member/summary logic
│   ├── scripts/             # Legacy-data migration + dev seed
│   └── docs/                # Web audit, architecture, rules, design
```

---

## ✨ Features

### 💰 Expense Management
- **Personal Expenses**: Track your individual spending
- **Group Expenses**: Share costs with friends
- **Multiple Split Types**: Equal, unequal, percentage, and share-based
- **Multiple Payers**: Handle situations where multiple people pay
- **Categories**: Organize expenses efficiently

### 👥 Group Features
- **Easy Group Creation**: Set up groups in seconds
- **Invite Links**: Share groups via `hisabbarabar.qzz.io/join/<id>` deep links
- **Member Management**: Add/remove members; stable member ids survive duplicate names
- **Balance Tracking**: See who owes what at a glance

### 🔄 Smart Settlements
- **Optimized Algorithm**: Minimize the number of transactions
- **Settlement History**: Track past settlements
- **Payment Methods**: Track personal-expense payment methods

### 🔐 Security & Privacy
- **JWT Authentication**: Secure token-based auth
- **Secure Token Storage**: Expo SecureStore on mobile
- **Google OAuth**: Easy sign-in with Google
- **OTP Verification**: Email verification for security

### 📊 Additional Features
- **Budget Limits**: Set spending limits and see a budget gauge
- **Push Notifications**: Stay updated on group activities
- **Dark Mode**: System, light, and dark themes
- **Offline Support**: Cached reads for 24h + queued idempotent expense creates
- **English + Nepali**: Language selection in Settings
- **Export Data**: UI present; file export still being wired

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **MongoDB** ([Local](https://www.mongodb.com/try/download/community) or [Atlas](https://www.mongodb.com/cloud/atlas))
- **Expo CLI** via `npx expo` (no global install)
- **iOS Simulator** (Mac only) or **Android Studio** (for Android)
- **EAS account** or local native toolchain for development builds (Expo Go is not supported)

### 1️⃣ Clone the Repository

```bash
git clone <this-repository-url>
cd hisab-barabar
```

### 2️⃣ Set Up Backend (Next.js)

```bash
# Navigate to web app
cd web-app

# Install dependencies
npm install

# Create .env.local (there is no committed .env.example yet)
# Required: MONGODB_URI, JWT_SECRET, EMAIL_USER/PASS,
# FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY,
# NEXT_PUBLIC_APP_URL, ADMIN_SETUP_KEY

# Start development server
npm run dev
```

Backend will run at: `http://localhost:3000`

### 3️⃣ Set Up Mobile App (React Native)

```bash
# Navigate to mobile app (from project root)
cd mobile-app

# Install dependencies
npm install
cp .env.example .env
# Set EXPO_PUBLIC_API_URL to an API reachable from the device

# Start Expo
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan the QR code with a development build (native modules such as Firebase/SecureStore are required; Expo Go is not enough)

---

## 📖 Documentation

### For Developers

- **[Mobile App README](./mobile-app/README.md)** - Expo setup and development
- **[Mobile overview](./mobile-app/docs/OVERVIEW.md)** - current state + entry points
- **[Mobile architecture](./mobile-app/docs/ARCHITECTURE.md)** - layers, navigation, data flow
- **[Mobile plan](./mobile-app/docs/PLAN.md)** - production-readiness backlog
- **[Mobile caching/offline](./mobile-app/docs/CACHING_PLAN.md)** - cache + expense journal
- **[Web overview](./web-app/docs/OVERVIEW.md)** - backend + landing + admin
- **[Web architecture](./web-app/docs/ARCHITECTURE.md)** - API surface, models, idempotency contract
- **[Web rules](./web-app/docs/RULES.md)** - setup and change conventions

### Architecture Docs

- **Mobile App**: Expo Router + TanStack Query + SecureStore
- **Backend**: Next.js 14 API Routes with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Push Notifications**: Firebase Cloud Messaging
- **Email**: Nodemailer for OTP and notifications
- **Offline**: 24h read cache + idempotent expense-create replay

---

## 🛠️ Tech Stack

### Mobile App
- **Framework**: React Native 0.79 + Expo SDK 53
- **Navigation**: Expo Router (file-based)
- **Data**: TanStack Query + Axios; SecureStore for tokens
- **UI**: custom themed components + lucide icons (no Paper)
- **i18n**: i18next (English + Nepali)
- **Language**: TypeScript

### Backend (Web App)
- **Framework**: Next.js 14
- **Runtime**: Node.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Email**: Nodemailer
- **Push Notifications**: Firebase Admin SDK
- **Styling**: Tailwind CSS
- **Offline**: optional `Idempotency-Key` on expense creates

---

## 🧪 Testing

### Test Backend

```bash
cd web-app
npx tsc --noEmit
npm run build
# node assertion scripts: idempotency + personal expense summary
# (commands are in web-app/docs/ARCHITECTURE.md §7)
```

### Test Mobile App

```bash
cd mobile-app
npx tsc --noEmit
npm run lint
npm test -- --runInBand
# then smoke-test on a simulator/device
```

---

## 🚀 Deployment

### Backend (Next.js)

**Recommended: Vercel**

```bash
cd web-app
vercel
```

Production API: `https://hisabbarabar.qzz.io/api`.

### Mobile App

**Using EAS Build:**

```bash
cd mobile-app

# Build for Android
npm run build:android

# Build for iOS
npm run build:ios
```

See [Expo documentation](https://docs.expo.dev/build/setup/) for more details.

---

## 🔧 Configuration

### Backend Configuration

Edit `web-app/.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/hisab-barabar
JWT_SECRET=your_secure_secret_min_32_chars
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_SETUP_KEY=your_one_time_admin_setup_key
```

### Mobile App Configuration

Set `EXPO_PUBLIC_API_URL` in `mobile-app/.env`:

```env
# Android emulator
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api

# iOS simulator
EXPO_PUBLIC_API_URL=http://localhost:3000/api

# Physical device
EXPO_PUBLIC_API_URL=http://<computer-LAN-IP>:3000/api
```

Release builds default to `https://hisabbarabar.qzz.io/api` when the variable is unset.

---

## 📱 App Screenshot

The landing hero uses the current Android screenshot at `web-app/public/screenshot.jpg`, framed by `web-app/public/phone-frame.png`.

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

---

## 📝 License

No license file is present in this repository. Add one before distributing or accepting external contributions.

---

## 👥 Team

**Hisab Barabar** is built and maintained by passionate developers who believe in making expense splitting simple and fair.

---

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) - For the amazing React Native framework
- [Next.js](https://nextjs.org/) - For the powerful full-stack framework
- [MongoDB](https://www.mongodb.com/) - For the flexible database
- [TanStack Query](https://tanstack.com/query) - For mobile data caching and sync
- [Firebase](https://firebase.google.com/) - For push notifications
- [Vercel](https://vercel.com/) - For seamless deployment

---

## 📞 Support

- **Issues**: open an issue in this repository
- **Email**: support@hisabbarabar.com
- **Documentation**: `web-app/docs/` and `mobile-app/docs/`

---

## 🗺️ Roadmap

- [x] Dark mode (web + mobile)
- [x] Offline reads + queued idempotent expense creates
- [ ] Verified app links (`assetlinks.json` / AASA)
- [ ] Receipt scanning with OCR
- [ ] Multiple currency conversion
- [ ] Recurring expenses
- [ ] Expense categories customization
- [ ] Export to PDF/Excel (UI exists, file writing pending)
- [ ] Analytics and insights
- [ ] Web dashboard for expense management

---

<div align="center">

**Made with ❤️ for splitting bills, not friendships**

⭐ Star us on GitHub if you find this useful!

[Website](https://hisabbarabar.qzz.io)

</div>
