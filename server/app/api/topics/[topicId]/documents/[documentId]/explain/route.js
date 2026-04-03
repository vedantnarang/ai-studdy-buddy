import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { checkRateLimit } from "@/lib/aiRateLimiter";
import Topic from "@/models/Topic";
import { generateDiagramExplanation } from "@/services/ai.service";

/**
 * Builds a single string of all topic context: typed notes + document texts + image texts.
 */
function buildCombinedContext(topic) {
  return [
    topic.notes,
    ...(topic.sourceDocuments || []).map((d) => d.extractedText),
    ...(topic.sourceImages || []).map((img) => img.extractedText),
  ]
    .filter((t) => t && t.trim().length > 0)
    .join('\n\n');
}

export async function POST(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { limited, retryAfter } = checkRateLimit(userPayload.userId);
    if (limited) {
      return errorResponse(
        "You are generating too fast. Please wait a moment before trying again.",
        "AI_RATE_LIMIT",
        429,
        { retryAfter }
      );
    }

    await connectDB();
    const { topicId, documentId } = await params;

    // Validate IDs
    if (!/^[0-9a-fA-F]{24}$/.test(topicId) || !/^[0-9a-fA-F]{24}$/.test(documentId)) {
      return errorResponse("Invalid topic or document ID", "VALIDATION_ERROR", 400);
    }

    const topic = await Topic.findOne({ _id: topicId, userId: userPayload.userId });
    if (!topic) return errorResponse("Topic not found", "NOT_FOUND", 404);

    // Find the image document inside sourceImages
    const imageDoc = topic.sourceImages.id(documentId);
    if (!imageDoc) {
      return errorResponse("Image not found in this topic", "NOT_FOUND", 404);
    }

    if (!imageDoc.url) {
      return errorResponse("Image has no URL to analyze", "VALIDATION_ERROR", 400);
    }

    // Parse optional customPrompt from request body
    let customPrompt = '';
    try {
      const body = await request.json();
      if (typeof body.customPrompt === 'string') {
        customPrompt = body.customPrompt.trim();
      }
    } catch {
      // No body or invalid JSON — proceed with empty prompt
    }

    // Build context from all topic materials
    const combinedContext = buildCombinedContext(topic);

    // Call the AI service
    const explanation = await generateDiagramExplanation(
      imageDoc.url,
      combinedContext,
      customPrompt
    );

    // Persist to database
    imageDoc.diagramExplanation = explanation;
    await topic.save();

    return successResponse({ explanation }, 200);

  } catch (error) {
    console.error("Explain diagram error:", error);
    const status = error.statusCode || error.status;
    if (status === 429 || error.message?.includes('rate-limit')) {
      return errorResponse(
        "AI provider is temporarily rate-limited. Please wait a moment and try again.",
        "AI_RATE_LIMIT",
        429
      );
    }
    return errorResponse(
      error.message || "Failed to explain diagram",
      "EXPLANATION_FAILED",
      500
    );
  }
}
