# Render.com Deployment - Files Overview

## New Files Added

### 1. `render.yaml` ⚙️
**Purpose**: Blueprint configuration for automated Render deployment

**What it does**:
- Defines the web service configuration
- Specifies Node.js runtime and build commands
- Lists required environment variables
- Enables health checks and auto-deployment

**Usage**: Render automatically detects this file and offers to deploy using Blueprint

---

### 2. `.env.example` 📝
**Purpose**: Template for environment variables

**Contains**:
- MongoDB connection string format
- JWT secret placeholder
- Server configuration options
- Google OAuth credentials (optional)

**Usage**: Copy to `.env` and fill in your actual values for local development

---

### 3. `DEPLOYMENT.md` 📚
**Purpose**: Comprehensive deployment guide

**Includes**:
- Prerequisites checklist
- Step-by-step deployment instructions (Blueprint & Manual)
- MongoDB setup guide
- Environment variable configuration
- Troubleshooting section
- Production tips and security best practices
- Monitoring and maintenance guide

**Who it's for**: Developers deploying to production for the first time

---

### 4. `RENDER_QUICKSTART.md` 🚀
**Purpose**: Quick 5-minute deployment guide

**Includes**:
- Simplified step-by-step instructions
- Essential configuration only
- Quick troubleshooting tips

**Who it's for**: Developers who want to deploy quickly

---

## Modified Files

### 1. `app.js` 🔧
**Changes**:
- Updated CORS configuration to allow Render.com domains
- Added `https://*.onrender.com` pattern
- Added regex pattern for Render subdomains

**Why**: Allows the mobile app to communicate with the API hosted on Render

---

### 2. `package.json` 📦
**Changes**:
- Updated `start` script from `nodemon app.js` to `node app.js`

**Why**: 
- `nodemon` is a development tool that auto-restarts on file changes
- Production should use `node` directly for better stability
- `nodemon` remains available via `npm run server` for local development

---

### 3. `README.md` 📖
**Changes**:
- Added deployment section
- Updated "Getting Started" with environment setup
- Added link to DEPLOYMENT.md

**Why**: Provides immediate visibility to deployment options

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                    GitHub Repo                       │
│              (amritsapkotadev/Hisab-barabar)        │
└────────────────────┬────────────────────────────────┘
                     │
                     │ (Git Push)
                     ↓
┌─────────────────────────────────────────────────────┐
│                  Render.com                          │
│  ┌─────────────────────────────────────────────┐   │
│  │       Web Service (Node.js)                 │   │
│  │  • Build: npm install                        │   │
│  │  • Start: npm start (node app.js)           │   │
│  │  • Health Check: GET /                      │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  Environment Variables:                              │
│  • MONGO_URI                                        │
│  • JWT_SECRET                                       │
│  • APP_DOMAIN                                       │
│  • NODE_ENV=production                              │
└────────────────────┬────────────────────────────────┘
                     │
                     │ (MongoDB Connection)
                     ↓
┌─────────────────────────────────────────────────────┐
│              MongoDB Atlas                           │
│  • Database: splitsaathi                            │
│  • Collections: users, groups, expenses             │
│  • IP Whitelist: 0.0.0.0/0 (allow all)             │
└─────────────────────────────────────────────────────┘

                     ↑
                     │ (API Requests)
                     │
┌─────────────────────────────────────────────────────┐
│          Mobile App (React Native/Expo)              │
│  • iOS & Android                                    │
│  • EXPO_PUBLIC_API_URL=https://your-app.onrender.com│
└─────────────────────────────────────────────────────┘
```

---

## Environment Variables Required

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MONGO_URI` | ✅ Yes | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | ✅ Yes | Secret key for JWT tokens | `your-super-secret-key-min-32-chars` |
| `NODE_ENV` | ✅ Yes | Environment mode | `production` |
| `PORT` | ✅ Yes | Server port (Render uses 10000) | `10000` |
| `APP_DOMAIN` | ⚠️ Recommended | Your Render app domain | `your-app.onrender.com` |
| `GOOGLE_CLIENT_ID_WEB` | ❌ Optional | Google OAuth Web | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_ID_IOS` | ❌ Optional | Google OAuth iOS | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_ID_ANDROID` | ❌ Optional | Google OAuth Android | `xxx.apps.googleusercontent.com` |

---

## Deployment Checklist

### Pre-Deployment
- [ ] MongoDB Atlas cluster created
- [ ] Database user with password created
- [ ] IP whitelist configured (0.0.0.0/0)
- [ ] MongoDB connection string obtained
- [ ] JWT secret generated (32+ characters)

### Render Setup
- [ ] Render account created
- [ ] GitHub repository connected to Render
- [ ] Web service created (or Blueprint deployed)
- [ ] All required environment variables added
- [ ] Health check endpoint configured

### Post-Deployment
- [ ] Service deployed successfully
- [ ] Health check passing (visit /)
- [ ] Database connection verified
- [ ] API endpoints tested
- [ ] Mobile app updated with production URL
- [ ] CORS working correctly

### Optional
- [ ] Custom domain configured
- [ ] Monitoring/alerts set up
- [ ] Backup strategy implemented
- [ ] Upgraded to paid plan (if needed)

---

## Support & Resources

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **MongoDB Atlas**: https://www.mongodb.com/docs/atlas/
- **Project Issues**: https://github.com/amritsapkotadev/Hisab-barabar/issues

---

## Quick Commands

### Deploy to Render (Blueprint)
```bash
git push origin main  # Triggers auto-deploy
```

### Check Deployment Logs
```bash
# Via Render Dashboard:
# Dashboard → Services → Your Service → Logs
```

### Test API Health
```bash
curl https://your-app.onrender.com/
```

### Update Environment Variables
```bash
# Via Render Dashboard:
# Dashboard → Services → Your Service → Environment
```

---

**Ready to deploy?** Start with [RENDER_QUICKSTART.md](RENDER_QUICKSTART.md) for a 5-minute setup!
