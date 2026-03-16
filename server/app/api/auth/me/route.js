import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";

export async function GET(request) {
  try {
    const userPayload = await getAuthUser(request);
    
    if (!userPayload) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    await connectDB();

    // Now retrieve the user from MongoDB using the ID embedded in the JWT payload
    const user = await User.findById(userPayload.userId).select("-password");

    if (!user) {
      return errorResponse("User not found", "NOT_FOUND", 404);
    }

    return successResponse({ 
      message: "Profile fetched successfully.",
      user 
    }, 200);

  } catch (error) {
    console.error("Fetch profile error:", error);
    return errorResponse(error.message, 'SERVER_ERROR', 500);
  }
}
