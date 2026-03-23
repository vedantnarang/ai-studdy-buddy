/**
 * Builds the AI prompt for generating flashcards.
 * @param {string} notes - User notes and extracted text
 * @param {number} imageCount - Number of visual attachments
 * @returns {string} The constructed prompt
 */
export function buildFlashcardPrompt(notes, imageCount = 0) {
  const sources = [];
  if (notes?.trim()) sources.push("the provided text notes");
  if (imageCount > 0) sources.push(`${imageCount} uploaded image(s)`);

  return `You are an expert tutor. Generate comprehensive flashcards from ${sources.length > 0 ? sources.join(" and ") : "the provided materials"}.
  
${notes?.trim() ? `Text notes:\n${notes}` : "No text notes provided."}
${imageCount > 0 ? `\nAlso analyze the ${imageCount} attached image(s) for additional content.` : ""}

Create clear question/answer pairs covering all key concepts.`;
}

/**
 * Builds the AI prompt for generating a multiple-choice quiz.
 * @param {string} notes - User notes and extracted text
 * @param {number} imageCount - Number of visual attachments
 * @returns {string} The constructed prompt
 */
export function buildQuizPrompt(notes, imageCount = 0) {
  const sources = [];
  if (notes?.trim()) sources.push("the provided text notes");
  if (imageCount > 0) sources.push(`${imageCount} uploaded image(s)`);

  return `You are an expert tutor. Generate a multiple-choice quiz from ${sources.length > 0 ? sources.join(" and ") : "the provided materials"}.
  
${notes?.trim() ? `Text notes:\n${notes}` : "No text notes provided."}
${imageCount > 0 ? `\nAlso analyze the ${imageCount} attached image(s) for additional content.` : ""}

Make the wrong options plausible but clearly incorrect to someone who studied the material.`;
}

/**
 * Builds the AI prompt for generating a summary.
 * @param {string} notes - User notes and extracted text
 * @param {number} imageCount - Number of visual attachments
 * @returns {string} The constructed prompt
 */
export function buildSummaryPrompt(notes, imageCount = 0) {
  const sources = [];
  if (notes?.trim()) sources.push("the provided text notes");
  if (imageCount > 0) sources.push(`${imageCount} uploaded image(s)`);

  return `You are an expert tutor. Summarize the following study materials in a clear, structured format with key concepts highlighted.
  
${notes?.trim() ? `Text notes:\n${notes}` : "No text notes provided."}
${imageCount > 0 ? `\nAlso analyze the ${imageCount} attached image(s) for additional context and incorporate their key visual concepts.` : ""}

Highlight important terms in bold.`;
}
