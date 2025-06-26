const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if MONGO_URI is provided
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI environment variable is not set');
      console.log('📝 Please add your MongoDB connection string to the .env file');
      console.log('Example: MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/splitwise?retryWrites=true&w=majority');
      process.exit(1);
    }

    // MongoDB connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    };

    console.log('🔄 Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGO_URI, options);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

  } catch (err) {
    console.error('❌ MongoDB Connection Failed:', err.message);
    
    // Log specific connection errors
    if (err.message.includes('authentication failed')) {
      console.error('🔐 Check your username and password in the connection string');
    } else if (err.message.includes('network')) {
      console.error('🌐 Check your network connection and MongoDB Atlas cluster status');
    } else if (err.message.includes('timeout')) {
      console.error('⏱️ Connection timeout - check your MongoDB cluster is running');
    }
    
    console.log('💡 Make sure to:');
    console.log('   1. Replace your_username and your_password in .env file');
    console.log('   2. Whitelist your IP address in MongoDB Atlas');
    console.log('   3. Ensure your cluster is running');
    console.log('   4. URL encode special characters in your password');
    
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('📴 MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during MongoDB disconnection:', err);
    process.exit(1);
  }
});

module.exports = connectDB;