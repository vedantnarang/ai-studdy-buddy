import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import Topic from "@/models/Topic";
import { PDFParse } from "pdf-parse"; 
import { extractTextFromScannedPDF } from "@/services/ocr.service";

// Check if pdf-parse output is meaningful text or just page markers / garbage
function isTextMeaningful(text) {
  if (!text) return false;
  // Strip out common pdf-parse page markers like "-- 1 of 2 --"
  const cleaned = text
    .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length >= 50;
}

export async function POST(request, { params }) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const { topicId } = await params;

    await connectDB();

    const topic = await Topic.findOne({ _id: topicId, userId: userPayload.userId });
    if (!topic) {
      return errorResponse("Topic not found or unauthorized", "NOT_FOUND", 404);
    }

    const formData = await request.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return errorResponse("No files uploaded", "BAD_REQUEST", 400);
    }

    const allowedTypes = ['application/pdf', 'text/plain'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    const results = [];
    const newDocuments = [];

    for (const file of files) {
      // Validate type
      if (!allowedTypes.includes(file.type)) {
        results.push({ fileName: file.name, success: false, error: "Invalid file type. Only PDF and TXT files are allowed." });
        continue;
      }

      // Validate size
      if (file.size > maxSize) {
        results.push({ fileName: file.name, success: false, error: "File too large. Max size is 5MB." });
        continue;
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      let extractedText = "";
      let extractionMethod = "text-parse";
      const fileType = file.type === 'application/pdf' ? 'pdf' : 'txt';

      if (file.type === 'application/pdf') {
        // Step 1: Try pdf-parse (fast, local, free)
        try {
          const parser = new PDFParse({ data: buffer });
          const data = await parser.getText(); 
          extractedText = data.text;
          await parser.destroy(); 
        } catch (pdfError) {
          console.log(`pdf-parse failed for ${file.name}, will try OCR:`, pdfError.message);
          extractedText = "";
        }

        // Step 2: If pdf-parse returned garbage/empty, fall back to OCR
        if (!isTextMeaningful(extractedText)) {
          console.log(`Text from pdf-parse not meaningful for "${file.name}", falling back to OCR...`);
          try {
            extractedText = await extractTextFromScannedPDF(buffer, file.name);
            extractionMethod = "ocr";
            console.log(`OCR succeeded for "${file.name}" — extracted ${extractedText.length} chars`);
          } catch (ocrError) {
            console.error(`OCR also failed for ${file.name}:`, ocrError.message);
            results.push({ 
              fileName: file.name, 
              success: false, 
              error: `Could not extract text. pdf-parse found no text, and OCR failed: ${ocrError.message}` 
            });
            continue;
          }
        }
      } else {
        // Plain text file
        extractedText = buffer.toString('utf-8');
      }

      newDocuments.push({
        fileName: file.name,
        fileType,
        extractedText,
        extractionMethod,
      });

      results.push({ 
        fileName: file.name, 
        success: true, 
        extractionMethod,
        extractedPreview: extractedText.substring(0, 100) + (extractedText.length > 100 ? "..." : "")
      });
    }

    // Push all successfully parsed documents into sourceDocuments
    if (newDocuments.length > 0) {
      await Topic.findOneAndUpdate(
        { _id: topicId, userId: userPayload.userId },
        { $push: { sourceDocuments: { $each: newDocuments } } }
      );
    }

    // Re-fetch the updated topic to return it
    const updatedTopic = await Topic.findById(topicId);

    return successResponse({
      message: `${newDocuments.length} of ${files.length} file(s) processed successfully`,
      results,
      topic: updatedTopic,
    }, 201);

  } catch (error) {
    console.error("Upload error:", error);
    return errorResponse(error.message || "Upload failed", "UPLOAD_FAILED", 500);
  }
}