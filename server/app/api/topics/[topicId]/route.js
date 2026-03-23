import { connectDB } from "@/lib/db";
import Topic from "@/models/Topic";
import Flashcard from "@/models/Flashcard";
import Quiz from "@/models/Quiz";
import Subject from "@/models/Subject";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { topicSchema } from "@/schemas/topic.schema";
import { validateBody } from "@/lib/validate";

export async function GET(request, context) {
  try {
    const { topicId } = await context.params;
    console.log(`[GET] Fetching topic: ${topicId}`);
    
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    await connectDB();

    const topic = await Topic.findOne({ 
      _id: topicId, 
      userId: userPayload.userId 
    });

    if (!topic) {
      return errorResponse("Topic not found", "NOT_FOUND", 404);
    }

    // Attach flashcards from the Flashcard collection so the frontend can access topic.flashcards
    const flashcards = await Flashcard.find({ topicId }).lean();
    const topicObj = topic.toObject();
    topicObj.flashcards = flashcards;

    // Attach count of quizzes generated for this topic
    const quizCount = await Quiz.countDocuments({ topicId, userId: userPayload.userId });
    topicObj.quizCount = quizCount;

    // Attach subject color for theming
    const subject = await Subject.findById(topic.subjectId).select('color').lean();
    if (subject) {
      topicObj.subjectColor = subject.color;
    }

    return successResponse(topicObj, 200);

  } catch (error) {
    console.error("GET topic error:", error);
    return errorResponse(error.message || "Internal server error.", "SERVER_ERROR", 500);
  }
}

export async function PUT(request, context) {
  try {
    const { topicId } = await context.params;
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await request.json();

    if (Object.keys(body).length === 0) {
        return errorResponse("No fields provided to update", "BAD_REQUEST", 400);
    }

    await connectDB();

    const currentTopic = await Topic.findOne({ _id: topicId, userId: userPayload.userId });
    if (!currentTopic) {
      return errorResponse("Topic not found or unauthorized to update", "NOT_FOUND", 404);
    }

    const updateData = {};

    if (body.title !== undefined) {
      if (!body.title.trim()) {
        return errorResponse("Title cannot be empty", "VALIDATION_ERROR", 400);
      }
      const normalizedTitle = body.title.trim().replace(/\s+/g, ' ').toLowerCase();
      const duplicateTopic = await Topic.findOne({
        subjectId: currentTopic.subjectId,
        normalizedTitle,
        _id: { $ne: topicId } 
      });
      if (duplicateTopic) {
        return errorResponse("Another topic with this title already exists in this subject.", "CONFLICT", 409);
      }
      updateData.title = body.title;
      updateData.normalizedTitle = normalizedTitle;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    if (body.summary !== undefined) {
      updateData.summary = body.summary;
    }

    const updatedTopic = await Topic.findOneAndUpdate(
      { _id: topicId, userId: userPayload.userId },
      { $set: updateData },
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

export async function DELETE(request, context) {
  try {
    const { topicId } = await context.params;
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    await connectDB();

    const deletedTopic = await Topic.findOneAndDelete({ 
      _id: topicId, 
      userId: userPayload.userId 
    });

    if (!deletedTopic) {
      return errorResponse("Topic not found or unauthorized to delete", "NOT_FOUND", 404);
    }

    await Flashcard.deleteMany({ topicId, userId: userPayload.userId });
    await Quiz.deleteMany({ topicId, userId: userPayload.userId });

    return successResponse({ message: "Topic and associated data securely deleted.", topicId }, 200);

  } catch (error) {
    console.error("DELETE topic error:", error);
    return errorResponse(error.message || "Internal server error.", "SERVER_ERROR", 500);
  }
}  
