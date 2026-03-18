import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import Topic from "@/models/Topic";

// 1. Import the modern class from pdf-parse
import { PDFParse } from "pdf-parse"; 

export async function POST(request, { params }) {
  try {
    const { topicId } = await params;
    const user = await getAuthUser(request);

    if (!user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    await connectDB();

    const topic = await Topic.findOne({ _id: topicId, userId: user.userId });
    
    if (!topic) {
      return errorResponse("Topic not found or unauthorized", "NOT_FOUND", 404);
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return errorResponse("No file uploaded", "BAD_REQUEST", 400);
    }

    const allowedTypes = ['application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      return errorResponse("Invalid file type. Only PDF and Text files are allowed.", "INVALID_TYPE", 400);
    }

    if (file.size > 5 * 1024 * 1024) {
      return errorResponse("File too large. Max size is 5MB.", "FILE_TOO_LARGE", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";
    console.log(file.type)
    if (file.type === 'application/pdf') {
      try {
        const parser = new PDFParse({ data: buffer });
        console.log(parser)
        const data = await parser.getText(); 
        extractedText = data.text;
        
      
        await parser.destroy(); 
      } catch (pdfError) {
        console.error("PDF parsing error:", pdfError);
        return errorResponse("Unable to read PDF text. The file might be corrupted or password-protected.", "PARSE_FAILED", 400);
      }
    } else {
      extractedText = buffer.toString('utf-8');
    }

    const newNotes = topic.notes 
      ? `${topic.notes}\n\n--- Extracted from ${file.name} ---\n\n${extractedText}` 
      : extractedText;

    topic.notes = newNotes;
    await topic.save();
    
    return successResponse({
      message: "File uploaded and notes updated successfully",
      fileName: file.name,
      extractedPreview: extractedText.substring(0, 100) + "..."
    });

  } catch (error) {
    console.error("Upload error:", error);
    return errorResponse(error.message || "Upload failed", "UPLOAD_FAILED", 500);
  }
}