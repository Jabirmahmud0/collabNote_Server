import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env');
  process.exit(1);
}

async function fixDuplicateUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      avatar: String,
      refreshToken: String,
    }, { timestamps: true }));

    const Note = mongoose.model('Note', new mongoose.Schema({
      owner: mongoose.Schema.Types.ObjectId,
      title: String,
      isDeleted: Boolean,
    }, { timestamps: true }));

    // Find duplicate emails
    const duplicates = await User.aggregate([
      { $group: { _id: '$email', count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } },
    ]);

    if (duplicates.length === 0) {
      console.log('✅ No duplicate users found');
      await mongoose.disconnect();
      return;
    }

    console.log(`⚠️  Found ${duplicates.length} duplicate email(s)\n`);

    for (const dup of duplicates) {
      console.log(`📧 Email: ${dup._id}`);
      console.log(`   User IDs: ${dup.ids.map(id => id.toString()).join(', ')}`);

      // Find the user with Google auth (no password hash or shorter password)
      const users = await User.find({ email: dup._id }).select('password createdAt');
      
      // Identify Google user (password is googleId or random, not bcrypt hash)
      let googleUserId = null;
      let regularUserId = null;

      for (const user of users) {
        if (user.password && user.password.startsWith('$2a$')) {
          // This is a regular user (bcrypt hash)
          regularUserId = user._id;
        } else {
          // This is a Google user (plain text password)
          googleUserId = user._id;
        }
      }

      // If we found both, keep the Google user and reassign notes
      if (googleUserId && regularUserId) {
        console.log(`   → Keeping Google user: ${googleUserId}`);
        console.log(`   → Migrating notes from: ${regularUserId}`);

        // Reassign notes from regular user to Google user
        const result = await Note.updateMany(
          { owner: regularUserId },
          { $set: { owner: googleUserId } }
        );

        console.log(`   → Migrated ${result.modifiedCount} note(s)\n`);

        // Delete the regular user
        await User.findByIdAndDelete(regularUserId);
        console.log(`   → Deleted regular user: ${regularUserId}\n`);
      } else {
        // Multiple Google users or multiple regular users - keep the oldest
        const sortedUsers = users.sort((a, b) => a.createdAt - b.createdAt);
        const keepUser = sortedUsers[0];
        const deleteUsers = sortedUsers.slice(1);

        console.log(`   → Keeping user: ${keepUser._id}`);

        for (const userToDelete of deleteUsers) {
          await Note.updateMany(
            { owner: userToDelete._id },
            { $set: { owner: keepUser._id } }
          );
          await User.findByIdAndDelete(userToDelete._id);
          console.log(`   → Migrated notes and deleted: ${userToDelete._id}`);
        }
        console.log('');
      }
    }

    console.log('✅ Duplicate users fixed!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixDuplicateUsers();
