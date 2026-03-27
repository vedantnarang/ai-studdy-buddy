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

export async function PUT(request) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { name, email } = await request.json();

    // Basic validation
    if (!name || !email) {
      return errorResponse("Name and email are required", "BAD_REQUEST", 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse("Invalid email format", "BAD_REQUEST", 400);
    }

    await connectDB();

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ email, _id: { $ne: userPayload.userId } });
    if (existingUser) {
      return errorResponse("Email is already in use by another account", "CONFLICT", 409);
    }

    const user = await User.findByIdAndUpdate(
      userPayload.userId,
      { name, email },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return errorResponse("User not found", "NOT_FOUND", 404);
    }

    return successResponse({
      message: "Profile updated successfully.",
      user
    }, 200);

  } catch (error) {
    console.error("Update profile error:", error);
    return errorResponse(error.message, 'SERVER_ERROR', 500);
  }
}
