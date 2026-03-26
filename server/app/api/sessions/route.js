import { connectDB } from "@/lib/db";
import Session from "@/models/Session";
import Topic from "@/models/Topic";
import Subject from "@/models/Subject";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";

export async function GET(request) {
  try {
    const userPayload = await getAuthUser(request);
    
    if (!userPayload) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    await connectDB();
    
    // First fetch subjects to know what's active
    const subjects = await Subject.find({ userId: userPayload.userId }).select('_id').lean();
    const validSubjectIds = new Set(subjects.map(s => s._id.toString()));

    // Fetch sessions and populate topic
    const sessions = await Session.find({ userId: userPayload.userId })
      .populate('topicId', 'title subjectId')
      .sort({ createdAt: -1 })
      .lean();

    // Filter to only include sessions for topics that belong to active subjects
    const filteredSessions = sessions.filter(s => {
      return s.topicId && validSubjectIds.has(s.topicId.subjectId?.toString());
    });

    return successResponse(filteredSessions, 200);

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
