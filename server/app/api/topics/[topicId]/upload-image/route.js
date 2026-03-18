import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import Topic from "@/models/Topic";
import { uploadImage } from "@/services/cloudinary.service";

export async function POST(request, { params }) {
  try {
    const { topicId } = await params;
    const user = await getAuthUser(request);

    if (!user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    await connectDB();

    // Verify topic exists and belongs to the user
    const topic = await Topic.findOne({ _id: topicId, userId: user.id });
    if (!topic) {
      return errorResponse("Topic not found or unauthorized", "NOT_FOUND", 404);
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return errorResponse("No file uploaded", "BAD_REQUEST", 400);
    }

    // Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return errorResponse("Invalid file type. Only JPEG, PNG, and WebP images are allowed.", "INVALID_TYPE", 400);
    }

    if (file.size > 5 * 1024 * 1024) {
      return errorResponse("File too large. Max size is 5MB.", "FILE_TOO_LARGE", 400);
    }


    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let uploadResult;
    try {
      uploadResult = await uploadImage(buffer);
    } catch (uploadError) {
      console.error("Cloudinary upload failed:", uploadError);
      return errorResponse(uploadError.message || "Image upload failed", "UPLOAD_FAILED", 500);
    }

    // Update Topic with the new image
    const updatedTopic = await Topic.findOneAndUpdate(
      { _id: topicId, userId: user.id },
      {
        $push: {
          sourceImages: {
            url: uploadResult.url,
            publicId: uploadResult.publicId,
          }
        }
      },
      { new: true }
    );

    return successResponse({
      message: "Image uploaded and topic updated successfully",
      imageUrl: uploadResult.url,
      publicId: uploadResult.publicId,
      topic: updatedTopic
    });

  } catch (error) {
    console.error("Upload error:", error);
    return errorResponse(error.message || "Upload failed", "UPLOAD_FAILED", 500);
  }
}
