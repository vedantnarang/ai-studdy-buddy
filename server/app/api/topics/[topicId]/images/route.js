import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import Topic from "@/models/Topic";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { extractTextFromImageUrl } from "@/services/ai.service";

export async function POST(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { topicId } = await params;
    const { imageId } = await request.json();

    if (!imageId) {
      return errorResponse("imageId is required in request body", "BAD_REQUEST", 400);
    }

    await connectDB();

    const topic = await Topic.findOne({ _id: topicId, userId: userPayload.userId });
    if (!topic) {
      return errorResponse("Topic not found", "NOT_FOUND", 404);
    }

    const imageObj = topic.sourceImages.find(
      img => img._id?.toString() === imageId || img.publicId === imageId
    );
    
    if (!imageObj) {
      return errorResponse("Image not found in this topic", "NOT_FOUND", 404);
    }

    console.log(`[RETRY EXTRACTION] Retrying for image: ${imageObj.url}`);
    
    let extractedText = "";
    try {
      extractedText = await extractTextFromImageUrl(imageObj.url);
      console.log(`[RETRY EXTRACTION] Success! Length: ${extractedText?.length}`);
    } catch (visionError) {
      console.error(`[RETRY EXTRACTION] Vision AI failed:`, visionError.message);
      return errorResponse(`Extraction failed: ${visionError.message}`, "EXTRACTION_FAILED", 500);
    }

    if (!extractedText) {
      return errorResponse("Vision AI returned no text. The model might still be busy.", "EXTRACTION_EMPTY", 500);
    }

    // Update the image object in the array
    imageObj.extractedText = extractedText;
    topic.materialsUpdatedAt = new Date();
    await topic.save();

    return successResponse({
      message: "Text extracted successfully!",
      extractedText,
      topic
    }, 200);

  } catch (error) {
    console.error("POST retry extraction error:", error);
    return errorResponse(error.message || "Internal server error.", "SERVER_ERROR", 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { topicId } = await params;
    const url = new URL(request.url);
    const imageId = url.searchParams.get("imageId");

    if (!imageId) {
      return errorResponse("imageId query parameter is required", "BAD_REQUEST", 400);
    }

    await connectDB();

    const topic = await Topic.findOne({ _id: topicId, userId: userPayload.userId });
    if (!topic) {
      return errorResponse("Topic not found", "NOT_FOUND", 404);
    }

    // Find the image object. Support matching by either _id or publicId
    console.log(`[DELETE IMAGE] Looking for imageId: ${imageId}`);
    console.log(`[DELETE IMAGE] Available images:`, topic.sourceImages.map(img => ({ _id: img._id?.toString(), publicId: img.publicId })));

    const imageObj = topic.sourceImages.find(
      img => img._id?.toString() === imageId || img.publicId === imageId
    );
    
    if (!imageObj) {
      return errorResponse("Image not found in this topic", "NOT_FOUND", 404);
    }

    // Try deleting from Cloudinary first
    try {
      if (imageObj.publicId) {
        await deleteFromCloudinary(imageObj.publicId);
      }
    } catch (cloudinaryError) {
      console.warn(`Failed to delete image ${imageObj.publicId} from Cloudinary:`, cloudinaryError.message);
    }

    // Pull the image from DB (filtering out the matched one)
    topic.sourceImages = topic.sourceImages.filter(
      img => img._id?.toString() !== imageId && img.publicId !== imageId
    );
    topic.materialsUpdatedAt = new Date();
    await topic.save();

    return successResponse(topic, 200);

  } catch (error) {
    console.error("DELETE image error:", error);
    return errorResponse(error.message || "Internal server error.", "SERVER_ERROR", 500);
  }
}
