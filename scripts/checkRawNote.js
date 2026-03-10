import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function checkRawNote() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const notesCollection = db.collection('notes');
    
    // Get raw note document
    const rawNote = await notesCollection.findOne({ title: 'Untitled' });
    
    if (rawNote) {
      console.log('📄 Raw note document:');
      console.log(JSON.stringify(rawNote, null, 2));
      
      console.log('\n🔍 Owner field:');
      console.log('  owner:', rawNote.owner);
      console.log('  owner type:', typeof rawNote.owner);
      console.log('  owner toString:', rawNote.owner?.toString());
      console.log('  owner id (hex):', rawNote.owner?.id?.toString('hex'));
      
      // Try to find user with this owner ID
      const usersCollection = db.collection('users');
      const user = await usersCollection.findOne({ _id: rawNote.owner });
      
      if (user) {
        console.log('\n✅ Found matching user:', user.email);
      } else {
        console.log('\n❌ No matching user found!');
        
        // List all user IDs
        const allUsers = await usersCollection.find().toArray();
        console.log('\n📊 All user IDs:');
        allUsers.forEach(u => {
          console.log(`   ${u._id} | ${u.email}`);
          console.log(`      Matches note owner: ${u._id.equals(rawNote.owner)}`);
        });
      }
    } else {
      console.log('No notes found');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkRawNote();
