import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET(request) {
  try {
    await connectDB();
    //will be protected using route handlers later on 
    return NextResponse.json({ 
        message: "This route will be protected later to return user profile data.",
      },
      { status: 200 } 
    );

  } catch (error) {
    console.error("Fetch profile error:", error);
    
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
