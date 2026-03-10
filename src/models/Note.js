import mongoose from 'mongoose';

const collaboratorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view',
    },
  },
  { _id: false }
);

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: 'Untitled',
      trim: true,
    },
    content: {
      type: Object, // Quill Delta JSON format
      default: { ops: [] },
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collaborators: [collaboratorSchema],
    tags: {
      type: [String],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
noteSchema.index({ owner: 1, isDeleted: 1 });
noteSchema.index({ 'collaborators.user': 1 });
noteSchema.index({ tags: 1 });

// Virtual for getting excerpt from content
noteSchema.virtual('excerpt').get(function () {
  if (!this.content || !this.content.ops) return '';

  const textOps = this.content.ops
    .filter((op) => typeof op.insert === 'string')
    .map((op) => op.insert)
    .join('');

  return textOps.slice(0, 100) + (textOps.length > 100 ? '...' : '');
});

// Method to soft delete
noteSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Method to restore
noteSchema.methods.restore = function () {
  this.isDeleted = false;
  this.deletedAt = null;
  return this.save();
};

// Method to check if user has permission
noteSchema.methods.hasPermission = function (userId, permission = 'view') {
  const userIdStr = userId ? userId.toString() : '';
  const ownerId = this.owner && this.owner._id ? this.owner._id.toString() : (this.owner ? this.owner.toString() : '');

  console.log('[hasPermission] Check:', {
    userIdStr,
    ownerId,
    permission,
    isOwner: ownerId === userIdStr
  });

  if (ownerId === userIdStr) return true;

  const collaborator = this.collaborators.find((c) => {
    const collabId = c.user && c.user._id ? c.user._id.toString() : (c.user ? c.user.toString() : '');
    return collabId === userIdStr;
  });

  if (!collaborator) return false;

  if (permission === 'edit') {
    return collaborator.permission === 'edit';
  }

  return true;
};

const Note = mongoose.model('Note', noteSchema);

export default Note;
