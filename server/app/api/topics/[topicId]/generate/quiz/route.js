import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { checkRateLimit } from "@/lib/aiRateLimiter";
import Topic from "@/models/Topic";
import Quiz from "@/models/Quiz";
import { generateQuiz } from "@/services/ai.service";

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

    if (!/^[0-9a-fA-F]{24}$/.test(topicId)) {
      return errorResponse("Invalid topic ID", "VALIDATION_ERROR", 400);
    }

    const topic = await Topic.findOne({ _id: topicId, userId: userPayload.userId });
    if (!topic) return errorResponse("Topic not found", "NOT_FOUND", 404);

    // Check for forceRegenerate
    let forceRegenerate = false;
    try {
      const body = await request.json();
      forceRegenerate = body.forceRegenerate === true;
    } catch {
      // No body or invalid JSON — default to false
    }

    // DB cache: return existing quiz unless forcing regeneration
    if (topic.generationStatus.hasQuiz && !forceRegenerate) {
      const existingQuiz = await Quiz.findOne({ topicId, userId: userPayload.userId }).sort({ createdAt: -1 });
      return successResponse({ quiz: existingQuiz, cached: true });
    }

    // Combine typed notes + all source document texts + all image texts
    const allNotes = [
      topic.notes,
      ...(topic.sourceDocuments || []).map(d => d.extractedText),
      ...(topic.sourceImages || []).map(img => img.extractedText)
    ].filter(text => text && text.trim().length > 0).join('\n\n');

    // We no longer send image URLs directly to the generative AI. 
    // Vision extraction is handled at upload or via manual entry.
    const imageUrls = [];

    if (!allNotes) {
      return errorResponse("Topic has no notes, documents, or image text to generate from", "NO_CONTENT", 400);
    }

    const questions = await generateQuiz(allNotes, imageUrls);

    // Stop deleting old quizzes to keep history
    // if (forceRegenerate) {
    //   await Quiz.deleteMany({ topicId, userId: userPayload.userId });
    // }

    const savedQuiz = await Quiz.create({
      topicId: topic._id,
      userId: userPayload.userId,
      questions,
    });

    topic.generationStatus.hasQuiz = true;
    await topic.save();

    return successResponse({ quiz: savedQuiz, cached: false }, 201);

  } catch (error) {
    console.error("Generate quiz error:", error);
    const status = error.statusCode || error.status;
    if (status === 429 || error.message?.includes('rate-limit')) {
      return errorResponse("AI provider is temporarily rate-limited. Please wait a moment and try again.", "AI_RATE_LIMIT", 429);
    }
    return errorResponse(error.message || "Failed to generate quiz", "GENERATION_FAILED", 500);
  }
}
