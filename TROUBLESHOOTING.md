# Render.com Deployment - Troubleshooting Guide

Common issues and solutions when deploying to Render.com

## Build & Deployment Issues

### ❌ Build fails with "npm install" error

**Problem**: Dependencies fail to install

**Solutions**:
1. Check `package.json` is in the repository root
2. Verify all dependencies are in `dependencies` (not just `devDependencies`)
3. Check Node version compatibility (Render uses Node 20 by default)
4. Look at build logs for specific error messages

---

### ❌ Service keeps crashing after deployment

**Problem**: App starts but immediately crashes

**Solutions**:

1. **Check Environment Variables**:
   ```bash
   # Via Render Dashboard:
   # Services → Your Service → Environment
   ```
   Verify all required variables are set:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `PORT` (usually 10000)

2. **Check Logs**:
   ```bash
   # Via Render Dashboard:
   # Services → Your Service → Logs
   ```
   Look for error messages like:
   - "MONGO_URI environment variable is not set"
   - "Cannot connect to MongoDB"
   - Port binding issues

3. **Verify Start Command**:
   - Should be: `npm start` or `node app.js`
   - NOT: `nodemon app.js` (nodemon is for development)

---

## Database Connection Issues

### ❌ "MongoDB Connection Failed"

**Problem**: Can't connect to MongoDB Atlas

**Solutions**:

1. **Check IP Whitelist**:
   - Go to MongoDB Atlas → Network Access
   - Ensure `0.0.0.0/0` is in the whitelist
   - This allows connections from anywhere (including Render)

2. **Verify Connection String**:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   ```
   - Replace `username` with your DB user
   - Replace `password` with your DB password
   - Replace `cluster` with your cluster name
   - Replace `database` with your database name

3. **URL Encode Special Characters**:
   If your password has special characters, encode them:
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - `%` → `%25`
   - etc.

4. **Check Credentials**:
   - Verify username/password are correct
   - User must have read/write permissions
   - Database name must exist or user has create permissions

---

### ❌ "authentication failed"

**Problem**: MongoDB credentials are incorrect

**Solutions**:
1. Reset database user password in MongoDB Atlas
2. Update `MONGO_URI` in Render environment variables
3. Ensure username doesn't contain special characters
4. URL encode the password if it has special characters

---

## Application Issues

### ❌ API returns 404 for all routes

**Problem**: Routes not working after deployment

**Solutions**:

1. **Check Route Mounting**:
   Verify in `app.js`:
   ```javascript
   app.use('/users', userRoutes);
   app.use('/api/groups', groupRoutes);
   app.use('/api/expenses', expenseRoutes);
   ```

2. **Test Health Check**:
   ```bash
   curl https://your-app.onrender.com/
   ```
   Should return JSON with status

3. **Check Logs**:
   Look for route registration messages in deployment logs

---

### ❌ CORS errors in mobile app

**Problem**: Mobile app can't connect to API

**Error Message**:
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solutions**:

1. **Verify CORS Configuration** in `app.js`:
   ```javascript
   app.use(cors({
     origin: [
       'http://localhost:8081',
       'https://*.onrender.com',
       /https:\/\/.*\.onrender\.com$/
     ],
     credentials: true
   }));
   ```

2. **Update Mobile App URL**:
   In your `.env` or app config:
   ```env
   EXPO_PUBLIC_API_URL=https://your-app.onrender.com
   ```

3. **Clear Mobile App Cache**:
   ```bash
   npx expo start --clear
   ```

---

### ❌ Service is very slow (30+ seconds to respond)

**Problem**: Free tier cold starts

**Explanation**:
- Render free tier spins down after 15 minutes of inactivity
- First request wakes up the service (30-60 seconds)
- Subsequent requests are fast

**Solutions**:

1. **Upgrade Plan** (Recommended for production):
   - Starter Plan: $7/month
   - Services stay always-on
   - Better performance

2. **Use External Ping Service** (Free tier workaround):
   - Set up UptimeRobot or similar
   - Ping your API every 10 minutes
   - Keeps service alive
   - Configure at: https://uptimerobot.com

---

## Environment Variable Issues

### ❌ "JWT_SECRET is not configured"

**Problem**: JWT secret environment variable missing

**Solutions**:
1. Add `JWT_SECRET` in Render Dashboard:
   - Services → Your Service → Environment
   - Add variable: `JWT_SECRET`
   - Value: A long random string (32+ characters)

2. Generate a strong secret:
   ```bash
   # On your local machine:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

