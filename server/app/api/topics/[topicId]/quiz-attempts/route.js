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

    // Fetch ALL quizzes for this topic
    const quizzes = await Quiz.find({ topicId, userId: userPayload.userId })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch all completed attempts for this topic
    const attempts = await QuizAttempt.find({ 
      topicId, 
      userId: userPayload.userId,
      status: 'completed'
    }).sort({ createdAt: -1 }).lean();

    // Build groups starting from quizzes (so quizzes with 0 attempts still show)
    const quizGroups = {};
    quizzes.forEach(q => {
      quizGroups[q._id.toString()] = {
        quizId: q._id.toString(),
        quizCreatedAt: q.createdAt,
        totalQuestions: q.questions.length,
        mostRecentAttempt: null,
        allAttempts: [],
        totalAttempts: 0
      };
    });

    // Fill in attempts
    attempts.forEach(attempt => {
      const qId = attempt.quizId.toString();
      const group = quizGroups[qId];
      if (!group) return; // Quiz was deleted, skip orphaned attempts

      const totalQ = group.totalQuestions || attempt.answers.length;
      const attemptData = {
        _id: attempt._id,
        score: attempt.score,
        totalQuestions: totalQ,
        createdAt: attempt.createdAt,
      };

      if (!group.mostRecentAttempt) {
        group.mostRecentAttempt = attemptData;
      }
      group.allAttempts.push(attemptData);
      group.totalAttempts++;
    });

    // Sort newest quiz first
    const result = Object.values(quizGroups).sort(
      (a, b) => new Date(b.quizCreatedAt) - new Date(a.quizCreatedAt)
    );

    return successResponse({ 
      attempts: result, 
      totalQuizzes: quizzes.length,
      rawAttemptsCount: attempts.length 
    });
  } catch (error) {
    console.error("Fetch quiz history error:", error);
    return errorResponse("Failed to fetch quiz history", "FETCH_FAILED", 500);
  }
}
