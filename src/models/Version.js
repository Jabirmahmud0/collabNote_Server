import mongoose from 'mongoose';

const versionSchema = new mongoose.Schema(
  {
    note: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Note',
      required: true,
    },
    content: {
      type: Object, // Quill Delta snapshot
      required: true,
    },
    savedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    versionNumber: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
versionSchema.index({ note: 1, versionNumber: -1 });
versionSchema.index({ note: 1, createdAt: -1 });

// Static method to get next version number
versionSchema.statics.getNextVersionNumber = async function (noteId) {
  const lastVersion = await this.findOne({ note: noteId }).sort({ versionNumber: -1 });
  return lastVersion ? lastVersion.versionNumber + 1 : 1;
};

// Static method to get versions for a note
versionSchema.statics.getVersionsForNote = async function (noteId, limit = 10) {
  return await this.find({ note: noteId })
    .sort({ versionNumber: -1 })
    .limit(limit)
    .populate('savedBy', 'name avatar');
};

const Version = mongoose.model('Version', versionSchema);

export default Version;
