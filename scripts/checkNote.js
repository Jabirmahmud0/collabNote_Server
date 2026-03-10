import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function checkNote(noteId) {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const notesCollection = db.collection('notes');
    
    const rawNote = await notesCollection.findOne({ _id: noteId });
    
    if (rawNote) {
      console.log('📄 Note:', rawNote._id);
      console.log('   Owner ID:', rawNote.owner.toString());
      console.log('   Title:', rawNote.title);
      
      const usersCollection = db.collection('users');
      const owner = await usersCollection.findOne({ _id: rawNote.owner });
      
      if (owner) {
        console.log('   Owner Email:', owner.email);
        console.log('   Owner Name:', owner.name);
      } else {
        console.log('   ❌ Owner not found!');
      }
    } else {
      console.log('Note not found:', noteId);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Check the note from the error: 69b054b446e729cee5ea0ba8
checkNote('69b054b446e729cee5ea0ba8');
