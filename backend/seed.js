const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('./models/User');

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/auth_system_db');
    console.log('[Seed] Connected to database');

    // Create demo standard user if not exists
    const existingDemo = await User.findOne({ username: 'demo_user' });
    if (!existingDemo) {
      await User.create({
        username: 'demo_user',
        email: 'demo@authshield.io',
        password: 'SecurePass123!',
        fullName: 'Alex Rivera',
        role: 'user',
        bio: 'Fullstack developer exploring secure JWT authentication and password hashing algorithms.'
      });
      console.log('[Seed] Created demo user: demo_user / SecurePass123!');
    } else {
      console.log('[Seed] Demo user already exists.');
    }

    // Create demo admin user if not exists
    const existingAdmin = await User.findOne({ username: 'admin_user' });
    if (!existingAdmin) {
      await User.create({
        username: 'admin_user',
        email: 'admin@authshield.io',
        password: 'AdminSecret123!',
        fullName: 'Security Officer',
        role: 'admin',
        bio: 'System Administrator with elevated privileges and RBAC access.'
      });
      console.log('[Seed] Created admin user: admin_user / AdminSecret123!');
    } else {
      console.log('[Seed] Admin user already exists.');
    }

    console.log('[Seed] Complete.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedUsers();
