import { connectDB } from "@/lib/db";
import Session from "@/models/Session";
import Topic from "@/models/Topic";
import Subject from "@/models/Subject";
import { getAuthUser } from "@/lib/authHelper";
import { successResponse, errorResponse } from "@/lib/apiResponse";

export async function GET(request) {
  try {
    const userPayload = await getAuthUser(request);
    if (!userPayload) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    await connectDB();
    const userId = userPayload.userId;

    // 1. Fetch all data needed
    const [sessions, topics, subjects] = await Promise.all([
      Session.find({ userId }).populate('topicId', 'title subjectId').lean(),
      Topic.find({ userId }).lean(),
      Subject.find({ userId }).lean()
    ]);

    // Create a Set of valid subject IDs for high-performance lookups
    const validSubjectIds = new Set(subjects.map(s => s._id.toString()));
    const validTopicIds = new Set(topics.filter(t => validSubjectIds.has(t.subjectId?.toString())).map(t => t._id.toString()));

    // Filter topics and sessions to only include those belonging to ACTIVE subjects
    const activeTopics = topics.filter(t => validSubjectIds.has(t.subjectId?.toString()));
    const activeSessions = sessions.filter(s => {
      const tId = s.topicId?._id?.toString() || s.topicId?.toString();
      return tId && validTopicIds.has(tId);
    });

    // --- Metric 1: Retention Alert (Forgotten Topics) ---
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    const lastSessionPerTopic = {};
    activeSessions.forEach(s => {
      const tId = s.topicId?._id?.toString() || s.topicId?.toString();
      if (!lastSessionPerTopic[tId] || new Date(s.createdAt) > new Date(lastSessionPerTopic[tId])) {
        lastSessionPerTopic[tId] = s.createdAt;
      }
    });

    const forgottenTopics = activeTopics
      .filter(t => {
        const lastSession = lastSessionPerTopic[t._id.toString()];
        return lastSession && new Date(lastSession) < fourDaysAgo;
      })
      .map(t => ({
        id: t._id,
        title: t.title,
        lastReviewed: lastSessionPerTopic[t._id.toString()]
      }))
      .sort((a, b) => new Date(a.lastReviewed) - new Date(b.lastReviewed));

    // --- Metric 3: Material Readiness Gaps ---
    const materialGaps = activeTopics
      .filter(t => {
        const hasNotes = t.notes && t.notes.trim().length > 0;
        const missingMaterials = !t.generationStatus?.hasFlashcards || !t.generationStatus?.hasQuiz;
        return hasNotes && missingMaterials;
      })
      .map(t => ({
        id: t._id,
        title: t.title,
        missing: {
          flashcards: !t.generationStatus?.hasFlashcards,
          quiz: !t.generationStatus?.hasQuiz
        }
      }));

    // --- Metric 5: Subject Readiness Score ---
    // Rule: Average Quiz Score per Subject
    const subjectStats = {};
    subjects.forEach(sub => {
      subjectStats[sub._id.toString()] = { title: sub.title, totalScore: 0, count: 0, color: sub.color };
    });

    activeSessions.forEach(s => {
      const subId = s.topicId?.subjectId?.toString();
      if (subId && subjectStats[subId]) {
        const scorePct = (s.score / s.totalQuestions) * 100;
        subjectStats[subId].totalScore += scorePct;
        subjectStats[subId].count++;
      }
    });

    const subjectReadiness = Object.values(subjectStats)
      .map(s => ({
        title: s.title,
        readiness: s.count > 0 ? Math.round(s.totalScore / s.count) : 0,
        color: s.color,
        sessionCount: s.count
      }))
      .sort((a, b) => b.readiness - a.readiness);

    return successResponse({
      forgottenTopics,
      materialGaps,
      subjectReadiness
    }, 200);

  } catch (error) {
    console.error("Analytics error:", error);
    return errorResponse(error.message || "Internal server error.", "SERVER_ERROR", 500);
  }
}