---

### ❌ Environment variables not updating

**Problem**: Changed env vars but app still uses old values

**Solutions**:
1. After changing env vars, you must **redeploy**:
   - Manual Deploy button in Render Dashboard
   - Or push a new commit to GitHub

2. Check variable names are exact (case-sensitive):
   - `MONGO_URI` not `MONGODB_URI`
   - `JWT_SECRET` not `JWT_TOKEN`

---

## Deployment Timing Issues

### ❌ "Deployment timed out"

**Problem**: Build or startup takes too long

**Solutions**:

1. **Check Build Time**:
   - Should complete in 2-5 minutes
   - If longer, may have dependency issues

2. **Verify Dependencies**:
   - Remove unused dependencies from `package.json`
   - Use `npm prune` locally

3. **Check Logs**:
   - Build logs show what's taking time
   - May be downloading large dependencies

---

## Health Check Issues

### ❌ Health check failing

**Problem**: Render can't reach health check endpoint

**Solutions**:

1. **Verify Health Check Path**:
   In `render.yaml`:
   ```yaml
   healthCheckPath: /
   ```

2. **Test Locally**:
   ```bash
   curl http://localhost:5051/
   ```
   Should return JSON response

3. **Check Port Binding**:
   In `app.js`:
   ```javascript
   const PORT = process.env.PORT || 5051;
   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

4. **Verify Response**:
   Health check must return HTTP 200
   Current health endpoint returns:
   ```json
   {
     "message": "SplitSaathi API is running!",
     "status": "healthy"
   }
   ```

---

## Logs & Debugging

### How to Access Logs

1. **Real-time Logs**:
   - Render Dashboard → Services → Your Service → Logs
   - Shows live application output

2. **Download Logs**:
   - Click "Download" button in logs view
   - Useful for detailed analysis

### What to Look For in Logs

✅ **Successful Startup**:
```
🔄 Connecting to MongoDB...
✅ MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net
🚀 Server running on port 10000
```

❌ **Failed Startup**:
```
❌ MongoDB Connection Failed: ...
❌ MONGO_URI environment variable is not set
Error: Cannot find module 'express'
```

---

## Getting Help

### Still having issues?

1. **Check Render Status**:
   - https://status.render.com
   - Verify no platform-wide outages

2. **Render Documentation**:
   - https://render.com/docs
   - Comprehensive guides and references

3. **Render Community**:
   - https://community.render.com
   - Active community forum

4. **MongoDB Atlas Support**:
   - https://www.mongodb.com/cloud/atlas/support
   - For database-specific issues

5. **Project Issues**:
   - https://github.com/amritsapkotadev/Hisab-barabar/issues
   - Report bugs or ask for help

---

## Useful Commands

### Test API Locally Before Deploying
```bash
# Set environment variables
export MONGO_URI="your-connection-string"
export JWT_SECRET="your-jwt-secret"
export NODE_ENV="development"

# Start server
npm start

# Test in another terminal
curl http://localhost:5051/
```

### Check Environment Variables
```bash
# Via Render Dashboard
Services → Your Service → Environment → Show All
```

### Force Redeploy
```bash
# Via Render Dashboard
Services → Your Service → Manual Deploy → Deploy latest commit
```

### View Service Metrics
```bash
# Via Render Dashboard
Services → Your Service → Metrics
# Shows CPU, Memory, Request counts
```

---

## Pre-Deployment Checklist

Before deploying, verify:

- [ ] `package.json` has all required dependencies
- [ ] `render.yaml` is in repository root
- [ ] MongoDB cluster is running
- [ ] Database user created with password
- [ ] IP whitelist includes `0.0.0.0/0`
- [ ] Connection string is correct
- [ ] JWT secret is generated
- [ ] All environment variables documented
- [ ] Health check endpoint works locally
- [ ] CORS configuration includes Render domains

---

**Quick Reference**: See [RENDER_QUICKSTART.md](RENDER_QUICKSTART.md) for deployment steps
