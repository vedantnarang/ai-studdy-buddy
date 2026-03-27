import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import QuizAttempt from "@/models/QuizAttempt";
import Topic from "@/models/Topic";
import Subject from "@/models/Subject";

export async function GET(request) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    await connectDB();

    // 10 days ago at midnight
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 9);
    tenDaysAgo.setHours(0, 0, 0, 0);

    // Query completed quiz attempts in the last 10 days
    const attempts = await QuizAttempt.find({
      userId: userPayload.userId,
      status: 'completed',
      createdAt: { $gte: tenDaysAgo },
    })
      .select('topicId subjectId subjectTitle subjectColor createdAt')
      .lean();

    // For attempts missing denormalized subject data, resolve from Topic → Subject
    const topicIdsToResolve = new Set();
    attempts.forEach(a => {
      if (!a.subjectTitle || !a.subjectColor) {
        if (a.topicId) topicIdsToResolve.add(a.topicId.toString());
      }
    });

    // Build a topicId → { subjectId, subjectTitle, subjectColor } lookup
    const topicSubjectMap = {};
    if (topicIdsToResolve.size > 0) {
      const topics = await Topic.find({ _id: { $in: Array.from(topicIdsToResolve) } })
        .select('subjectId')
        .lean();

      const subjectIds = [...new Set(topics.map(t => t.subjectId?.toString()).filter(Boolean))];
      const subjects = await Subject.find({ _id: { $in: subjectIds } })
        .select('title color')
        .lean();

      const subjectMap = {};
      subjects.forEach(s => {
        subjectMap[s._id.toString()] = { title: s.title, color: s.color };
      });

      topics.forEach(t => {
        const sub = subjectMap[t.subjectId?.toString()];
        if (sub) {
          topicSubjectMap[t._id.toString()] = {
            subjectId: t.subjectId.toString(),
            subjectTitle: sub.title,
            subjectColor: sub.color,
          };
        }
      });
    }

    // Build a map of date -> subject aggregation
    const dayMap = {};

    // Pre-fill all 10 days
    for (let i = 0; i < 10; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (9 - i));
      const key = d.toISOString().slice(0, 10);
      dayMap[key] = { date: key, total: 0, subjects: {} };
    }

    // Aggregate attempts
    attempts.forEach((a) => {
      const key = new Date(a.createdAt).toISOString().slice(0, 10);
      if (!dayMap[key]) return;

      dayMap[key].total++;

      // Use denormalized data if available, otherwise use the fallback lookup
      let sid = a.subjectId?.toString();
      let title = a.subjectTitle;
      let color = a.subjectColor;

      if (!title || !color) {
        const fallback = topicSubjectMap[a.topicId?.toString()];
        if (fallback) {
          sid = fallback.subjectId;
          title = fallback.subjectTitle;
          color = fallback.subjectColor;
        }
      }

      sid = sid;
      title = title;
      color = color;

      if (!dayMap[key].subjects[sid]) {
        dayMap[key].subjects[sid] = {
          subjectId: sid,
          title,
          color,
          count: 0,
        };
      }
      dayMap[key].subjects[sid].count++;
    });

    // Convert subjects map to sorted array for each day
    const result = Object.values(dayMap).map((day) => ({
      date: day.date,
      total: day.total,
      subjects: Object.values(day.subjects).sort((a, b) => b.count - a.count),
    }));

    return successResponse(result, 200);
  } catch (error) {
    console.error("Contribution graph error:", error);
    return errorResponse(
      error.message || "Internal server error.",
      "SERVER_ERROR",
      500
    );
  }
}
