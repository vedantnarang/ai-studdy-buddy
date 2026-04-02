import { connectDB } from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { z } from "zod";
import { validateBody } from "@/lib/validate";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1)
}).strict();

export async function POST(request) {
  try {
    await connectDB();

    const { name, email, password } = validateBody(registerSchema, await request.json());

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse("A user with this email already exists.", "CONFLICT", 409);
    }

    const newUser = await User.create({
      name,
      email,
      password,
    });

    const secret = process.env.JWT_SECRET_KEY;
    if (!secret) {
      throw new Error("JWT_SECRET_KEY is missing from environment variables.");
    }

    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      secret,
      { expiresIn: "7d" }
    );

    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      path: "/",
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
