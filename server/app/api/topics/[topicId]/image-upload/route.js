import {NextResponse} from "next/server";
import {connectDB} from "@/lib/db";
import Topic from "@/models/Topic";
import {getAuthUser} from "@/lib/authHelper";
import {successResponse, errorResponse} from "@/lib/apiResponse";
import {uploadImage} from "@/services/cloudinary.service";

export async function POST(request, {params}) {
    try {
        const userPayload = await getAuthUser(request);
        if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

        const body = await request.formData();
        const file = body.get("file");

        if (!file) return errorResponse("File is required", "BAD_REQUEST", 400);
        await connectDB();

        const {topicId} = await params;

        // 1. Convert Web File to Node Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 2. Upload to Cloudinary to get the 'uploadResult'
        const uploadResult = await uploadImage(buffer);

        // 3. Now 'uploadResult' exists, so we can save it to the database
        const updatedTopic = await Topic.findOneAndUpdate(
            { _id: topicId, userId: userPayload.userId },
            {
                $push: { 
                    sourceImages: {
                        url: uploadResult.url,           
                        publicId: uploadResult.publicId  
                    }
                }
            },
            { returnDocument: 'after' }
        );

        if (!updatedTopic) {
            return errorResponse("Topic not found or unauthorized to update notes", "NOT_FOUND", 404);
        }

        return successResponse(updatedTopic, 200);

    } catch (error) {
        console.error("POST image-upload error:", error);
        return errorResponse(error.message || "Internal server error.", "SERVER_ERROR", 500);
    }
}