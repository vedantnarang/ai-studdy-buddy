import { NextResponse } from "next/server";

/**
 * Helper to standardise successful API responses
 * @param {any} data - The payload or message to send back
 * @param {number} status - The HTTP status code (Default 200)
 * @returns {NextResponse}
 */
export function successResponse(data, status = 200) {
  return NextResponse.json({
    success: true,
    data
  }, { status });
}

/**
 * Helper to standardise error API responses
 * @param {string} message - A description of the error
 * @param {string|number} code - A custom error code (or HTTP status code)
 * @param {number} status - The HTTP status code (Default 500)
 * @returns {NextResponse}
 */
export function errorResponse(message, code = 'ERROR', status = 500) {
  return NextResponse.json({
    success: false,
    error: {
      message,
      code
    }
  }, { status });
}
