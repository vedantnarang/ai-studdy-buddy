// services/ocr.service.js

const OCR_MAX_FILE_SIZE = 1024 * 1024; // 1MB — OCR.space free tier limit

async function extractTextFromScannedPDF(buffer, filename) {
  // OCR.space free tier rejects files > 1MB with an HTML error page
  if (buffer.length > OCR_MAX_FILE_SIZE) {
    throw new Error(
      `File is ${(buffer.length / 1024 / 1024).toFixed(1)}MB — OCR.space free tier only accepts files up to 1MB. ` +
      `Try uploading a smaller PDF or splitting it into individual pages.`
    );
  }

  const formData = new FormData()
  
  // Convert buffer to Blob for FormData
  const blob = new Blob([buffer], { type: 'application/pdf' })
  formData.append('file', blob, filename || 'upload.pdf')
  formData.append('apikey', process.env.OCR_SPACE_API_KEY)
  formData.append('language', 'eng')
  formData.append('isTable', 'true')        
  formData.append('detectOrientation', 'true')
  formData.append('scale', 'true')          
  formData.append('OCREngine', '2')         

  const response = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    body: formData,
  })


  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const htmlBody = await response.text();
    console.error('OCR.space returned non-JSON response:', htmlBody.substring(0, 200));
    throw new Error(
      `OCR.space returned an error (HTTP ${response.status}). ` +
      `This usually means the file is too large or the API key is invalid.`
    );
  }

  const result = await response.json()

  // Handle API-level errors
  if (result.IsErroredOnProcessing) {
    throw new Error(result.ErrorMessage?.[0] || 'OCR processing failed')
  }

  // Concatenate text from all parsed pages
  const text = result.ParsedResults
    ?.map(page => page.ParsedText)
    .join('\n\n--- Page Break ---\n\n')
    .trim()

  if (!text || text.length === 0) {
    throw new Error('No text could be extracted from this PDF')
  }

  return text
}

export { extractTextFromScannedPDF }