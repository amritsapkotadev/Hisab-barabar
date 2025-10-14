# Deployment Guide for Render.com

This guide explains how to deploy the Hisab-barabar (SplitSaathi) backend API to Render.com.

## Prerequisites

1. A Render.com account (free tier available)
2. MongoDB Atlas account with a database cluster
3. GitHub repository connected to Render

## Deployment Steps

### 1. Setup MongoDB

Before deploying to Render, ensure you have a MongoDB database ready:

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier available)
3. Create a database user with a password
4. Whitelist IP addresses:
   - Add `0.0.0.0/0` to allow connections from Render
5. Get your connection string (should look like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority
   ```

### 2. Deploy to Render

#### Option A: Using Blueprint (Automated - Recommended)

1. **Fork or clone this repository to your GitHub account**

2. **Go to Render Dashboard**: https://dashboard.render.com/

3. **Create New Blueprint Instance**:
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Select the repository containing this code
   - Render will automatically detect the `render.yaml` file

4. **Configure Environment Variables**:
   Render will prompt you to set these required environment variables:
   
   ```bash
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/splitsaathi?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-here-use-a-long-random-string
   APP_DOMAIN=your-app-name.onrender.com
   NODE_ENV=production
   ```

   Optional variables (for Google OAuth):
   ```bash
   GOOGLE_CLIENT_ID_WEB=your-google-client-id
   GOOGLE_CLIENT_ID_IOS=your-ios-client-id
   GOOGLE_CLIENT_ID_ANDROID=your-android-client-id
   ```

5. **Deploy**: Click "Apply" and Render will start building and deploying your app

#### Option B: Manual Setup

1. **Go to Render Dashboard**: https://dashboard.render.com/

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

3. **Configure the service**:
   - **Name**: `hisab-barabar-api` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your deployment branch)
   - **Root Directory**: Leave blank
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (can upgrade later)

4. **Add Environment Variables** (same as Option A above)

5. **Create Web Service**: Click "Create Web Service"

### 3. Verify Deployment

Once deployed, your API will be available at:
```
https://your-app-name.onrender.com
```

Test the health check endpoint:
```bash
curl https://your-app-name.onrender.com/
```

Expected response:
```json
{
  "message": "SplitSaathi API is running!",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "status": "healthy",
  "version": "1.0.0",
  "database": "Connected to MongoDB",
  "domain": "your-app-name.onrender.com"
}
```

### 4. Configure Mobile App

Update your mobile app's API URL to point to the Render deployment:

1. **Update environment variables** in your `.env` file:
   ```
   EXPO_PUBLIC_API_URL=https://your-app-name.onrender.com
   EXPO_PUBLIC_APP_DOMAIN=your-app-name.onrender.com
   ```

2. **Rebuild the mobile app**:
   ```bash
   npx expo start --clear
   ```

## Important Notes

### Free Tier Limitations

Render's free tier has some limitations:
- **Cold starts**: Services spin down after 15 minutes of inactivity
- **First request after spin down**: May take 30-60 seconds
- **Monthly limit**: 750 hours of runtime (sufficient for one service)

### Performance Optimization

For production deployments, consider:
1. **Upgrade to Starter plan** ($7/month) for:
   - No spin down
   - Better performance
   - More resources

2. **Use connection pooling** for MongoDB (already configured)

3. **Enable caching** where appropriate

### Security Best Practices

1. **Environment Variables**: Never commit secrets to Git
2. **JWT Secret**: Use a long, random string (min 32 characters)
3. **MongoDB Password**: Use strong password and URL encode special characters
4. **CORS**: Configure specific origins in production

### Monitoring

Render provides:
- **Logs**: View real-time logs in the dashboard
- **Metrics**: Monitor CPU, memory, and request metrics
- **Alerts**: Set up alerts for service failures

Access logs:
```bash
# From Render dashboard
Services → Your Service → Logs
```

### Troubleshooting

#### Service won't start
- Check logs for error messages
- Verify all environment variables are set correctly
- Ensure MongoDB connection string is correct and IP is whitelisted

#### Can't connect to MongoDB
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check username/password are correct
- Ensure password special characters are URL encoded

#### API returns 404
- Check that routes are properly mounted in app.js
- Verify the deployed branch has latest code

#### Cold start issues
- Consider upgrading to paid plan
- Implement health check pinging (use external service like UptimeRobot)

## Continuous Deployment

With the `render.yaml` configuration:
- Render automatically deploys when you push to the main branch
- You can disable auto-deploy in service settings if needed
- Manual deploys can be triggered from the dashboard

## Custom Domain (Optional)

To use a custom domain:
1. Go to your service settings
2. Click "Custom Domain"
3. Add your domain
4. Update DNS records as instructed
5. SSL certificate is automatically provisioned

## Support

For issues:
- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
- MongoDB Atlas Support: https://www.mongodb.com/cloud/atlas/support

## Next Steps

After successful deployment:
1. ✅ Test all API endpoints
2. ✅ Update mobile app to use production API
3. ✅ Set up monitoring and alerts
4. ✅ Configure custom domain (optional)
5. ✅ Set up backup strategy for MongoDB
6. ✅ Document API endpoints for your team

---

**Deployment Checklist:**
- [ ] MongoDB Atlas cluster created
- [ ] Database user created with password
- [ ] IP whitelist configured (0.0.0.0/0)
- [ ] Connection string obtained
- [ ] Render account created
- [ ] GitHub repository connected
- [ ] Service deployed
- [ ] Environment variables configured
- [ ] Health check passing
- [ ] Mobile app updated with production URL
- [ ] API endpoints tested
- [ ] Monitoring set up
