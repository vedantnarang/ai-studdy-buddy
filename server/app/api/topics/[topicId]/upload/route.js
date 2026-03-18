import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import Topic from "@/models/Topic";

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
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      return errorResponse("Invalid file type. Only PDF and Text files are allowed.", "INVALID_TYPE", 400);
    }

    if (file.size > 5 * 1024 * 1024) {
      return errorResponse("File too large. Max size is 5MB.", "FILE_TOO_LARGE", 400);
    }

    // Convert to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // TODO: Implement PDF/Text extraction logic here in the future
    
    return successResponse({
      message: "File uploaded successfully",
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

  } catch (error) {
    console.error("Upload error:", error);
    return errorResponse(error.message || "Upload failed", "UPLOAD_FAILED", 500);
  }
}
