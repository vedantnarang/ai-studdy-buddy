import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { z } from "zod";
import { validateBody } from "@/lib/validate";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
}).strict();

export async function POST(request) {
  try {
    await connectDB();

    const { email, password } = validateBody(loginSchema, await request.json());

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return errorResponse("This email has not been registered.", "USER_NOT_FOUND", 401);
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
