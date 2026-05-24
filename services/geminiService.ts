
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { ChatMessage, Product, PlantAnalysisResult, Weather, CropAdvice, GroundingSource } from '../types';

let ai: GoogleGenAI | null = null;

export const getAI = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable is not set.");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};

export const getGeminiChatResponse = async (
    newMessage: string,
    history: ChatMessage[],
    language: string = 'English'
): Promise<string> => {
    try {
        const aiInstance = getAI();
        const systemInstruction = `You are an expert virtual agronomist. Provide concise, practical advice. Respond in ${language}.`;

        const contents = history.map(msg => ({
            role: msg.sender === 'bot' ? 'model' : 'user',
            parts: [{ text: msg.text }]
        }));

        contents.push({
            role: 'user',
            parts: [{ text: newMessage }]
        });
        
        const response = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: { systemInstruction }
        });
        
        return response.text || "I'm sorry, I couldn't generate a response.";
    } catch (error) {
        console.error("Gemini API call failed:", error);
        return "Error connecting to AI.";
    }
};

export const getWeatherAndCropAdvice = async (lat: number, lon: number, language: string = 'English'): Promise<{ weather: Weather, advice: CropAdvice }> => {
    try {
        const aiInstance = getAI();
        const prompt = `Use Google Search to find current weather conditions and 3-day agricultural forecast for Latitude ${lat}, Longitude ${lon}. 
        Also find the top 3 best crops to plant in this specific East African region right now given the current seasonal moisture and temperature.
        
        All text fields in the response must be in ${language}.
        
        Return ONLY a JSON object matching this schema:
        {
            "weather": {
                "temp": number,
                "condition": "string",
                "icon": "☀️" | "☁️" | "🌧️" | "⛈️" | "⛅",
                "humidity": number,
                "windSpeed": number,
                "forecast": [{ "date": "string", "temp": number, "condition": "string", "icon": "string" }]
            },
            "advice": {
                "bestCrops": [{ "name": "string", "reason": "string", "plantingTip": "string" }],
                "soilPreparation": "string",
                "alert": "optional weather warning string"
            }
        }
        
        Important: For the forecast date, use a short format like "Mon" or "Feb 21".`;

        const response = await aiInstance.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json"
            }
        });

        const text = response.text || '{}';
        const parsed = JSON.parse(text);

        // Extract grounding sources
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const sources: GroundingSource[] = [];
        if (groundingChunks) {
            groundingChunks.forEach((chunk: any) => {
                if (chunk.web) {
                    sources.push({
                        title: chunk.web.title || 'Source',
                        uri: chunk.web.uri
                    });
                }
            });
        }

        // Attach sources to both weather and advice for attribution
        if (parsed.weather) parsed.weather.sources = sources;
        if (parsed.advice) parsed.advice.sources = sources;

        return parsed;
    } catch (error) {
        console.error("Weather AI failed:", error);
        return {
            weather: { temp: 24, condition: 'Clear', icon: '☀️', humidity: 60, windSpeed: 10, forecast: [] },
            advice: { bestCrops: [], soilPreparation: "Check local soil moisture before planting." }
        };
    }
};

export const getAiEnhancedSearchResults = async (
    query: string,
    products: Pick<Product, 'id' | 'name' | 'description' | 'category'>[]
): Promise<string[]> => {
    try {
        const aiInstance = getAI();
        const response = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Search Query: "${query}" Products: ${JSON.stringify(products)}. Return JSON { "productIds": string[] } sorted by relevance.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        productIds: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });
        const result = JSON.parse(response.text || '{}');
        return result.productIds || [];
    } catch (error) {
        return [];
    }
};

export const analyzePlantImage = async (base64Image: string, mimeType: string, language: string = 'English'): Promise<PlantAnalysisResult> => {
    try {
        const aiInstance = getAI();
        const response = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [
                { inlineData: { mimeType, data: base64Image } },
                { text: `Diagnose plant disease. Return JSON with diagnosis, causes, recommendations, suggestedProductTypes. All text fields must be in ${language}.` }
            ]},
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        diagnosis: { type: Type.STRING },
                        causes: { type: Type.STRING },
                        recommendations: { type: Type.STRING },
                        suggestedProductTypes: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{}') as PlantAnalysisResult;
    } catch (error) {
        return { diagnosis: "Error", causes: "Unknown", recommendations: "Try again", suggestedProductTypes: [] };
    }
};
