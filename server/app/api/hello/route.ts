import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function GET() {
  // Call it at the top of every Route Handler that needs the database
  await connectDB();

  return NextResponse.json({ message: "Database connection successful!" });
}
