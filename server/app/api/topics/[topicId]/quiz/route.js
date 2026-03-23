import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import Quiz from "@/models/Quiz";
import Topic from "@/models/Topic";

export async function GET(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    await connectDB();
    const { topicId } = await params;

    if (!/^[0-9a-fA-F]{24}$/.test(topicId)) {
      return errorResponse("Invalid topic ID", "VALIDATION_ERROR", 400);
    }

    const quiz = await Quiz.findOne({ topicId, userId: userPayload.userId }).sort({ createdAt: -1 });
    
    if (!quiz) {
      return errorResponse("No quiz found for this topic.", "NOT_FOUND", 404);
    }

    return successResponse({ quiz });
  } catch (error) {
    console.error("Fetch quiz error:", error);
    return errorResponse(error.message || "Failed to fetch quiz", "FETCH_FAILED", 500);
  }
}
