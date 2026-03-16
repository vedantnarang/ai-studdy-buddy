import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { successResponse, errorResponse } from "@/lib/apiResponse";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse("Please provide email and password.", "VALIDATION_ERROR", 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return errorResponse("Invalid credentials.", "UNAUTHORIZED", 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return errorResponse("Invalid credentials.", "UNAUTHORIZED", 401);
    }


    const secret = process.env.JWT_SECRET_KEY;
    if (!secret) {
      throw new Error("JWT_SECRET_KEY is missing from environment variables.");
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      secret,
      { expiresIn: "7d" } 
    );


    return successResponse({ 
      message: "Login successful!", 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    }, 200);

  } catch (error) {
    console.error("Login error:", error);
    return errorResponse(error.message, 'SERVER_ERROR', 500);
  }
}
