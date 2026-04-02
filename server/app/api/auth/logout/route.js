import { cookies } from "next/headers";
import { successResponse } from "@/lib/apiResponse";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("token");

  return successResponse({ message: "Logged out successfully." }, 200);
}
