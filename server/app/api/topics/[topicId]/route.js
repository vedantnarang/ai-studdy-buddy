import { connectDB } from "@/lib/db";
import Topic from "@/models/Topic";
import Flashcard from "@/models/Flashcard";
import Quiz from "@/models/Quiz";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { topicSchema } from "@/schemas/topic.schema";
import { validateBody } from "@/lib/validate";

export async function PUT(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await request.json();
    const data = validateBody(topicSchema, body);
    
    await connectDB();
    const topicId = params.topicId;

    const normalizedTitle = data.title.trim().replace(/\s+/g, ' ').toLowerCase();

    // To verify duplication securely on update across subjects, extract current topic's subjectId
    const currentTopic = await Topic.findOne({ _id: topicId, userId: userPayload.userId });
    if (!currentTopic) {
      return errorResponse("Topic not found or unauthorized to update", "NOT_FOUND", 404);
    }

    const duplicateTopic = await Topic.findOne({
      subjectId: currentTopic.subjectId,
      normalizedTitle,
      _id: { $ne: topicId } 
    });

    if (duplicateTopic) {
      return errorResponse("Another topic with this title already exists in this subject.", "CONFLICT", 409);
    }

    const updatedTopic = await Topic.findOneAndUpdate(
      { _id: topicId, userId: userPayload.userId },
      { 
        title: data.title,
        normalizedTitle
      },
      { new: true, runValidators: true }
    );

    if (!updatedTopic) {
      return errorResponse("Topic not found or unauthorized to update", "NOT_FOUND", 404);
    }

    return successResponse(updatedTopic, 200);

  } catch (error) {
    console.error("PUT topic error:", error);
    if (error.name === "ValidationError") {
      return errorResponse(error.message, "VALIDATION_ERROR", 400);
    }
    return errorResponse(error.message || "Internal server error.", "SERVER_ERROR", 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    await connectDB();
    const topicId = params.topicId;

    const deletedTopic = await Topic.findOneAndDelete({ 
      _id: topicId, 
      userId: userPayload.userId 
    });

    if (!deletedTopic) {
      return errorResponse("Topic not found or unauthorized to delete", "NOT_FOUND", 404);
    }

    // Cascade delete associated flashcards and quizzes securely
    await Flashcard.deleteMany({ topicId, userId: userPayload.userId });
    await Quiz.deleteMany({ topicId, userId: userPayload.userId });

    return successResponse({ message: "Topic and associated data securely deleted.", topicId }, 200);

  } catch (error) {
    console.error("DELETE topic error:", error);
    return errorResponse(error.message || "Internal server error.", "SERVER_ERROR", 500);
  }
}
