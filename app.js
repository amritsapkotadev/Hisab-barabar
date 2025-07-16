const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/db');
const passport = require('./backend/middleware/Passport');


// Route imports
const userRoutes = require('./backend/routes/userRoutes');
const groupRoutes = require('./backend/routes/groupRoutes');
const expenseRoutes = require('./backend/routes/expenseRoutes');
const authRoutes = require('./backend/routes/auth');

const app = express();

// ✅ Connect to MongoDB
connectDB();

// ✅ Initialize passport
app.use(passport.initialize());

// ✅ CORS Middleware
app.use(cors({
  origin: [
    'http://localhost:8081', 
    'http://localhost:3000', 
    'http://127.0.0.1:8081', 
    'http://localhost:19006',
    'https://splitsaathi.up.railway.app',
    'https://hisab-barabar.up.railway.app',
    'https://*.up.railway.app'
  ],
  credentials: true
}));

// ✅ Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ✅ Request Logging Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// ✅ Mount routes
app.use('/users', userRoutes);          // e.g. /users/register, /users/login
app.use('/api/groups', groupRoutes);    // e.g. /api/groups/
app.use('/groups', groupRoutes);        // Compatibility
app.use('/api/expenses', expenseRoutes);
app.use('/expenses', expenseRoutes);    // Compatibility
app.use('/api/auth', authRoutes);       // ✅ Google OAuth routes: /api/auth/google + /callback

// ✅ Static Files (optional)
app.use(express.static('public'));

// ✅ Join group link route (smart redirect)
app.get('/join/:groupId', (req, res) => {
  const { groupId } = req.params;
  const userAgent = req.get('User-Agent') || '';
  const APP_DOMAIN = process.env.APP_DOMAIN || 'splitsaathi.up.railway.app';
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);

  if (isMobile) {
    const deepLink = `splitsaathi://join/${groupId}`;
    const appStoreLink = 'https://apps.apple.com/app/splitsaathi'; // Update if needed
    const playStoreLink = 'https://play.google.com/store/apps/details?id=com.splitsaathi'; // Update if needed

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Join Group - SplitSaathi</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .container {
            background: #fff;
            padding: 40px 30px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
            width: 100%;
          }
          .logo {
            font-size: 48px;
            margin-bottom: 20px;
          }
          h1 {
            color: #333;
            font-size: 24px;
            margin-bottom: 10px;
          }
          p {
            color: #666;
            margin-bottom: 30px;
            line-height: 1.5;
          }
          .btn {
            display: inline-block;
            padding: 15px 30px;
            background: #4f46e5;
            color: #fff;
            border-radius: 10px;
            text-decoration: none;
            margin: 10px;
            font-weight: 600;
            transition: background 0.3s;
          }
          .btn:hover {
            background: #4338ca;
          }
          .btn-secondary {
            background: #6b7280;
          }
          .btn-secondary:hover {
            background: #4b5563;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">💰</div>
          <h1>Join Group on SplitSaathi</h1>
          <p>You've been invited to join a group. Open the app to continue:</p>
          <a href="${deepLink}" class="btn">Open App</a><br/>
          <a href="${appStoreLink}" class="btn btn-secondary">iOS</a>
          <a href="${playStoreLink}" class="btn btn-secondary">Android</a>
          <script>
            setTimeout(() => {
              window.location.href = '${deepLink}';
            }, 1000);
          </script>
        </div>
      </body>
      </html>
    `);
  } else {
    res.redirect(`https://${APP_DOMAIN}/join/${groupId}`);
  }
});

// ✅ Health Check
app.get('/', (req, res) => {
  res.json({
    message: 'SplitSaathi API is running!',
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'Connected to MongoDB' : 'Database connection issue',
    domain: process.env.APP_DOMAIN || 'splitsaathi.up.railway.app'
  });
});

// ✅ Test route
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API test successful',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// ✅ 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: `Route ${req.originalUrl} not found`
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 5051;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 API available at http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 JWT Secret configured: ${!!process.env.JWT_SECRET}`);
  console.log(`🗄️ MongoDB URI configured: ${!!process.env.MONGO_URI}`);
  console.log(`🌐 App Domain: ${process.env.APP_DOMAIN || 'splitsaathi.up.railway.app'}`);
});

module.exports = app;
