import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { successResponse, errorResponse } from "@/lib/apiResponse";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return errorResponse("Please provide name, email, and password.", "VALIDATION_ERROR", 400);
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse("A user with this email already exists.", "CONFLICT", 409);
    }


    const newUser = await User.create({
      name,
      email,
      password,
    });
    return successResponse({ 
      message: "User registered successfully!", 
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    }, 201);

  } catch (error) {
    console.error("Registration error:", error);
    
    if (error.name === "ValidationError") {
      return errorResponse(error.message, "VALIDATION_ERROR", 400);
    }

    return errorResponse(error.message, 'SERVER_ERROR', 500);
  }
}
