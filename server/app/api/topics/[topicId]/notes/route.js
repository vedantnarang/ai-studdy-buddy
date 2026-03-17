import { connectDB } from "@/lib/db";
import Topic from "@/models/Topic";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { notesSchema } from "@/schemas/topic.schema";
<<<<<<< HEAD
import { validateBody } from "@/lib/validate";
=======
>>>>>>> cfdc343bd601c110de428d11da53e7728a0703bb

export async function PUT(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await request.json();
<<<<<<< HEAD
    const data = validateBody(notesSchema, body);
=======
    const validation = notesSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || "Validation failed";
      return errorResponse(errorMessage, "VALIDATION_ERROR", 400);
    }
>>>>>>> cfdc343bd601c110de428d11da53e7728a0703bb

    await connectDB();
    const topicId = params.topicId;

    const updatedTopic = await Topic.findOneAndUpdate(
      { _id: topicId, userId: userPayload.userId },
      { 
<<<<<<< HEAD
        notes: data.notes,
=======
        notes: validation.data.notes,
>>>>>>> cfdc343bd601c110de428d11da53e7728a0703bb
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
<<<<<<< HEAD
    if (error.name === "ValidationError") {
      return errorResponse(error.message, "VALIDATION_ERROR", 400);
    }
=======
>>>>>>> cfdc343bd601c110de428d11da53e7728a0703bb
    return errorResponse(error.message || "Internal server error.", "SERVER_ERROR", 500);
  }
}
