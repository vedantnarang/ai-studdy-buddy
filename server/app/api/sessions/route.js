import { connectDB } from "@/lib/db";
import Session from "@/models/Session";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";

export async function GET(request) {
  try {
    const userPayload = await getAuthUser(request);
    
    if (!userPayload) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    await connectDB();
    const sessions = await Session.find({ userId: userPayload.userId }).sort({ createdAt: -1 });
    return successResponse(sessions, 200);

  } catch (error) {
    console.error("Fetch sessions error:", error);
    return errorResponse(error.message || "Internal server error.", "SERVER_ERROR", 500);
  }
}

export async function POST(request) {
  try {
    const userPayload = await getAuthUser(request);
    
    if (!userPayload) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { topicId, type, score, totalQuestions } = await request.json();

    if (!topicId || !type || score === undefined || totalQuestions === undefined) {
      return errorResponse("Missing required fields", "VALIDATION_ERROR", 400);
    }

    await connectDB();
    const newSession = await Session.create({
      userId: userPayload.userId,
      topicId,
      type,
      score,
      totalQuestions
    });

    return successResponse(newSession, 201);

  } catch (error) {
    console.error("Create session error:", error);
    return errorResponse(error.message || "Internal server error.", "SERVER_ERROR", 500);
  }
}
