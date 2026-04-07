import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { checkRateLimit } from "@/lib/aiRateLimiter";
import Topic from "@/models/Topic";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { generateDiagramExplanation } from "@/services/ai.service";

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function buildCombinedContext(topic) {
  return [
    topic.notes,
    ...(topic.sourceDocuments || []).map((d) => d.extractedText),
    ...(topic.sourceImages || []).map((img) => img.extractedText),
  ]
    .filter((t) => t && t.trim().length > 0)
    .join('\n\n');
}

/**
 * Classifies an AI error so the client can show the right UX.
 * Returns "MODELS_BUSY" when all vision models are unavailable,
 * "AI_RATE_LIMIT" for per-user rate limits, or null otherwise.
 */
function classifyAiError(error) {
  const msg = error.message || '';
  const status = error.statusCode || error.status;

  if (
    status === 429 ||
    msg.includes('rate-limit') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests')
  ) return 'AI_RATE_LIMIT';

  if (
    msg.toLowerCase().includes('vision models are currently unavailable') ||
    msg.toLowerCase().includes('all vision models') ||
    msg.toLowerCase().includes('unavailable')
  ) return 'MODELS_BUSY';

  return null;
}

/**
 * POST /api/topics/[topicId]/explain-diagram
 *
 * Accepts multipart form-data:
 *   - image  : File   (required — JPG / PNG / WEBP, ≤ 5 MB)
 *   - prompt : string (optional student question)
 *
 * Flow:
 *  1. Upload image to Cloudinary (permanent).
 *  2. Save image to topic.sourceImages immediately (even if AI later fails).
 *  3. Attempt AI explanation.
 *  4a. Success → update the saved doc with explanation, return { explanation, savedImage }.
 *  4b. AI busy  → return { aiError: { code, message }, savedImage } so the client
 *      still knows the image was persisted and can show a retry modal.
 *  4c. Generic AI failure → same as 4b.
 */
export async function POST(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { limited } = checkRateLimit(userPayload.userId);
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

    // ── Parse multipart ───────────────────────────────────────────────────────
    const formData = await request.formData();
    const imageFile = formData.get('image');
    const customPrompt = (formData.get('prompt') || '').trim();

    if (!imageFile || typeof imageFile === 'string') {
      return errorResponse("No image file provided", "BAD_REQUEST", 400);
    }
    if (!ALLOWED_TYPES.includes(imageFile.type)) {
      return errorResponse(
        "Invalid file type. Only JPG, PNG, and WEBP are allowed.",
        "BAD_REQUEST", 400
      );
    }
    if (imageFile.size > MAX_SIZE) {
      return errorResponse("Image too large. Max size is 5 MB.", "BAD_REQUEST", 400);
    }

    // ── 2. Deduplication check ────────────────────────────────────────────────
    let finalFileName = imageFile.name;
    const existingImages = topic.sourceImages || [];

    const exactMatch = existingImages.find(
      (img) => img.fileName === imageFile.name && img.fileSize === imageFile.size
    );

    if (exactMatch) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FILE_ALREADY_EXISTS',
          message: 'The same file already exists in the uploads section.',
          existingImage: exactMatch
        }
      }, { status: 409 });
    }

    // If filename matches but size differs, auto-rename
    let counter = 1;
    const dotIndex = finalFileName.lastIndexOf('.');
    const baseName = dotIndex !== -1 ? finalFileName.substring(0, dotIndex) : finalFileName;
    const extension = dotIndex !== -1 ? finalFileName.substring(dotIndex) : '';

    while (existingImages.some(img => img.fileName === finalFileName)) {
      finalFileName = `${baseName}(${counter})${extension}`;
      counter++;
    }

    // ── 3. Upload to Cloudinary ───────────────────────────────────────────────
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { url, publicId } = await uploadToCloudinary(buffer, finalFileName);

    // ── 4. Save image to DB immediately (no explanation yet) ─────────────────
    topic.sourceImages.push({
      fileName: finalFileName,
      url,
      publicId,
      extractedText: '',
      diagramExplanation: '',
      fileSize: imageFile.size,
    });
    topic.materialsUpdatedAt = new Date();
    await topic.save();

    // Grab the newly inserted subdocument
    const savedImage = topic.sourceImages[topic.sourceImages.length - 1];

    // ── 3. Attempt AI explanation ─────────────────────────────────────────────
    let explanation = '';
    let aiError = null;

    try {
      const combinedContext = buildCombinedContext(topic);
      explanation = await generateDiagramExplanation(url, combinedContext, customPrompt);
    } catch (err) {
      const code = classifyAiError(err) || 'EXPLANATION_FAILED';
      const friendlyMsg =
        code === 'MODELS_BUSY'
          ? "All AI vision models are currently busy. Please retry in a few minutes."
          : code === 'AI_RATE_LIMIT'
          ? "You are generating too fast. Please wait a moment before trying again."
          : err.message || "Failed to generate explanation.";

      aiError = { code, message: friendlyMsg };
      console.error(`Explain diagram AI error [${code}]:`, err.message);
    }

    // ── 5. If explanation succeeded, persist it (Atomic update to avoid VersionError) ──
    if (explanation) {
      await Topic.updateOne(
        { _id: topicId, "sourceImages._id": savedImage._id },
        { $set: { "sourceImages.$.diagramExplanation": explanation } }
      );
      // Update local object purely for the response
      savedImage.diagramExplanation = explanation;
    }

    // Always return the saved image so the client can append it to the uploads list.
    // If AI failed, also include aiError so the client can show the retry modal.
    return successResponse(
      {
        explanation: explanation || null,
        savedImage,
        ...(aiError ? { aiError } : {}),
      },
      200
    );

  } catch (error) {
    console.error("Explain diagram (drop) error:", error);
    return errorResponse(
      error.message || "Failed to process diagram",
      "UPLOAD_FAILED",
      500
    );
  }
}
