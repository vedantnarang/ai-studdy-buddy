import mongoose from 'mongoose';

const sourceImageSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: false,
  },
  url: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    required: true,
  },
  extractedText: {
    type: String,
    default: '',
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const sourceDocumentSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    enum: ['pdf', 'txt', 'image'],
    required: true,
  },
  extractedText: {
    type: String,
    default: '',
  },
  extractionMethod: {
    type: String,
    enum: ['text-parse', 'ocr', 'ai-vision'],
    default: 'text-parse',
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const topicSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject ID is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Topic title is required'],
      trim: true,
    },
    normalizedTitle: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
    summary: {
      type: String,
      default: null,
    },
    sourceImages: [sourceImageSchema],
    sourceDocuments: [sourceDocumentSchema],
    generationStatus: {
      hasFlashcards: {
        type: Boolean,
        default: false,
      },
      hasQuiz: {
        type: Boolean,
        default: false,
      },
      hasSummary: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

topicSchema.index({ subjectId: 1, normalizedTitle: 1 }, { unique: true });

// Prevent OverwriteModelError in Next.js backend
const Topic = mongoose.models.Topic || mongoose.model('Topic', topicSchema);

export default Topic;