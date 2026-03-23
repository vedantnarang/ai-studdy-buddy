require('dotenv').config({ path: './.env' });
async function run() {
  const { extractTextFromImageUrl } = await import('./services/ai.service.js');
  try {
    console.log('Testing Cloudinary URL...');
    const text = await extractTextFromImageUrl('https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg');
    console.log('SUCCESS:', text.substring(0, 100));
  } catch(e) {
    console.error('ERROR:', e.stack);
  }
}
run();
