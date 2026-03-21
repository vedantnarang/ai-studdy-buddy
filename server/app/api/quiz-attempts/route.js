import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import QuizAttempt from "@/models/QuizAttempt";

// GET /api/quiz-attempts?quizId=...&status=in_progress
export async function GET(request) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quizId');
    const status = searchParams.get('status');

    if (!quizId) {
      return errorResponse("quizId parameter is required", "VALIDATION_ERROR", 400);
    }

    await connectDB();
    
    const query = { userId: userPayload.userId, quizId };
    if (status) query.status = status;

    // Check if there is an unfinished attempt (sort by newest)
    const attempt = await QuizAttempt.findOne(query).sort({ createdAt: -1 });

    return successResponse({ attempt });
  } catch (error) {
    console.error("Fetch quiz attempt error:", error);
    return errorResponse("Failed to fetch quiz attempt", "FETCH_FAILED", 500);
  }
}

// POST /api/quiz-attempts
export async function POST(request) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await request.json();
    const { quizId, topicId } = body;

    if (!quizId || !topicId) {
      return errorResponse("quizId and topicId are required", "VALIDATION_ERROR", 400);
    }

    await connectDB();

    const newAttempt = await QuizAttempt.create({
      userId: userPayload.userId,
      quizId,
      topicId,
      answers: [],
      score: 0,
      status: 'in_progress',
    });

    return successResponse({ attempt: newAttempt }, 201);
  } catch (error) {
    console.error("Create quiz attempt error:", error);
    return errorResponse("Failed to create quiz attempt", "CREATE_FAILED", 500);
  }
}
