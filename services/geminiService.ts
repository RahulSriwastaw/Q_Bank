
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { GenerateParams, Question } from '../types';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const CURRENT_AFFAIRS_CATEGORIES = [
  "Daily News Recap",
  "Who, What, Where?",
  "Modi Cabinet 3.0",
  "State Capitals, Governors, and Chief Ministers",
  "High Courts of India",
  "Countries of the World: Who, What, Where?",
  "First in India and World: 2023-25",
  "Major Memorandums of Understanding (MoU): 2024-25",
  "Major Mobile Apps and Portals: 2024-25",
  "Brand Ambassadors (Campaigns and Organizations)",
  "Bharat Ratna: 2024",
  "Joint Military Exercises: 2024-25",
  "Lok Sabha Elections 2024",
  "International Organizations: At a Glance",
  "Major International Summits: 2024-25",
  "Major National Summits: 2024-25",
  "Major Operations of Year 2023-25",
  "Major Reports of Government of India",
  "Various Indices/Reports: 2024-25",
  "Economic Survey: 2024-25",
  "Union Budget: 2025-26",
  "Central Government Schemes: 2014-24",
  "State Government Schemes: 2023-24",
  "Economic Scenario",
  "Science and Technology",
  "Defense and Security",
  "Space Technology",
  "Environment and Ecology",
  "National Sports Awards: 2024",
  "Awards, Medals, and Honors",
  "Sports Scenario",
  "Latest Books and Authors",
  "Important Days",
  "Important Days and Their Themes",
  "Important Summits and Ceremonies",
  "Latest Abbreviations",
  "Miscellaneous Current Affairs"
];

export const geminiService = {
  generateQuestions: async (params: GenerateParams): Promise<Question[]> => {
    const { subject, topic, difficulty, count, type, date, language } = params;

    const isCurrentAffairs = subject === 'Current Affairs';
    const modelName = isCurrentAffairs ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

    // Extract cleaner topic name for prompt
    const cleanTopic = topic.includes('(') ? topic.split('(')[1].replace(')', '') : topic;

    // Construct temporal context
    const dateContext = date ? `STRICTLY for the date: ${date}. Only include events that occurred on this specific day.` : `Focus on late 2024 to early 2025 events.`;

    const prompt = `
      Generate ${count} educational questions for an Indian competitive exam (UPSC, SSC, Railway, State PSC).
      Subject: ${subject}
      Category/Topic: ${topic}
      Temporal Focus: ${dateContext}
      Difficulty: ${difficulty}
      Language: ${language || 'Bilingual'} (Ensure content is primarily in this language. If Bilingual, provide both English and Hindi).
      
      Instructions for Current Affairs:
      - ${date ? `Source news ONLY from ${date}` : 'Use the most recent verified information.'}
      - Ensure high accuracy in facts, appointments, and data.
      - Every question must be relevant for a candidate appearing in exams in 2025.
      
      Response Format (JSON):
      {
        "question_eng": "...", "question_hin": "...",
        "option1_eng": "...", "option1_hin": "...",
        "option2_eng": "...", "option2_hin": "...",
        "option3_eng": "...", "option3_hin": "...",
        "option4_eng": "...", "option4_hin": "...",
        "option5_eng": "None of the above / More than one of the above", "option5_hin": "उपर्युक्त में से कोई नहीं / उपर्युक्त में से एक से अधिक",
        "answer": "1", // Valid values: 1, 2, 3, 4, 5
        "solution_eng": "...", "solution_hin": "...",
        "exam": "UPSC/SSC/BPSC",
        "year": "2024/2025"
      }
    `;

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          tools: isCurrentAffairs ? [{ googleSearch: {} }] : undefined,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question_eng: { type: Type.STRING },
                question_hin: { type: Type.STRING },
                option1_eng: { type: Type.STRING },
                option1_hin: { type: Type.STRING },
                option2_eng: { type: Type.STRING },
                option2_hin: { type: Type.STRING },
                option3_eng: { type: Type.STRING },
                option3_hin: { type: Type.STRING },
                option4_eng: { type: Type.STRING },
                option4_hin: { type: Type.STRING },
                option5_eng: { type: Type.STRING },
                option5_hin: { type: Type.STRING },
                answer: { type: Type.STRING },
                solution_eng: { type: Type.STRING },
                solution_hin: { type: Type.STRING },
                exam: { type: Type.STRING },
                year: { type: Type.STRING }
              },
              required: [
                "question_eng", "question_hin",
                "option1_eng", "option1_hin",
                "option2_eng", "option2_hin",
                "option3_eng", "option3_hin",
                "option4_eng", "option4_hin",
                "answer",
                "solution_eng", "solution_hin",
                "exam", "year"
              ]
            }
          }
        }
      });

      const rawQuestions = JSON.parse(response.text || "[]") as any[];

      return rawQuestions.map((q: any) => ({
        ...q,
        id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        subject,
        // If it's a daily recap, the chapter reflects the date
        chapter: date && topic.includes("Daily") ? `Daily News: ${date}` : cleanTopic,
        type: 'MCQ',
        difficulty,
        language: language || 'Bilingual',
        createdDate: new Date().toISOString(),
        date: date || undefined,
        tags: [subject, cleanTopic, date || '', q.exam, "AI-Generated"].filter(Boolean)
      }));
    } catch (error) {
      console.error("AI Generation Error:", error);
      throw new Error("Failed to generate questions. Check network or API limits.");
    }
  },

  summarizeExplanation: async (text: string): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Summarize this in one short sentence: "${text}"`,
      });
      return response.text?.trim() || text;
    } catch (err) {
      return text;
    }
  },

  suggestTopics: async (subject: string): Promise<string[]> => {
    if (subject === 'Current Affairs') return CURRENT_AFFAIRS_CATEGORIES;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `List 10 popular chapters for competitive exams in ${subject}. JSON array of strings only.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      });
      return JSON.parse(response.text || "[]") as string[];
    } catch (err) {
      return [];
    }
  }
};
