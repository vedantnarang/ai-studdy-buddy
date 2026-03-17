import { connectDB } from "@/lib/db";
import Topic from "@/models/Topic";
import Subject from "@/models/Subject";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { topicSchema } from "@/schemas/topic.schema";
import { validateBody } from "@/lib/validate";

export async function GET(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    await connectDB();
    const subjectId = params.subjectId;

    const subject = await Subject.findOne({ _id: subjectId, userId: userPayload.userId });
    if (!subject) {
      return errorResponse("Subject not found!", "NOT_FOUND", 404);
    }

    const topics = await Topic.find({ subjectId, userId: userPayload.userId });
    
    return successResponse(topics, 200);

  } catch (error) {
    console.error("GET topics error:", error);
    return errorResponse(error.message || "Internal server error.", "SERVER_ERROR", 500);
  }
}

export async function POST(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await request.json();
    const data = validateBody(topicSchema, body);
    
    await connectDB();
    const subjectId = params.subjectId;

    const subject = await Subject.findOne({ _id: subjectId, userId: userPayload.userId });
    if (!subject) {
      return errorResponse("Subject not found!", "NOT_FOUND", 404);
    }

    const normalizedTitle = data.title.trim().replace(/\s+/g, ' ').toLowerCase();

    // Check if duplicate topic exists inside the same subject
    const existingTopic = await Topic.findOne({
      subjectId,
      normalizedTitle
    });

    if (existingTopic) {
      return errorResponse("A topic with this title already exists in this subject.", "CONFLICT", 409);
    }

    const newTopic = await Topic.create({
      subjectId,
      userId: userPayload.userId,
      title: data.title,
      normalizedTitle,
    });

    return successResponse(newTopic, 201);

  } catch (error) {
    console.error("POST topic error:", error);
    if (error.name === "ValidationError") {
      return errorResponse(error.message, "VALIDATION_ERROR", 400);
    }
    return errorResponse(error.message || "Internal server error.", "SERVER_ERROR", 500);
  }
}
