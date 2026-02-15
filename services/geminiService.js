const axios = require('axios');

const analyzeEarningsCall = async (transcript, apiKey = process.env.GEMINI_API_KEY) => {
    if (!apiKey) {
        throw new Error('Gemini API key missing. Get one free at aistudio.google.com');
    }

    if (!transcript || transcript.trim().length === 0) {
        throw new Error('Transcript is empty or missing.');
    }

    const prompt = `You are a senior financial analyst. Analyze this earnings call transcript.

**CRITICAL RULES:**
1. ONLY extract information EXPLICITLY stated. Use null if not mentioned. NEVER guess.
2. Include direct quotes for sentiment support.
3. Return ONLY valid JSON – no markdown, no extra text.

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
${transcript}`;

    try {
        // Gemini API endpoint for generating content
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const requestBody = {
            contents: [
                {
                    parts: [
                        { text: prompt }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.1,      // ultra low → deterministic
                maxOutputTokens: 2048,
                topP: 0.8,
                topK: 40
            }
        };

        const response = await axios.post(url, requestBody, {
            headers: { 'Content-Type': 'application/json' }
        });

        // Extract the text from Gemini's response structure
        const candidates = response.data.candidates;
        if (!candidates || candidates.length === 0) {
            throw new Error('No candidates returned from Gemini');
        }

        const text = candidates[0].content.parts[0].text;

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Gemini response did not contain valid JSON');
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Gemini API Error:', error.response?.data || error.message);
        throw new Error(`AI analysis failed: ${error.message}`);
    }
};

module.exports = { analyzeEarningsCall };