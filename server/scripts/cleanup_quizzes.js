import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const quizSchema = new mongoose.Schema({
  topicId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
}, { strict: false, timestamps: true });

const Quiz = mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);

async function check() {
  await mongoose.connect(process.env.NEXT_PUBLIC_MONGODB_URI);
  console.log('Connected to MongoDB');
  
  const quizzes = await Quiz.find({ topicId: '69bfc69f1dc53b6f184cda71' }).sort({ createdAt: -1 });
  console.log(`Found ${quizzes.length} quizzes for this topic.`);
  
  if (quizzes.length > 1) {
    console.log('Keeping the latest one and deleting the rest...');
    // Keep the first one (latest), delete the rest
    const idsToDelete = quizzes.slice(1).map(q => q._id);
    await Quiz.deleteMany({ _id: { $in: idsToDelete } });
    console.log(`Deleted ${idsToDelete.length} duplicate quizzes.`);
  }

  await mongoose.disconnect();
}

check();
