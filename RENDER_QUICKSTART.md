# Quick Start: Deploy to Render.com

This is a quick guide to get your Hisab-barabar API deployed on Render.com in minutes.

## Step 1: Prepare MongoDB

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster (if you don't have one)
3. Create database user and password
4. Network Access → Add IP Address → Allow Access from Anywhere (`0.0.0.0/0`)
5. Copy your connection string

## Step 2: Deploy on Render

### Using the Dashboard:

1. **Go to Render**: https://dashboard.render.com/

2. **Create New Web Service**:
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub account
   - Select your repository: `amritsapkotadev/Hisab-barabar`

3. **Configure Settings**:
   ```
   Name: hisab-barabar-api
   Region: Oregon (or closest to you)
   Branch: main
   Root Directory: (leave blank)
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Plan: Free
   ```

4. **Add Environment Variables**:
   Click "Advanced" → "Add Environment Variable":
   
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `MONGO_URI` | Your MongoDB connection string |
   | `JWT_SECRET` | A long random string (min 32 chars) |
   | `APP_DOMAIN` | (Leave blank for now, add after deploy) |

5. **Deploy**:
   - Click **"Create Web Service"**
   - Wait 2-5 minutes for deployment

6. **Update APP_DOMAIN**:
   - After deployment, copy your Render URL (e.g., `hisab-barabar-api.onrender.com`)
   - Go to Environment → Add variable:
     - Key: `APP_DOMAIN`
     - Value: `hisab-barabar-api.onrender.com`
   - Save Changes (this will redeploy)

## Step 3: Test Your API

Visit your health check endpoint:
```
https://your-app-name.onrender.com/
```

You should see:
```json
{
  "message": "SplitSaathi API is running!",
  "status": "healthy",
  "database": "Connected to MongoDB"
}
```

## Step 4: Connect Mobile App

Update your mobile app configuration:

1. Create/Edit `.env` file in the root:
   ```env
   EXPO_PUBLIC_API_URL=https://your-app-name.onrender.com
   EXPO_PUBLIC_APP_DOMAIN=your-app-name.onrender.com
   ```

2. Restart the Expo dev server:
   ```bash
   npx expo start --clear
   ```

## Done! 🎉

Your API is now live on Render.com!

### Important Notes:

- **Free Tier**: Services spin down after 15 minutes of inactivity
- **First Request**: May take 30-60 seconds to wake up
- **Upgrade**: Consider Starter plan ($7/mo) for always-on service

### Troubleshooting:

**Service won't start?**
- Check logs in Render dashboard
- Verify MongoDB connection string is correct
- Ensure all environment variables are set

**Can't connect to MongoDB?**
- Verify IP whitelist includes `0.0.0.0/0`
- Check username/password are correct
- URL encode special characters in password

**Need Help?**
- See full [Deployment Guide](DEPLOYMENT.md)
- Render Docs: https://render.com/docs
- Render Community: https://community.render.com

---

## Alternative: Use Blueprint (Automated)

If you prefer automated deployment:

1. Push the `render.yaml` file to your repository
2. Go to Render Dashboard → **New** → **Blueprint**
3. Connect repository
4. Set environment variables when prompted
5. Click **Apply**

This will automatically configure everything for you!
