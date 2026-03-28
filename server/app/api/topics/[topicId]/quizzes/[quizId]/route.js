import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import Quiz from "@/models/Quiz";
import QuizAttempt from "@/models/QuizAttempt";
import Topic from "@/models/Topic";

export async function GET(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    await connectDB();
    const { topicId, quizId } = await params;

    if (!/^[0-9a-fA-F]{24}$/.test(topicId) || !/^[0-9a-fA-F]{24}$/.test(quizId)) {
      return errorResponse("Invalid ID", "VALIDATION_ERROR", 400);
    }

    const quiz = await Quiz.findOne({ _id: quizId, topicId, userId: userPayload.userId });
    if (!quiz) {
      return errorResponse("Quiz not found", "NOT_FOUND", 404);
    }

    return successResponse({ quiz });
  } catch (error) {
    console.error("Fetch quiz error:", error);
    return errorResponse(error.message || "Failed to fetch quiz", "FETCH_FAILED", 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    await connectDB();
    const { topicId, quizId } = await params;

    if (!/^[0-9a-fA-F]{24}$/.test(topicId) || !/^[0-9a-fA-F]{24}$/.test(quizId)) {
      return errorResponse("Invalid ID", "VALIDATION_ERROR", 400);
    }

    const quiz = await Quiz.findOne({ _id: quizId, topicId, userId: userPayload.userId });
    if (!quiz) {
      return errorResponse("Quiz not found", "NOT_FOUND", 404);
    }

    // Delete the quiz
    await Quiz.deleteOne({ _id: quizId });
    
    // Delete all related attempts
    await QuizAttempt.deleteMany({ quizId, userId: userPayload.userId });

    // Also check if this was the last quiz for the topic. If so, update Topic generationStatus
    const remainingQuizzes = await Quiz.countDocuments({ topicId, userId: userPayload.userId });
    if (remainingQuizzes === 0) {
      await Topic.updateOne(
        { _id: topicId },
        { $set: { "generationStatus.hasQuiz": false } }
      );
    }

    return successResponse({ message: "Quiz deleted successfully" }, 200);

  } catch (error) {
    console.error("Delete quiz error:", error);
    return errorResponse(error.message || "Failed to delete quiz", "SERVER_ERROR", 500);
  }
}
