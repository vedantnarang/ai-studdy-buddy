import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required to create a subject'],
    },
    title: {
      type: String,
      required: [true, 'Subject title is required'],
      trim: true,
    },
    normalizedTitle: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index at DB level
subjectSchema.index({ userId: 1, normalizedTitle: 1 }, { unique: true });

const Subject = mongoose.models.Subject || mongoose.model('Subject', subjectSchema);

export default Subject;