import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import QuizAttempt from "@/models/QuizAttempt";

export async function PUT(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { attemptId } = await params;
    const body = await request.json();
    const { questionId, selectedOptionIndex, isCorrect, isFinished } = body;

    await connectDB();

    // If simply marking as finished
    if (isFinished) {
      const finishedAttempt = await QuizAttempt.findOneAndUpdate(
        { _id: attemptId, userId: userPayload.userId },
        { $set: { status: 'completed' } },
        { new: true }
      );
      if (!finishedAttempt) return errorResponse("Attempt not found", "NOT_FOUND", 404);
      return successResponse({ attempt: finishedAttempt });
    }

    if (!questionId || selectedOptionIndex === undefined || isCorrect === undefined) {
      return errorResponse("Missing required fields for answer submission", "VALIDATION_ERROR", 400);
    }

    // Use a precise query to only update if the questionId hasn't been answered yet
    // This blocks cheating where a user tries to submit multiple answers for the same question
    const updatedAttempt = await QuizAttempt.findOneAndUpdate(
      { 
        _id: attemptId, 
        userId: userPayload.userId,
        "answers.questionId": { $ne: questionId } // Ensure this question hasn't been answered
      },
      {
        $push: {
          answers: { questionId, selectedOptionIndex, isCorrect }
        },
        $inc: {
          score: isCorrect ? 1 : 0
        }
      },
      { new: true }
    );

    if (!updatedAttempt) {
      // It could be not found, OR the user already answered this question.
      // Let's check which one it is to return a proper error.
      const existing = await QuizAttempt.findOne({ _id: attemptId, userId: userPayload.userId });
      if (!existing) {
        return errorResponse("Attempt not found", "NOT_FOUND", 404);
      } else {
        return errorResponse("Question already answered", "ALREADY_ANSWERED", 400);
      }
    }

    return successResponse({ attempt: updatedAttempt });

  } catch (error) {
    console.error("Submit quiz answer error:", error);
    return errorResponse("Failed to submit answer", "SUBMIT_FAILED", 500);
  }
}
