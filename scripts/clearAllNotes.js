import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function clearAllNotes() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const Note = mongoose.model('Note', new mongoose.Schema({
      owner: mongoose.Schema.Types.ObjectId,
      title: String,
    }, { timestamps: true }));

    const Version = mongoose.model('Version', new mongoose.Schema({
      note: mongoose.Schema.Types.ObjectId,
    }, { timestamps: true }));

    const result = await Note.deleteMany({});
    const versionsResult = await Version.deleteMany({});

    console.log(`✅ Deleted ${result.deletedCount} note(s)`);
    console.log(`✅ Deleted ${versionsResult.deletedCount} version(s)`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearAllNotes();
