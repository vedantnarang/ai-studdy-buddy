import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import Topic from "@/models/Topic";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export async function DELETE(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { topicId, imageId } = await params;

    await connectDB();

    // Find the topic to get the publicId for Cloudinary deletion
    const topic = await Topic.findOne({ _id: topicId, userId: userPayload.userId });
    if (!topic) {
      return errorResponse("Topic not found", "NOT_FOUND", 404);
    }

    const imageObj = topic.sourceImages.id(imageId);
    if (!imageObj) {
      return errorResponse("Image not found in this topic", "NOT_FOUND", 404);
    }

    // Try deleting from Cloudinary first
    try {
      await deleteFromCloudinary(imageObj.publicId);
    } catch (cloudinaryError) {
      console.warn(`Failed to delete image ${imageObj.publicId} from Cloudinary:`, cloudinaryError.message);
      // We log but continue, so the DB record doesn't get orphaned if Cloudinary acts up
    }

    // Pull the image from DB
    topic.sourceImages.pull(imageId);
    await topic.save();

    return successResponse(topic, 200);

  } catch (error) {
    console.error("DELETE image error:", error);
    return errorResponse(error.message || "Internal server error.", "SERVER_ERROR", 500);
  }
}
