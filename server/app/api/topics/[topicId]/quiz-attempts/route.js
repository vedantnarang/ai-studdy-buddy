import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import QuizAttempt from "@/models/QuizAttempt";
import Quiz from "@/models/Quiz";

export async function GET(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    await connectDB();
    const { topicId } = await params;

    if (!/^[0-9a-fA-F]{24}$/.test(topicId)) {
      return errorResponse("Invalid topic ID", "VALIDATION_ERROR", 400);
    }

    // Fetch the original quiz to reference the total question count
    const quiz = await Quiz.findOne({ topicId });
    const totalQuestions = quiz ? quiz.questions.length : 0;

    const attempts = await QuizAttempt.find({ 
      topicId, 
      userId: userPayload.userId,
      status: 'completed'
    }).sort({ createdAt: -1 }).lean();

    // Group attempts by quizId to return only unique quizzes with their most recent attempt
    const quizGroups = {};
    attempts.forEach(attempt => {
      const qId = attempt.quizId.toString();
      if (!quizGroups[qId]) {
        quizGroups[qId] = {
          quizId: qId,
          mostRecentAttempt: {
            ...attempt,
            totalQuestions: totalQuestions > 0 ? totalQuestions : attempt.answers.length
          },
          totalAttempts: 1
        };
      } else {
        quizGroups[qId].totalAttempts++;
      }
    });

    const uniqueQuizzes = Object.values(quizGroups);

    return successResponse({ attempts: uniqueQuizzes, rawAttemptsCount: attempts.length });
  } catch (error) {
    console.error("Fetch quiz history error:", error);
    return errorResponse("Failed to fetch quiz history", "FETCH_FAILED", 500);
  }
}
