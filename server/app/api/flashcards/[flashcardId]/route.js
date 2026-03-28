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
