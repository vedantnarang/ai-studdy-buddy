import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import Flashcard from "@/models/Flashcard";

// PATCH /api/flashcards/:flashcardId — update difficultyBox
export async function PATCH(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    await connectDB();
    const { flashcardId } = await params;

    if (!/^[0-9a-fA-F]{24}$/.test(flashcardId)) {
      return errorResponse("Invalid flashcard ID", "VALIDATION_ERROR", 400);
    }

    const body = await request.json();
    const { isCorrect } = body;

    if (typeof isCorrect !== 'boolean') {
      return errorResponse("isCorrect (boolean) is required", "VALIDATION_ERROR", 400);
    }

    const flashcard = await Flashcard.findOne({ _id: flashcardId, userId: userPayload.userId });
    if (!flashcard) {
      return errorResponse("Flashcard not found", "NOT_FOUND", 404);
    }

    // Update difficultyBox: missed → increase (harder), got it → decrease (easier)
    if (isCorrect) {
      flashcard.difficultyBox = Math.max(1, flashcard.difficultyBox - 1);
    } else {
      flashcard.difficultyBox = Math.min(5, flashcard.difficultyBox + 1);
    }

    await flashcard.save();

    return successResponse({ flashcard }, 200);
  } catch (error) {
    console.error("Update flashcard difficulty error:", error);
    return errorResponse(error.message || "Failed to update flashcard", "SERVER_ERROR", 500);
  }
}

// PUT /api/flashcards/:flashcardId - update question and answer
export async function PUT(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    await connectDB();
    const { flashcardId } = await params;

    if (!/^[0-9a-fA-F]{24}$/.test(flashcardId)) {
      return errorResponse("Invalid flashcard ID", "VALIDATION_ERROR", 400);
    }

    const { question, answer } = await request.json();

    if (!question || !answer) {
      return errorResponse("Question and answer are required", "VALIDATION_ERROR", 400);
    }

    const flashcard = await Flashcard.findOneAndUpdate(
      { _id: flashcardId, userId: userPayload.userId },
      { $set: { question, answer, isEdited: true } },
      { new: true }
    );

    if (!flashcard) {
      return errorResponse("Flashcard not found", "NOT_FOUND", 404);
    }

    return successResponse({ flashcard }, 200);
  } catch (error) {
    console.error("Update flashcard error:", error);
    return errorResponse(error.message || "Failed to update flashcard", "SERVER_ERROR", 500);
  }
}

import Topic from "@/models/Topic";

// DELETE /api/flashcards/:flashcardId - delete flashcard
export async function DELETE(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    await connectDB();
    const { flashcardId } = await params;

    if (!/^[0-9a-fA-F]{24}$/.test(flashcardId)) {
      return errorResponse("Invalid flashcard ID", "VALIDATION_ERROR", 400);
    }

    const flashcard = await Flashcard.findOneAndDelete({ _id: flashcardId, userId: userPayload.userId });
    
    if (!flashcard) {
      return errorResponse("Flashcard not found", "NOT_FOUND", 404);
    }

    // Check if there are any flashcards left for this topic
    const remaining = await Flashcard.countDocuments({ topicId: flashcard.topicId });
    if (remaining === 0) {
      // No flashcards left, reset the generationStatus.hasFlashcards flag
      await Topic.updateOne(
        { _id: flashcard.topicId },
        { $set: { "generationStatus.hasFlashcards": false } }
      );
    }

    return successResponse({ message: "Flashcard deleted successfully" }, 200);
  } catch (error) {
    console.error("Delete flashcard error:", error);
    return errorResponse(error.message || "Failed to delete flashcard", "SERVER_ERROR", 500);
  }
}
