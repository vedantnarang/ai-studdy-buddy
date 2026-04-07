import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import Topic from "@/models/Topic";
import { uploadImage } from "@/services/cloudinary.service";

export async function POST(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { topicId } = await params;

    await connectDB();

    // Verify topic exists and belongs to the user
    const topic = await Topic.findOne({ _id: topicId, userId: userPayload.userId });
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

    // Deduplication check: if identical file already exists, return it directly
    const existingImage = topic.sourceImages.find(
      img => img.fileName === file.name && img.fileSize === file.size
    );

    if (existingImage) {
      return successResponse({
        message: "Image already exists, using existing version",
        imageUrl: existingImage.url,
        publicId: existingImage.publicId,
        topic
      });
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

    // Overwrite Logic: Remove existing images that share the incoming file's name
    topic.sourceImages = topic.sourceImages.filter(img => img.fileName !== file.name);

    // Update Topic with the new image
    topic.sourceImages.push({
      fileName: file.name,
      fileSize: file.size,
      url: uploadResult.url,
      publicId: uploadResult.publicId,
    });
    
    await topic.save();

    return successResponse({
      message: "Image uploaded and topic updated successfully",
      imageUrl: uploadResult.url,
      publicId: uploadResult.publicId,
      topic
    });

  } catch (error) {
    console.error("Upload error:", error);
    return errorResponse(error.message || "Upload failed", "UPLOAD_FAILED", 500);
  }
}
