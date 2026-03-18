import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { checkRateLimit } from "@/lib/aiRateLimiter";
import { generateFlashcardsFromImage, generateQuizFromImage } from "@/services/ai.service";

export async function POST(request) {
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

    const formData = await request.formData();
    const file = formData.get('file');
    const type = formData.get('type');

    if (!file) return errorResponse("No file uploaded", "BAD_REQUEST", 400);
    if (!type || !['flashcards', 'quiz'].includes(type)) {
      return errorResponse("Type must be 'flashcards' or 'quiz'", "BAD_REQUEST", 400);
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return errorResponse("Invalid file type. Only JPEG, PNG, and WebP images are allowed.", "INVALID_TYPE", 400);
    }

    if (file.size > 5 * 1024 * 1024) {
      return errorResponse("File too large. Max size is 5MB.", "FILE_TOO_LARGE", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let result;
    if (type === 'flashcards') {
      result = await generateFlashcardsFromImage(buffer, file.type);
    } else {
      result = await generateQuizFromImage(buffer, file.type);
    }

    return successResponse({ type, data: result }, 201);

  } catch (error) {
    console.error("Generate from image error:", error);
    const status = error.statusCode || error.status;
    if (status === 429 || error.message?.includes('rate-limit')) {
      return errorResponse("AI provider is temporarily rate-limited. Please wait a moment and try again.", "AI_RATE_LIMIT", 429);
    }
    return errorResponse(error.message || "Failed to generate from image", "GENERATION_FAILED", 500);
  }
}
