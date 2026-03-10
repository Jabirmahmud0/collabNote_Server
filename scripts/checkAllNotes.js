import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function checkAllNotes() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const notesCollection = db.collection('notes');
    const usersCollection = db.collection('users');
    
    const allNotes = await notesCollection.find().toArray();
    const allUsers = await usersCollection.find().toArray();
    
    console.log('📊 All notes:');
    for (const note of allNotes) {
      const owner = allUsers.find(u => u._id.equals(note.owner));
      console.log(`   ${note._id} | Owner: ${note.owner.toString()} | ${owner ? owner.email : 'UNKNOWN'}`);
    }
    
    console.log('\n📊 All users:');
    for (const user of allUsers) {
      console.log(`   ${user._id} | ${user.email}`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAllNotes();
