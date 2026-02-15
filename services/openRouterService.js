const axios = require('axios')

const analyzeEarningsCall = async (transcript, apiKey = process.env.OPENROUTER_API_KEY) => {
    if (!apiKey) {
        throw new Error('OpenRouter API key missing. Get one free at openrouter.ai');
    }

    if (!transcript || transcript.trim().length === 0) {
        throw new Error('Transcript is empty or missing.');
    }

    // Truncate if needed (most free models support 8K-32K tokens)
    const MAX_LENGTH = 100000;
    const truncated = transcript.length > MAX_LENGTH
        ? transcript.substring(0, MAX_LENGTH) + '\n[Transcript truncated]'
        : transcript;

    const prompt = `You are a senior financial analyst. Analyze this earnings call transcript.

**CRITICAL RULES:**
1. ONLY extract information EXPLICITLY stated. Use null if not mentioned. NEVER guess.
2. Include direct quotes for sentiment support.
3. Return ONLY valid JSON no markdown, no extra text.

Use this exact JSON structure:
{
  "management_tone": {
    "sentiment": "optimistic" | "cautious" | "neutral" | "pessimistic",
    "confidence": "high" | "medium" | "low",
    "supporting_quotes": ["quote1", "quote2"]
  },
  "key_positives": [
    { "topic": "...", "description": "...", "mentioned_by": "CEO" | "CFO" | "Other" | null }
  ],
  "key_concerns": [
    { "topic": "...", "description": "...", "severity": "high" | "medium" | "low" }
  ],
  "forward_guidance": {
    "revenue_outlook": "string or null",
    "margin_outlook": "string or null",
    "capex_outlook": "string or null",
    "confidence": "high" | "medium" | "low"
  },
  "capacity_utilization": "string or null",
  "growth_initiatives": [
    { "initiative": "...", "description": "...", "timeframe": "near-term" | "long-term" | "ongoing" }
  ],
  "summary": "2-3 sentence summary"
}

Transcript:
${truncated}`;

    try {
        console.log('📡 Sending request to OpenRouter (free model)...');
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                // Used completely free model
                model: 'meta-llama/llama-3.3-70b-instruct:free',
                messages: [
                    { role: 'system', content: 'You extract only explicit facts, never hallucinate.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
                max_tokens: 2048
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    // Optional but helps OpenRouter identify our app
                    'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
                    'X-Title': 'Research Portal'
                }
            }
        );

        const content = response.data.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('OpenRouter response did not contain valid JSON');
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('openRouter API Error:', error.response?.data || error.message);
        throw new Error(`Analysis failed: ${error.message}`);
    }
};


// const analyzeEarningsCall = async (transcript, apiKey = process.env.OPENROUTER_API_KEY) => {
//     if (!apiKey) {
//         throw new Error('OpenRouter API key missing. Get one free at openrouter.ai');
//     }

//     if (!transcript || transcript.trim().length === 0) {
//         throw new Error('Transcript is empty or missing.');
//     }

//     // Truncate if needed
//     const MAX_LENGTH = 100000;
//     const truncated = transcript.length > MAX_LENGTH
//         ? transcript.substring(0, MAX_LENGTH) + '\n[Transcript truncated]'
//         : transcript;

//     const prompt = `...`; // Your existing prompt stays the same

//     // List of models to try in order (will fall back if one fails)
//     const modelsToTry = [
//         'meta-llama/llama-3.3-70b-instruct:free',
//         'google/gemini-2.0-flash-exp:free',
//         'deepseek/deepseek-r1-0528:free',
//     ];

//     let lastError = null;

//     for (const model of modelsToTry) {
//         try {
//             console.log(`📡 Trying model: ${model}...`);
//             const response = await axios.post(
//                 'https://openrouter.ai/api/v1/chat/completions',
//                 {
//                     model: model,
//                     messages: [
//                         { role: 'system', content: 'You extract only explicit facts, never hallucinate.' },
//                         { role: 'user', content: prompt }
//                     ],
//                     temperature: 0.1,
//                     max_tokens: 2048
//                 },
//                 {
//                     headers: {
//                         'Authorization': `Bearer ${apiKey}`,
//                         'Content-Type': 'application/json',
//                         'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
//                         'X-Title': 'Research Portal'
//                     }
//                 }
//             );

//             const content = response.data.choices[0].message.content;
//             console.log('📝 Raw AI response:', content);  // <-- ADD THIS
//             const jsonMatch = content.match(/\{[\s\S]*\}/);
//             if (!jsonMatch) {
//                 throw new Error('Response did not contain valid JSON');
//             }

//             console.log(`✅ Success with model: ${model}`);
//             return JSON.parse(jsonMatch[0]);
//         } catch (error) {
//             console.warn(`⚠️ Model ${model} failed:`, error.response?.data?.error?.message || error.message);
//             lastError = error;
//             // Continue to next model
//         }
//     }

//     // If all models fail
//     console.error('❌ All models failed');
//     throw new Error(`Analysis failed: ${lastError?.message || 'No working models'}`);
// };


module.exports = { analyzeEarningsCall }