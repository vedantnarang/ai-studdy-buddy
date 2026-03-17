import { connectDB } from "@/lib/db";
import Topic from "@/models/Topic";
import Subject from "@/models/Subject";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { topicSchema } from "@/schemas/topic.schema";
<<<<<<< HEAD
import { validateBody } from "@/lib/validate";
=======
>>>>>>> cfdc343bd601c110de428d11da53e7728a0703bb

export async function GET(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    await connectDB();
<<<<<<< HEAD
    const {subjectId} = await params;
=======
    const subjectId = params.subjectId;
>>>>>>> cfdc343bd601c110de428d11da53e7728a0703bb

    const subject = await Subject.findOne({ _id: subjectId, userId: userPayload.userId });
    if (!subject) {
      return errorResponse("Subject not found!", "NOT_FOUND", 404);
    }

    const topics = await Topic.find({ subjectId, userId: userPayload.userId });
    
    return successResponse(topics, 200);

  } catch (error) {
    console.error("GET topics error:", error);
    return errorResponse(error.message || "Internal server error.", "SERVER_ERROR", 500);
  }
}

export async function POST(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const body = await request.json();
<<<<<<< HEAD
    const data = validateBody(topicSchema, body);
    
    await connectDB();
    const { subjectId } = await params;
=======
    const validation = topicSchema.safeParse(body);
    
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || "Validation failed";
      return errorResponse(errorMessage, "VALIDATION_ERROR", 400);
    }

    await connectDB();
    const subjectId = params.subjectId;
>>>>>>> cfdc343bd601c110de428d11da53e7728a0703bb

    const subject = await Subject.findOne({ _id: subjectId, userId: userPayload.userId });
    if (!subject) {
      return errorResponse("Subject not found!", "NOT_FOUND", 404);
    }

<<<<<<< HEAD
    const normalizedTitle = data.title.trim().replace(/\s+/g, ' ').toLowerCase();

    //duplicate check
=======
    const normalizedTitle = validation.data.title.trim().replace(/\s+/g, ' ').toLowerCase();

    // Check if duplicate topic exists inside the same subject
>>>>>>> cfdc343bd601c110de428d11da53e7728a0703bb
    const existingTopic = await Topic.findOne({
      subjectId,
      normalizedTitle
    });

    if (existingTopic) {
      return errorResponse("A topic with this title already exists in this subject.", "CONFLICT", 409);
    }

    const newTopic = await Topic.create({
      subjectId,
      userId: userPayload.userId,
<<<<<<< HEAD
      title: data.title,
=======
      title: validation.data.title,
>>>>>>> cfdc343bd601c110de428d11da53e7728a0703bb
      normalizedTitle,
    });

    return successResponse(newTopic, 201);

  } catch (error) {
    console.error("POST topic error:", error);
<<<<<<< HEAD
    if (error.name === "ValidationError") {
      return errorResponse(error.message, "VALIDATION_ERROR", 400);
    }
=======
>>>>>>> cfdc343bd601c110de428d11da53e7728a0703bb
    return errorResponse(error.message || "Internal server error.", "SERVER_ERROR", 500);
  }
}
