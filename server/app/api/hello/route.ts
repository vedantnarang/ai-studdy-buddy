import { successResponse, errorResponse } from "@/lib/apiResponse";
import { connectDB } from "@/lib/db";

export async function GET() {
  try {
    await connectDB();
    return successResponse({ message: "Database connection successful!" });
  } catch (error: any) {
    return errorResponse(error.message, 'SERVER_ERROR', 500);
  }
}
