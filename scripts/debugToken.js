import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

// Token from the request
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YjA0ZWNlNDZlNzI5Y2VlNWVhMGE2MyIsImlhdCI6MTc3MzE2MjE5MSwiZXhwIjoxNzczMTYzMDkxfQ.4xTOSD8kwkyuPyK7pabVG8In2rdFlMGBJop8MLsHxPU';

async function debugToken() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Decode token
    const decoded = jwt.verify(TOKEN, JWT_SECRET);
    console.log('📇 Token decoded:', decoded);

    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      password: String,
    }, { timestamps: true }));

    // Find user from token
    const user = await User.findById(decoded.id).select('-password');
    
    if (user) {
      console.log('✅ User found:', {
        id: user._id,
        email: user.email,
        name: user.name,
      });
    } else {
      console.log('❌ User NOT found! Token ID:', decoded.id);
      
      // Find all users
      const allUsers = await User.find().select('id email name');
      console.log('\n📊 All users:');
      allUsers.forEach(u => {
        console.log(`   - ${u._id} | ${u.email}`);
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugToken();
