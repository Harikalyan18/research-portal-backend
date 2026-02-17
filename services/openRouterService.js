const axios = require('axios')

const analyzeEarningsCall = async (transcript, apiKey = process.env.OPENROUTER_API_KEY) => {
    if (!apiKey) {
        throw new Error('OpenRouter API key missing. Get one free at openrouter.ai');
    }

    if (!transcript || transcript.trim().length === 0) {
        throw new Error('Transcript is empty or missing.');
    }

    // Truncate if needed
    const MAX_LENGTH = 100000;
    const truncated = transcript.length > MAX_LENGTH
        ? transcript.substring(0, MAX_LENGTH) + '\n[Transcript truncated]'
        : transcript;

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
${truncated}`;

    // Models to try in order (free tier)
    const modelsToTry = [
        'meta-llama/llama-3.3-70b-instruct:free',
        'google/gemini-2.0-flash-exp:free',
        'nvidia/nemotron-3-nano-30b-a3b:free',
        'google/gemma-3-27b-it:free',
        'qwen/qwen3-235b-a22b-thinking:free',
        'stepfun/step-3.5-flash:free',
        'openrouter/pony-alpha:free',
        'z-ai/glm-4.7',
        'xiaomi/xiaomi-mimo-v2-flash:free',
        'deepseek/deepseek-r1-0528:free',
    ];

    let lastError = null;

    for (const model of modelsToTry) {
        try {
            console.log(`📡 Trying model: ${model}...`);
            const response = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    model: model,
                    messages: [
                        { role: 'system', content: 'You extract only explicit facts, never hallucinate.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.1,
                    max_tokens: 8192
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
                        'X-Title': 'Research Portal'
                    }
                }
            );

            const content = response.data.choices[0].message.content;
            console.log('Raw AI response:', content);
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Response did not contain valid JSON');
            }
            const parsed = JSON.parse(jsonMatch[0]);
            console.log(`✅ Success with model: ${model}`);
            return parsed;
        } catch (error) {
            console.warn(`⚠️ Model ${model} failed:`, error.response?.data?.error?.message || error.message);
            lastError = error;
            // Continue to next model
        }
    }

    // If all models fail, return a structured error so the UI can display something helpful

    return {
        management_tone: { sentiment: 'error', confidence: 'low', supporting_quotes: [] },
        key_positives: [],
        key_concerns: [{ topic: 'Analysis Error', description: 'All AI models failed. Please try again later.', severity: 'high' }],
        forward_guidance: {},
        capacity_utilization: null,
        growth_initiatives: [],
        summary: 'Analysis could not be completed due to AI service errors.'
    };
};


module.exports = { analyzeEarningsCall }