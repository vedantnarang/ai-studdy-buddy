import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { checkRateLimit } from "@/lib/aiRateLimiter";
import Topic from "@/models/Topic";
import Flashcard from "@/models/Flashcard";
import { generateFlashcards } from "@/services/ai.service";

export async function POST(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { limited, retryAfter } = checkRateLimit(userPayload.userId);
    if (limited) {
      return errorResponse(
        "You are generating too fast. Please wait a moment before trying again.",
        "AI_RATE_LIMIT",
        429
      );
    }

    await connectDB();
    const { topicId } = await params;

    const topic = await Topic.findOne({ _id: topicId, userId: userPayload.userId });
    if (!topic) return errorResponse("Topic not found", "NOT_FOUND", 404);


    let forceRegenerate = false;
    try {
      const body = await request.json();
      forceRegenerate = body.forceRegenerate === true;
    } catch {

    }

    if (topic.generationStatus.hasFlashcards && !forceRegenerate) {
      const existingCards = await Flashcard.find({ topicId, userId: userPayload.userId });
      return successResponse({ flashcards: existingCards, cached: true });
    }

    if (!topic.notes || topic.notes.trim().length === 0) {
      return errorResponse("Topic has no notes to generate from", "NO_CONTENT", 400);
    }

    const flashcards = await generateFlashcards(topic.notes);

    if (forceRegenerate) {
      await Flashcard.deleteMany({ topicId, userId: userPayload.userId });
    }

    const savedCards = await Flashcard.insertMany(
      flashcards.map((card, index) => ({
        topicId: topic._id,
        userId: userPayload.userId,
        question: card.question,
        answer: card.answer,
        order: index,
      }))
    );

    topic.generationStatus.hasFlashcards = true;
    await topic.save();

    return successResponse({ flashcards: savedCards, cached: false }, 201);

  } catch (error) {
    console.error("Generate flashcards error:", error);
    const status = error.statusCode || error.status;
    if (status === 429 || error.message?.includes('rate-limit')) {
      return errorResponse("AI provider is temporarily rate-limited. Please wait a moment and try again.", "AI_RATE_LIMIT", 429);
    }
    return errorResponse(error.message || "Failed to generate flashcards", "GENERATION_FAILED", 500);
  }
}
