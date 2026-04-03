import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import Topic from "@/models/Topic";
import { PDFParse } from "pdf-parse";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { extractTextFromImageUrl } from "@/services/ai.service";


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

    const allowedTypes = ['application/pdf', 'text/plain', 'image/webp', 'image/png', 'image/jpeg'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    const results = [];
    const newDocuments = [];
    const newImages = [];

    for (const file of files) {
      // Validate type
      if (!allowedTypes.includes(file.type)) {
        results.push({ fileName: file.name, success: false, error: "Invalid file type. Only PDF, TXT, JPG, PNG, and WEBP files are allowed." });
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
      let fileType;

      if (file.type === 'application/pdf') {
        fileType = 'pdf';
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


      } else if (file.type === 'text/plain') {
        fileType = 'txt';
        extractedText = buffer.toString('utf-8');
      } else if (file.type.startsWith('image/')) {
        // Image: upload to Cloudinary and extract text via Vision AI
        try {
          console.log(`Uploading image "${file.name}" to Cloudinary...`);
          const cloudinaryResult = await uploadToCloudinary(buffer, file.name);
          console.log(`Cloudinary upload succeeded: ${cloudinaryResult.url}`);

          console.log(`Sending image to Vision AI to extract text...`);
          let extractedText = '';
          try {
             extractedText = await extractTextFromImageUrl(cloudinaryResult.url);
             console.log(`Vision AI extraction succeeded! Length: ${extractedText?.length}`);
          } catch (visionError) {
             console.warn(`Vision AI failed for ${file.name}:`, visionError.message);
          }

          newImages.push({
            fileName: file.name,
            url: cloudinaryResult.url,
            publicId: cloudinaryResult.publicId,
            extractedText: extractedText || '',
            fileSize: file.size,
          });

          results.push({
            fileName: file.name,
            success: true,
            extractionMethod: extractedText ? 'vision-ai' : 'none',
            imageUrl: cloudinaryResult.url,
            extractedPreview: extractedText ? 
              (extractedText.substring(0, 100) + (extractedText.length > 100 ? "..." : "")) : 
              'Image uploaded. Text extraction pending or failed.',
            extractedText: extractedText || ''
          });
        } catch (uploadError) {
          console.error(`Image upload failed for ${file.name}:`, uploadError.message);
          results.push({ 
            fileName: file.name, 
            success: false, 
            error: `Failed to upload image: ${uploadError.message}` 
          });
        }
        continue; // Images go to sourceImages, not sourceDocuments
      }

      newDocuments.push({
        fileName: file.name,
        fileType,
        extractedText,
        extractionMethod,
        fileSize: file.size,
      });

      results.push({ 
        fileName: file.name, 
        success: true, 
        extractionMethod,
        extractedPreview: extractedText.substring(0, 100) + (extractedText.length > 100 ? "..." : "")
      });
    }

    // Overwrite Logic: Remove existing files that share a typical filename with incoming ones
    const incomingNames = files.map(f => f.name);
    
    // Removing existing documents if their filename matches an incoming file
    if (newDocuments.length > 0) {
      topic.sourceDocuments = topic.sourceDocuments.filter(doc => !incomingNames.includes(doc.fileName));
    }
    // Removing existing images if their filename matches an incoming file
    // Note: older images might not have fileName saved, so we fall back gracefully.
    if (newImages.length > 0) {
      topic.sourceImages = topic.sourceImages.filter(img => !incomingNames.includes(img.fileName));
    }

    // Save changes to database
    topic.sourceDocuments.push(...newDocuments);
    topic.sourceImages.push(...newImages);
    
    if (newDocuments.length > 0 || newImages.length > 0) {
      topic.materialsUpdatedAt = new Date();
    }
    
    await topic.save();

    // Re-fetch the updated topic to return it
    const updatedTopic = await Topic.findById(topicId);

    const totalProcessed = newDocuments.length + newImages.length;
    return successResponse({
      message: `${totalProcessed} of ${files.length} file(s) processed successfully`,
      results,
      topic: updatedTopic,
    }, 201);

  } catch (error) {
    console.error("Upload error:", error);
    return errorResponse(error.message || "Upload failed", "UPLOAD_FAILED", 500);
  }
}