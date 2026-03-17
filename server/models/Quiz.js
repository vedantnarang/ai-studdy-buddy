import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
  },
  options: {
    type: [String],
    validate: [
      (arr) => arr.length === 4,
      'A multiple choice question must have exactly 4 options'
    ],
    required: true,
  },
  correctIndex: {
    type: Number,
    required: [true, 'Correct option index is required'],
    min: [0, 'Index must be between 0 and 3'],
    max: [3, 'Index must be between 0 and 3'],
  },
  explanation: {
    type: String,
    default: '',
  },
}, { _id: true }); // Embedded documents natively get an _id, which is helpful if a specific question needs isolation.

const quizSchema = new mongoose.Schema(
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
    questions: {
      type: [questionSchema], // Using the sub-schema for strict validation
      required: true,
      default: [],
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

const Quiz = mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);

export default Quiz;
