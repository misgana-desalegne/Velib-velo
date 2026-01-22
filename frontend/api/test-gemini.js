#!/usr/bin/env node

/**
 * Diagnostic script to test Gemini API connectivity
 * Run: node frontend/api/test-gemini.js
 */

const GEMINI_API_KEY = 'AIzaSyBPHQfLhtsiyVPf47ram1ldVmVSIN1nXY4';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

async function testGeminiAPI() {
  console.log('🔍 Gemini API Diagnostic Test');
  console.log('================================\n');

  // Check API key
  console.log('1️⃣  Checking API Key...');
  if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 10) {
    console.error('❌ Invalid or missing API key');
    process.exit(1);
  }
  console.log('✅ API key present (length: ' + GEMINI_API_KEY.length + ')\n');

  // Check endpoint
  console.log('2️⃣  Checking API Endpoint...');
  console.log('Endpoint: ' + GEMINI_API_URL + '\n');

  // Test API call
  console.log('3️⃣  Testing API Call...');
  try {
    const request = {
      contents: [
        {
          parts: [
            {
              text: 'Reply with exactly: "API is working"',
            },
          ],
        },
      ],
    };

    const fullUrl = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;
    console.log('📤 Sending test request to:', GEMINI_API_URL + '?key=[REDACTED]');

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    console.log('📊 Response Status:', response.status, response.statusText);
    console.log('📊 Content-Type:', response.headers.get('content-type'));

    const responseText = await response.text();

    if (!response.ok) {
      console.error('❌ API returned error');
      console.error('Response:', responseText.substring(0, 500));
      
      try {
        const errorData = JSON.parse(responseText);
        console.error('\n📋 Error Details:');
        console.error(JSON.stringify(errorData, null, 2));
      } catch {
        console.error('\n📋 Raw Response:', responseText);
      }
      process.exit(1);
    }

    const data = JSON.parse(responseText);
    
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = data.candidates[0].content.parts[0].text;
      console.log('✅ API Response received');
      console.log('📝 Response:', text.substring(0, 100));
      console.log('\n✅ All tests passed! Gemini API is working correctly.\n');
      process.exit(0);
    } else {
      console.error('❌ Unexpected response structure');
      console.error('Response:', JSON.stringify(data, null, 2));
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.error('\n💡 Possible solutions:');
    console.error('1. Check internet connection');
    console.error('2. Verify API key is valid');
    console.error('3. Check if API is enabled in Google Cloud Console');
    console.error('4. Check if rate limits have been exceeded');
    process.exit(1);
  }
}

testGeminiAPI();
