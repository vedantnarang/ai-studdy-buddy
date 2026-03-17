import { connectDB } from "@/lib/db";
import Subject from "@/models/Subjects";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { subjectSchema } from "@/schemas/subject.schema";

export async function GET(request) {
  try {
    const userPayload = await getAuthUser(request);
    console.log(userPayload)
    
    if (!userPayload) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    await connectDB();

    const subjects = await Subject.find({ userId: userPayload.userId });

    return successResponse(subjects, 200);

  } catch (error) {
    console.error("Fetch subjects error:", error);
    return errorResponse(error.message || "Internal server error.", "SERVER_ERROR", 500);
  }
}

export async function POST(request) {
  try {
    const userPayload = await getAuthUser(request);
    
    if (!userPayload) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const body = await request.json();

    const validation = subjectSchema.safeParse(body);
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || "Validation failed";
      return errorResponse(errorMessage, "VALIDATION_ERROR", 400);
    }

    await connectDB();

    const newSubject = await Subject.create({
      userId: userPayload.userId,
      title: validation.data.title,
      description: validation.data.description,
    });

    return successResponse(newSubject, 201);

  } catch (error) {
    console.error("Create subject error:", error);
    return errorResponse(error.message || "Internal server error.", "SERVER_ERROR", 500);
  }
}
