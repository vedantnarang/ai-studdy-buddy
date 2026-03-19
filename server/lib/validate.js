/**
 * Validates a request body against a Zod schema.
 * Throws a formatted error if validation fails, which can be caught 
 * by the route handler's try/catch block.
 * 
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @param {any} body - The request body to parse
 * @returns {any} - The parsed and validated data
 */
export function validateBody(schema, body) {
  const validation = schema.safeParse(body);
  
  if (!validation.success) {
    const errorMessage = validation.error?.errors?.[0]?.message || "Validation failed";
    const error = new Error(errorMessage);
    error.name = "ValidationError";
    error.status = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }
  
  return validation.data;
}
