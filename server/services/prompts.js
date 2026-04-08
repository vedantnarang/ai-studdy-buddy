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

Make the wrong options plausible but clearly incorrect to someone who studied the material.

CRITICAL INSTRUCTIONS FOR VALID JSON OUTPUT:
1. You MUST provide exactly 4 options in your 'options' array.
2. The 'correctIndex' MUST be a single integer between 0 and 3. Do not use string numbers (e.g. use 2, not "2").
3. Ensure the JSON is structurally valid and complete before stopping.`;
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

  return `You are an expert tutor. Create a highly engaging, visual, and deeply structured study summary from ${sources.join(" and ")}.

STRUCTURE YOUR RESPONSE EXACTLY AS FOLLOWS:

1.  **🚀 Quick Overview**: A high-level, 2-3 sentence summary of the entire topic.
2.  **📌 Key Concepts**: Use a combination of bullet points and **Markdown Tables** to explain the main components. If comparing two things, ALWAYS use a table.
3.  **🧠 Deep Dive**: Detailed explanation including examples. 
4.  **📊 Process Flow**: If there is any sequential process, hierarchy, or relationship, you MUST generate a Mermaid.js flowchart inside a \`\`\`mermaid code block. Be precise with the syntax.
5.  **⚠️ Watch Outs**: Common mistakes students make or tricky nuances regarding this topic.
6.  **📖 Definitions**: A glossary of important terms in **bold**.
7.  **💡 Did You Know?**: Interesting facts or real-world applications related to the topic.

CRITICAL GUIDELINES:
- Use relevant **emojis** for each heading and section.
- Use **LaTeX** ($...$ or $$...$$) for any mathematical formulas or scientific notations.
- Ensure the tone is encouraging and professional.
- Use bolding and italics to make the text scannable.

STUDY MATERIAL:
${notes?.trim() ? `Text notes:\n${notes}` : "No text notes provided."}
${imageCount > 0 ? `\nReference the visual concepts from the ${imageCount} attached image(s).` : ""}
`;
}
