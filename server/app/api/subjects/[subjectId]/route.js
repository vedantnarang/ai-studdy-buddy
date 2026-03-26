import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import Flashcard from "@/models/Flashcard";
import Quiz from "@/models/Quiz";
import QuizAttempt from "@/models/QuizAttempt";
import Session from "@/models/Session";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { subjectSchema } from "@/schemas/subject.schema";
import { validateBody } from "@/lib/validate";

export async function GET(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    await connectDB();
    const { subjectId } = await params;

    const subject = await Subject.findOne({ _id: subjectId, userId: userPayload.userId });

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
    const { subjectId } = await params;

    const normalizedTitle = data.title.trim().replace(/\s+/g, ' ').toLowerCase();

    const duplicateSubject = await Subject.findOne({
      userId: userPayload.userId,
      normalizedTitle,
      _id: { $ne: subjectId } 
    });

    if (duplicateSubject) {
      return errorResponse("Another subject with this title already exists.", "CONFLICT", 409);
    }

    const updatedSubject = await Subject.findOneAndUpdate(
      { _id: subjectId, userId: userPayload.userId },
      { 
        title: data.title, 
        normalizedTitle,
        description: data.description,
        color: data.color,
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
    const { subjectId } = await params;
    
    // Explicitly cast to ObjectId for robustness in queries
    const sId = new mongoose.Types.ObjectId(subjectId);

    // 1. Verify the subject exists and belongs to the user
    const subject = await Subject.findOne({ 
      _id: sId, 
      userId: userPayload.userId 
    });

    if (!subject) {
      return errorResponse("Subject not found or unauthorized to delete.", "NOT_FOUND", 404);
    }

    // 2. Find all topics associated with this subject
    const topics = await Topic.find({ subjectId: sId, userId: userPayload.userId });
    const topicIds = topics.map(t => t._id);

    console.log(`Cascading delete for subject ${subjectId}: found ${topics.length} topics`);

    // 3. Delete all metadata associated with these topics
    if (topicIds.length > 0) {
      const results = await Promise.all([
        Flashcard.deleteMany({ topicId: { $in: topicIds }, userId: userPayload.userId }),
        Quiz.deleteMany({ topicId: { $in: topicIds }, userId: userPayload.userId }),
        QuizAttempt.deleteMany({ topicId: { $in: topicIds }, userId: userPayload.userId }),
        Session.deleteMany({ topicId: { $in: topicIds }, userId: userPayload.userId }),
        Topic.deleteMany({ _id: { $in: topicIds }, userId: userPayload.userId })
      ]);

      console.log(`Deleted metadata for ${topicIds.length} topics:`, {
        flashcards: results[0].deletedCount,
        quizzes: results[1].deletedCount,
        attempts: results[2].deletedCount,
        sessions: results[3].deletedCount,
        topics: results[4].deletedCount
      });
    }

    // 5. Finally delete the subject
    await Subject.findByIdAndDelete(sId);
    console.log(`Successfully deleted subject ${subjectId}`);

    return successResponse({ 
      message: "Subject and all associated data deleted successfully", 
      subjectId 
    }, 200);

  } catch (error) {
    console.error("DELETE subject error:", error);
    return errorResponse(error.message || "Internal server error.", "SERVER_ERROR", 500);
  }
}
