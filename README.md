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

**Hisab Barabar** (meaning "Accounts Settled" ) is a comprehensive expense-splitting application that helps you manage shared expenses with friends, roommates, or travel companions. Split bills fairly, track who owes what, and settle up easily.

### Why Hisab Barabar?

- ✅ **Smart Splitting**: Equal, unequal, percentage, or share-based splits
- ✅ **Group Management**: Create groups for trips, roommates, or any shared expenses
- ✅ **Optimized Settlements**: Minimize transactions when settling up
- ✅ **Cross-Platform**: iOS, Android, and Web
- ✅ **Real-time Sync**: All your data synced across devices
- ✅ **Budget Tracking**: Set budgets and get alerts
- ✅ **Beautiful UI**: Modern, intuitive interface

---

## 🏗️ Project Structure

```
hisab-barabar/
├── mobile-app/              # React Native mobile application (iOS & Android)
│   ├── app/                 # Expo Router screens
│   ├── components/          # Reusable UI components
│   ├── services/            # API integration
│   ├── config/              # App configuration
│   └── package.json
│
├── web-app/                 # Next.js web application (Landing page + Backend API)
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/         # Backend API routes
│   │   │   ├── page.tsx     # Landing page
│   │   │   └── layout.tsx
│   │   ├── components/      # React components
│   │   ├── lib/            # Utilities (MongoDB, Firebase, Email)
│   │   ├── middleware/     # Authentication middleware
│   │   └── models/         # Database models
│   └── package.json
│
└── backend/                 # [DEPRECATED] Old Express backend (kept for reference)
```

---

## ✨ Features

### 💰 Expense Management
- **Personal Expenses**: Track your individual spending
- **Group Expenses**: Share costs with friends
- **Multiple Split Types**: Equal, unequal, percentage, and share-based
- **Multiple Payers**: Handle situations where multiple people pay
- **Categories & Tags**: Organize expenses efficiently

### 👥 Group Features
- **Easy Group Creation**: Set up groups in seconds
- **QR Code Sharing**: Join groups by scanning QR codes
- **Invite Links**: Share groups via deep links
- **Member Management**: Add/remove members easily
- **Balance Tracking**: See who owes what at a glance

### 🔄 Smart Settlements
- **Optimized Algorithm**: Minimize the number of transactions
- **Settlement History**: Track past settlements
- **Multiple Currency Support**: Handle international groups
- **Payment Methods**: Track how money was transferred

### 🔐 Security & Privacy
- **JWT Authentication**: Secure token-based auth
- **End-to-End Encryption**: Your data is safe
- **Google OAuth**: Easy sign-in with Google
- **OTP Verification**: Email verification for security

### 📊 Additional Features
- **Budget Limits**: Set spending limits and get alerts
- **Push Notifications**: Stay updated on group activities
- **Export Data**: Download your expense history
- **Dark Mode Ready**: (Coming soon)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MongoDB** ([Local](https://www.mongodb.com/try/download/community) or [Atlas](https://www.mongodb.com/cloud/atlas))
- **Expo CLI** (installed automatically)
- **iOS Simulator** (Mac only) or **Android Studio** (for Android)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/hisab-barabar.git
cd hisab-barabar
```

### 2️⃣ Set Up Backend (Next.js)

```bash
# Navigate to web app
cd web-app

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your MongoDB URI, Firebase config, etc.

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

# Start Expo
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

---

## 📖 Documentation

### For Developers

- **[Mobile App README](./mobile-app/README.md)** - React Native app setup and development
- **[Web App README](./web-app/README.md)** - Next.js backend and landing page
- **[API Documentation](./web-app/README.md#api-endpoints)** - Complete API reference
- **[Deployment Guide](./web-app/DEPLOYMENT.md)** - Deploy to production

### Architecture Docs

- **Mobile App**: React Native with Expo Router for navigation
- **Backend**: Next.js 14 API Routes with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Push Notifications**: Firebase Cloud Messaging
- **Email**: Nodemailer for OTP and notifications

---

## 🛠️ Tech Stack

### Mobile App
- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based)
- **UI Library**: React Native Paper
- **State Management**: React Hooks
- **HTTP Client**: Axios
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

---

## 🧪 Testing

### Test Backend API

```bash
cd web-app
./test-api.sh
```

### Test Mobile App

```bash
cd mobile-app
npm start
# Run on simulator/emulator and test features
```

---

## 🚀 Deployment

### Backend (Next.js)

**Recommended: Vercel**

```bash
cd web-app
vercel
```

See [Deployment Guide](./web-app/DEPLOYMENT.md) for other platforms (Railway, Render, AWS, etc.)

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
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Mobile App Configuration

Edit `mobile-app/config/api.config.ts`:

```typescript
// For local development
export const API_URL = 'http://localhost:3000/api'

// For production
export const API_URL = 'https://your-app.vercel.app/api'
```

---

## 📱 App Screenshots

<div align="center">

| Home | Groups | Expenses | Profile |
|------|--------|----------|---------|
| ![Home](docs/screenshots/home.png) | ![Groups](docs/screenshots/groups.png) | ![Expenses](docs/screenshots/expenses.png) | ![Profile](docs/screenshots/profile.png) |

</div>

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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

**Hisab Barabar** is built and maintained by passionate developers who believe in making expense splitting simple and fair.

---

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) - For the amazing React Native framework
- [Next.js](https://nextjs.org/) - For the powerful full-stack framework
- [MongoDB](https://www.mongodb.com/) - For the flexible database
- [React Native Paper](https://reactnativepaper.com/) - For beautiful UI components
- [Firebase](https://firebase.google.com/) - For push notifications
- [Vercel](https://vercel.com/) - For seamless deployment

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/hisab-barabar/issues)
- **Email**: support@hisabbarabar.com
- **Documentation**: [Full Docs](./docs)

---

## 🗺️ Roadmap

- [ ] Dark mode support
- [ ] Offline mode with sync
- [ ] Receipt scanning with OCR
- [ ] Multiple currency conversion
- [ ] Recurring expenses
- [ ] Expense categories customization
- [ ] Export to PDF/Excel
- [ ] Analytics and insights
- [ ] Web dashboard for expense management

---

<div align="center">

**Made with ❤️ for splitting bills, not friendships**

⭐ Star us on GitHub if you find this useful!

[Website](https://hisabbarabar.com) • [Twitter](https://twitter.com/hisabbarabar) • [Discord](https://discord.gg/hisabbarabar)

</div>
