import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { subjectSchema } from "@/schemas/subject.schema";
import { validateBody } from "@/lib/validate";

export async function GET(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    await connectDB();

    // In Next.js App Router, ensure params is awaited if Next.js > 14, but we'll use it directly based on standard
    const id = params.subjectId;

    // Must filter by BOTH the subject id and the logged-in user id
    const subject = await Subject.findOne({ _id: id, userId: userPayload.userId });

    if (!subject) {
      return errorResponse("Subject not found or unauthorized", "NOT_FOUND", 404);
    }

    return successResponse(subject, 200);

  } catch (error) {
    console.error("GET subject error:", error);
    return errorResponse(error.message || "Internal server error.", "SERVER_ERROR", 500);
  }
}

export async function PUT(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await request.json();
    const data = validateBody(subjectSchema, body);

    await connectDB();
    const id = params.subjectId;

    const normalizedTitle = data.title.trim().replace(/\s+/g, ' ').toLowerCase();

    // Check if another subject by this exact user shares the same normalized title before updating
    const duplicateSubject = await Subject.findOne({
      userId: userPayload.userId,
      normalizedTitle,
      _id: { $ne: id } 
    });

    if (duplicateSubject) {
      return errorResponse("Another subject with this title already exists.", "CONFLICT", 409);
    }

    const updatedSubject = await Subject.findOneAndUpdate(
      { _id: id, userId: userPayload.userId },
      { 
        title: data.title, 
        normalizedTitle,
        description: data.description 
      },
      { new: true, runValidators: true } 
    );

    if (!updatedSubject) {
      return errorResponse("Subject not found or unauthorized to update.", "NOT_FOUND", 404);
    }

    return successResponse(updatedSubject, 200);

  } catch (error) {
    console.error("PUT subject error:", error);
    if (error.name === "ValidationError") {
      return errorResponse(error.message, "VALIDATION_ERROR", 400);
    }
    return errorResponse(error.message || "Internal server error.", "SERVER_ERROR", 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    await connectDB();
    const id = params.subjectId;

    // Only delete if Both ID and User ID match
    const deletedSubject = await Subject.findOneAndDelete({ 
      _id: id, 
      userId: userPayload.userId 
    });

    if (!deletedSubject) {
      return errorResponse("Subject not found or unauthorized to delete.", "NOT_FOUND", 404);
    }

    return successResponse({ message: "Subject deleted successfully", id }, 200);

  } catch (error) {
    console.error("DELETE subject error:", error);
    return errorResponse(error.message || "Internal server error.", "SERVER_ERROR", 500);
  }
}
