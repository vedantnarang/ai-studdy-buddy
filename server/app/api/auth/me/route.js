import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getAuthUser } from "@/lib/authHelper";

export async function GET(request) {
  try {
    const userPayload = await getAuthUser(request);
    
    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Now retrieve the user from MongoDB using the ID embedded in the JWT payload
    const user = await User.findById(userPayload.userId).select("-password");

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(
      { 
        message: "Profile fetched successfully.",
        user 
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
