
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { GenerateParams, Question } from '../types';

// Helper to convert File to Base64 for Gemini
const fileToPart = (file: File): Promise<{ inlineData: { mimeType: string; data: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          mimeType: file.type,
          data: base64Data
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

let aiInstance: GoogleGenAI | null = null;
const getAI = () => {
  if (!aiInstance) {
    const key = import.meta.env.VITE_GEMINI_API_KEY || 'dummy_key';
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
};

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
    const { subject, topic, difficulty, count, type, date, language, context, inputMode, files } = params;

    const isCurrentAffairs = subject === 'Current Affairs';
    
    // Model fallback list to ensure reliability
    const modelsToTry = isCurrentAffairs 
      ? ['gemini-1.5-pro', 'gemini-1.5-pro-001', 'gemini-1.5-flash'] 
      : ['gemini-1.5-flash', 'gemini-1.5-flash-001', 'gemini-1.5-flash-8b', 'gemini-pro'];

    // Extract cleaner topic name for prompt
    const cleanTopic = topic.includes('(') ? topic.split('(')[1].replace(')', '') : topic;

    // Construct temporal context
    const dateContext = date ? `STRICTLY for the date: ${date}. Only include events that occurred on this specific day.` : `Focus on late 2024 to early 2025 events.`;

    // Get current year for metadata
    const currentYear = new Date().getFullYear().toString();
    const todayDate = new Date().toISOString().split('T')[0];

    // Build Context Instruction based on Input Mode
    let contextInstruction = "";
    if (inputMode === 'text' && context) {
      contextInstruction = `SOURCE MATERIAL:\n${context}\n\nINSTRUCTION: Generate questions STRICTLY based on the provided source material above. Do not use outside knowledge unless necessary to clarify context.`;
    } else if (inputMode === 'url' && context) {
      contextInstruction = `SOURCE URL: ${context}\n\nINSTRUCTION: Access the URL content (if possible) or use your knowledge about this specific URL/Topic to generate questions.`;
    } else if ((inputMode === 'image' || inputMode === 'pdf') && files?.length) {
      contextInstruction = `INSTRUCTION: Analyze the attached images/documents and generate questions based on their visual or textual content.`;
    }

    const prompt = `
      Generate ${count} educational questions for an Indian competitive exam (UPSC, SSC, Railway, State PSC, Banking).
      Subject: ${subject}
      Category/Topic: ${topic}
      Temporal Focus: ${dateContext}
      Difficulty: ${difficulty}
      Language: ${language || 'Bilingual'} (Ensure content is primarily in this language. If Bilingual, provide both English and Hindi).
      
      ${contextInstruction}

      Instructions for Current Affairs:
      - ${date ? `Source news ONLY from ${date}` : 'Use the most recent verified information.'}
      - Ensure high accuracy in facts, appointments, and data.
      - Every question must be relevant for a candidate appearing in exams in 2025.
      
      IMPORTANT: Fill ALL metadata fields accurately:
      - exam: Target exam like "UPSC", "SSC CGL", "RRB NTPC", "IBPS PO", "BPSC", etc.
      - year: Year of question relevance (${currentYear})
      - section: Which section this question fits (e.g., "General Awareness", "Quantitative Aptitude", "Reasoning", "General Science")
      - chapter: Specific chapter/topic name
      
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
        "exam": "SSC CGL",
        "year": "${currentYear}",
        "section": "General Awareness",
        "chapter": "Indian Economy"
      }
    `;

    try {
      // Prepare content parts (Text + Files)
      let contentParts: any[] = [{ text: prompt }];

      if ((inputMode === 'image' || inputMode === 'pdf') && files && files.length > 0) {
        const fileParts = await Promise.all(files.map(fileToPart));
        contentParts = [...contentParts, ...fileParts];
      }

      let response: GenerateContentResponse | null = null;
      let lastError: any = null;

      // Try models in sequence until one works
      for (const model of modelsToTry) {
        try {
          console.log(`Attempting generation with model: ${model}`);
          response = await getAI().models.generateContent({
            model: model,
            contents: [
              {
                role: "user",
                parts: contentParts
              }
            ],
            config: {
              tools: isCurrentAffairs || inputMode === 'url' ? [{ googleSearch: {} }] : undefined,
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
                    year: { type: Type.STRING },
                    section: { type: Type.STRING },
                    chapter: { type: Type.STRING }
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
          
          // If successful, break the loop
          if (response) break;
        } catch (e: any) {
          console.warn(`Model ${model} failed:`, e.message);
          lastError = e;
          // Continue to next model
        }
      }

      if (!response) {
        throw lastError || new Error("All models failed to generate content");
      }

      const rawQuestions = JSON.parse(response.text || "[]") as any[];

      return rawQuestions.map((q: any) => ({
        ...q,
        id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        question_unique_id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        subject,
        // Use AI-generated chapter or fallback to topic
        chapter: q.chapter || (date && topic.includes("Daily") ? `Daily News: ${date}` : cleanTopic),
        // Use AI-generated section or derive from subject
        section: q.section || subject,
        // Topic from generation params
        topic: cleanTopic,
        type: 'MCQ',
        difficulty,
        language: language || 'Bilingual',
        createdDate: new Date().toISOString(),
        // Date from params or today
        date: date || todayDate,
        // Year from AI or current
        year: q.year || currentYear,
        // Exam from AI or generic
        exam: q.exam || 'Competitive Exams',
        // Collection for grouping
        collection: `AI Generated - ${subject}`,
        // Previous of for source tracking
        previous_of: `AI Generated on ${todayDate}`,
        // Tags with all relevant metadata
        tags: [
          subject,
          cleanTopic,
          q.exam || '',
          q.section || '',
          difficulty,
          currentYear,
          "AI-Generated"
        ].filter(Boolean)
      }));
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      // Throw the actual error message for better debugging in UI
      throw new Error(error.message || "Failed to generate questions. Check network or API limits.");
    }
  },

  summarizeExplanation: async (text: string): Promise<string> => {
    try {
      const response = await getAI().models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: `Summarize this in one short sentence: "${text}"` }] }],
      });
      return response.text?.trim() || text;
    } catch (err) {
      return text;
    }
  },

  suggestTopics: async (subject: string): Promise<string[]> => {
    if (subject === 'Current Affairs') return CURRENT_AFFAIRS_CATEGORIES;
    try {
      const response = await getAI().models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: `List 10 popular chapters for competitive exams in ${subject}. JSON array of strings only.` }] }],
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
