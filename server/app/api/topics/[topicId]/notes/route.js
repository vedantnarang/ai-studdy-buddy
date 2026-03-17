import { connectDB } from "@/lib/db";
import Topic from "@/models/Topic";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { notesSchema } from "@/schemas/topic.schema";
import { validateBody } from "@/lib/validate";

export async function PUT(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await request.json();
    const data = validateBody(notesSchema, body);

    await connectDB();
    const topicId = params.topicId;

    const updatedTopic = await Topic.findOneAndUpdate(
      { _id: topicId, userId: userPayload.userId },
      { 
        notes: data.notes,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!updatedTopic) {
      return errorResponse("Topic not found or unauthorized to update notes", "NOT_FOUND", 404);
    }

    return successResponse(updatedTopic, 200);

  } catch (error) {
    console.error("PUT notes error:", error);
    if (error.name === "ValidationError") {
      return errorResponse(error.message, "VALIDATION_ERROR", 400);
    }
    return errorResponse(error.message || "Internal server error.", "SERVER_ERROR", 500);
  }
}
