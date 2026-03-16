import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Please provide name, email, and password." },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { message: "A user with this email already exists." },
        { status: 409 } 
      );
    }


    const newUser = await User.create({
      name,
      email,
      password,
    });
    return NextResponse.json({ 
        message: "User registered successfully!", 
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email
        }
      },
      { status: 201 } 
    );

  } catch (error) {
    console.error("Registration error:", error);
    
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Internal server error during registration." },
      { status: 500 }
    );
  }
}
