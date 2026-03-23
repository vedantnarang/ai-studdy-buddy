import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import Topic from "@/models/Topic";


export async function PUT(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { topicId, documentId } = await params;
    const body = await request.json();

    if (typeof body.extractedText !== 'string') {
      return errorResponse("extractedText is required", "VALIDATION_ERROR", 400);
    }

    await connectDB();

    const updatedTopic = await Topic.findOneAndUpdate(
      { 
        _id: topicId, 
        userId: userPayload.userId,
        "sourceDocuments._id": documentId 
      },
      { 
        $set: { "sourceDocuments.$.extractedText": body.extractedText }
      },
      { new: true }
    );

    if (!updatedTopic) {
      return errorResponse("Topic or document not found", "NOT_FOUND", 404);
    }

    return successResponse(updatedTopic, 200);

  } catch (error) {
    console.error("PUT document error:", error);
    return errorResponse(error.message || "Internal server error.", "SERVER_ERROR", 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { topicId, documentId } = await params;

    await connectDB();

    const updatedTopic = await Topic.findOneAndUpdate(
      { _id: topicId, userId: userPayload.userId },
      { 
        $pull: { sourceDocuments: { _id: documentId } },
        $set: { materialsUpdatedAt: new Date() }
      },
      { new: true }
    );

    if (!updatedTopic) {
      return errorResponse("Topic not found", "NOT_FOUND", 404);
    }

    return successResponse(updatedTopic, 200);

  } catch (error) {
    console.error("DELETE document error:", error);
    return errorResponse(error.message || "Internal server error.", "SERVER_ERROR", 500);
  }
}
