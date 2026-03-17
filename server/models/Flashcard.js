import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema(
  {
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: [true, 'Topic ID is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
    },
    answer: {
      type: String,
      required: [true, 'Answer is required'],
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    difficultyBox: {
      type: Number,
      default: 1,
      min: [1, 'Difficulty box cannot be less than 1'],
      max: [5, 'Difficulty box cannot be greater than 5'],
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Flashcard = mongoose.models.Flashcard || mongoose.model('Flashcard', flashcardSchema);

export default Flashcard;