import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function checkData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      avatar: String,
    }, { timestamps: true }));

    const Note = mongoose.model('Note', new mongoose.Schema({
      owner: mongoose.Schema.Types.ObjectId,
      title: String,
      isDeleted: Boolean,
    }, { timestamps: true }));

    const users = await User.find().select('name email createdAt');
    const notes = await Note.find().populate('owner', 'email');

    console.log('📊 USERS:');
    users.forEach(u => {
      console.log(`   - ${u._id} | ${u.email} | ${u.name} | ${u.createdAt.toISOString()}`);
    });

    console.log('\n📝 NOTES:');
    notes.forEach(n => {
      console.log(`   - ${n._id} | Owner: ${n.owner?.email || 'UNKNOWN'} | Title: ${n.title}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkData();
