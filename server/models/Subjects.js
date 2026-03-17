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
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Subject = mongoose.models.Subject || mongoose.model('Subject', subjectSchema);

export default Subject;