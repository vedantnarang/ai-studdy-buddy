import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import Flashcard from "@/models/Flashcard";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";

export async function GET(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    await connectDB();
    const { subjectId } = await params;

    // First ensure the subject exists and belongs to user
    const subject = await Subject.findOne({ _id: subjectId, userId: userPayload.userId });
    if (!subject) {
      return errorResponse("Subject not found", "NOT_FOUND", 404);
    }

    // Find all topics under this subject
    const topics = await Topic.find({ subjectId }).select('_id title');
    const topicIds = topics.map(t => t._id);

    // Fetch all flashcards linked to those topics
    const flashcards = await Flashcard.find({ topicId: { $in: topicIds } }).lean();

    // Group flashcards by exactly their topic title
    const groupedFlashcards = topics.map(topic => ({
      topicId: topic._id,
      topicTitle: topic.title,
      flashcards: flashcards.filter(fc => fc.topicId.toString() === topic._id.toString())
    })).filter(group => group.flashcards.length > 0);

    return successResponse({
      subject: { title: subject.title, color: subject.color },
      groupedFlashcards
    }, 200);

  } catch (error) {
    console.error("GET subject flashcards error:", error);
    return errorResponse(error.message || "Internal server error", "SERVER_ERROR", 500);
  }
}
