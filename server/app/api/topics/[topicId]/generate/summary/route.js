import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { checkRateLimit } from "@/lib/aiRateLimiter";
import Topic from "@/models/Topic";
import { generateSummary } from "@/services/ai.service";

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

    let forceRegenerate = false;
    try {
      const body = await request.json();
      forceRegenerate = body.forceRegenerate === true;
    } catch {
      // No body or invalid JSON — that's fine, default to false
    }

    // DB cache: return existing summary unless forcing regeneration
    if (topic.generationStatus.hasSummary && !forceRegenerate) {
      return successResponse({ summary: topic.summary, cached: true });
    }

    // Combine typed notes + all source document texts + all image texts
    const allNotes = [
      topic.notes,
      ...(topic.sourceDocuments || []).map(d => d.extractedText),
      ...(topic.sourceImages || []).map(img => img.extractedText)
    ].filter(text => text && text.trim().length > 0).join('\n\n');

    const imageUrls = [];

    if (!allNotes) {
      return errorResponse("Topic has no notes, documents, or image text to generate from", "NO_CONTENT", 400);
    }

    const summary = await generateSummary(allNotes, imageUrls);

    topic.summary = summary;
    topic.generationStatus.hasSummary = true;
    await topic.save();

    return successResponse({ summary, cached: false }, 201);

  } catch (error) {
    console.error("Generate summary error:", error);
    const status = error.statusCode || error.status;
    if (status === 429 || error.message?.includes('rate-limit')) {
      return errorResponse("AI provider is temporarily rate-limited. Please wait a moment and try again.", "AI_RATE_LIMIT", 429);
    }
    return errorResponse(error.message || "Failed to generate summary", "GENERATION_FAILED", 500);
  }
}
