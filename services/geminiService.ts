
import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { GenerateParams, Question } from '../types';

// Helper to convert File to Base64 for Gemini
const fileToPart = (file: File): Promise<Part> => {
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

let aiInstance: GoogleGenerativeAI | null = null;
const getAI = () => {
  if (!aiInstance) {
    const key = import.meta.env.VITE_GEMINI_API_KEY || 'dummy_key';
    aiInstance = new GoogleGenerativeAI(key);
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
  generateQuestions: async (params: GenerateParams, modelId?: string): Promise<Question[]> => {
    const { subject, topic, difficulty, count, type, date, language, context, inputMode, files } = params;

    const isCurrentAffairs = subject === 'Current Affairs';

    // Model fallback list to ensure reliability
    // Prioritizing Gemini 2.0 Flash (Experimental) as requested
    const defaultModels = isCurrentAffairs
      ? ['gemini-2.0-flash-exp', 'gemini-1.5-pro-002', 'gemini-1.5-flash', 'gemini-1.5-pro-001']
      : ['gemini-2.0-flash-exp', 'gemini-1.5-flash-latest', 'gemini-1.5-flash-002', 'gemini-pro'];

    // If specific model requested, try that first
    const modelsToTry = modelId ? [modelId, ...defaultModels] : defaultModels;

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

      IMPORTANT: SOLUTION QUALITY REQUIREMENTS (CRITICAL):
      For every question, the "solution_eng" and "solution_hin" must be HIGHLY COMPREHENSIVE and cover the topic exhaustively.
      Structure the solution to include:
      1. **Detailed Explanation**: Cover the 'Why' and 'How', not just the 'What'. Explain the core answer in depth.
      2. **Context & Background**: Provide the background story or context necessary to understand the event.
      3. **Key Details**: Explicitly mention relevant Dates, Names, Figures, Locations, and Constitutional Articles/Acts if applicable.
      4. **Related Information**: Briefly cover related sub-topics or connected events to give a holistic view.
      5. **Key Takeaways**: Bullet points of facts to remember.

      Objective: A student reading this solution should grasp the ENTIRE topic and be able to answer related questions without needing further reference.
      
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
        "solution_eng": "**Correct Answer:** [Option]\\n\\n**Detailed Explanation:** ...\\n\\n**Context:** ...\\n\\n**Key Takeaways:** ...", 
        "solution_hin": "**सही उत्तर:** [विकल्प]\\n\\n**विस्तृत व्याख्या:** ...\\n\\n**संदर्भ:** ...\\n\\n**मुख्य बिंदु:** ...",
        "exam": "SSC CGL",
        "year": "${currentYear}",
        "section": "General Awareness",
        "chapter": "Indian Economy"
      }
    `;

    try {
      // Prepare content parts (Text + Files)
      let contentParts: Part[] = [{ text: prompt }];

      if ((inputMode === 'image' || inputMode === 'pdf') && files && files.length > 0) {
        const fileParts = await Promise.all(files.map(fileToPart));
        contentParts = [...contentParts, ...fileParts];
      }

      let responseText = "";
      let lastError: any = null;

      // Try models in sequence until one works
      // Added gemini-1.5-pro as stable fallback, and maintained 2.0 flash exp as lead
      const activeModels = isCurrentAffairs
        ? ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash']
        : ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'];

      for (const modelName of activeModels) {
        try {
          console.log(`Attempting generation with model: ${modelName}`);
          const model = getAI().getGenerativeModel({
            model: modelName,
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "ARRAY" as any,
                items: {
                  type: "OBJECT" as any,
                  properties: {
                    question_eng: { type: "STRING" as any },
                    question_hin: { type: "STRING" as any },
                    option1_eng: { type: "STRING" as any },
                    option1_hin: { type: "STRING" as any },
                    option2_eng: { type: "STRING" as any },
                    option2_hin: { type: "STRING" as any },
                    option3_eng: { type: "STRING" as any },
                    option3_hin: { type: "STRING" as any },
                    option4_eng: { type: "STRING" as any },
                    option4_hin: { type: "STRING" as any },
                    option5_eng: { type: "STRING" as any },
                    option5_hin: { type: "STRING" as any },
                    answer: { type: "STRING" as any },
                    solution_eng: { type: "STRING" as any },
                    solution_hin: { type: "STRING" as any },
                    exam: { type: "STRING" as any },
                    year: { type: "STRING" as any },
                    section: { type: "STRING" as any },
                    chapter: { type: "STRING" as any }
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

          const result = await model.generateContent(contentParts);
          const response = await result.response;
          responseText = response.text();

          // If successful, break the loop
          if (responseText) break;
        } catch (e: any) {
          console.warn(`Model ${modelName} failed:`, e.message);
          lastError = e;
          // Continue to next model
        }
      }

      if (!responseText) {
        throw lastError || new Error("All models failed to generate content");
      }

      // Cleanup response text (remove markdown code blocks if present)
      const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const rawQuestions = JSON.parse(cleanText || "[]") as any[];

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
      const model = getAI().getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      const result = await model.generateContent(`Summarize this in one short sentence: "${text}"`);
      return result.response.text().trim() || text;
    } catch (err) {
      return text;
    }
  },

  suggestTopics: async (subject: string): Promise<string[]> => {
    if (subject === 'Current Affairs') return CURRENT_AFFAIRS_CATEGORIES;
    try {
      const model = getAI().getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: { type: "ARRAY" as any, items: { type: "STRING" as any } }
        }
      });

      const result = await model.generateContent(`List 10 popular chapters for competitive exams in ${subject}. JSON array of strings only.`);
      return JSON.parse(result.response.text() || "[]") as string[];
    } catch (err) {
      return [];
    }
  },

  generateAnswer: async (question: string, options: { detailLevel: 'Brief' | 'Detailed' | 'Step-by-Step'; language: string }): Promise<any> => {
    const prompt = `
      Provide a ${options.detailLevel} answer for this question: "${question}"
      Language: ${options.language}
      
      Format (JSON):
      {
        "answer": "Core answer text...",
        "explanation": "Detailed explanation...",
        "key_points": ["Point 1", "Point 2"],
        "examples": ["Example 1"],
        "common_mistakes": ["Mistake 1"]
      }
    `;

    try {
      const model = getAI().getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: { responseMimeType: "application/json" }
      });
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text());
    } catch (e) {
      console.warn("gemini-2.0-flash-exp failed for answer, trying gemini-1.5-pro", e);
      try {
        const model = getAI().getGenerativeModel({
          model: 'gemini-1.5-pro',
          generationConfig: { responseMimeType: "application/json" }
        });
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text());
      } catch (e2) {
        console.error("Answer gen failed on fallback", e2);
        throw e2;
      }
    }
  },

  generateBookStructure: async (title: string, subject: string, targetAudience: string, topics: string[]): Promise<any> => {
    const prompt = `
      Create a detailed book structure for: "${title}"
      Subject: ${subject}
      Target Audience: ${targetAudience}
      Key Topics: ${topics.join(", ")}
      
      Format (JSON):
      {
        "title": "${title}",
        "chapters": [
          {
            "title": "Chapter 1: ...",
            "sections": ["1.1 ...", "1.2 ..."],
            "summary": "Brief summary..."
          }
        ]
      }
    `;
    try {
      const model = getAI().getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: { responseMimeType: "application/json" }
      });
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text());
    } catch (e) {
      console.error("Book structure gen failed", e);
      throw e;
    }
  },

  generateBookChapter: async (chapterTitle: string, sections: string[], audience: string): Promise<string> => {
    const prompt = `
      Write a detailed book chapter content for: "${chapterTitle}"
      Sections to cover: ${sections.join(", ")}
      Target Audience: ${audience}
      
      Format: Markdown (Detailed, educational, engaging, with examples)
    `;
    try {
      const model = getAI().getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (e) {
      console.error("Chapter content gen failed", e);
      throw e;
    }
  },

  proofreadContent: async (content: string): Promise<any> => {
    const prompt = `
      Act as an expert proofreader and editor for educational content. 
      Analyze the text below for grammar, spelling, punctuation, style, and clarity issues.
      
      Text to Analyze:
      "${content}"

      Return a JSON response with the following structure:
      {
        "segments": [
          {
            "text": "original segment text",
            "type": "text" | "error" | "suggestion", 
            "severity": "info" | "warning" | "critical",
            "message": "Explanation of the issue (if any)",
            "replacement": "Safe replacement text (if error)"
          }
        ],
        "summary": "Brief summary of the quality and main issues found.",
        "score": 85 // Quality score 0-100
      }

      Rules:
      1. Break the text into logical segments (words/phrases). 
      2. Keep "text" type for correct parts.
      3. Use "error" type for objective mistakes (grammar, spelling).
      4. Use "suggestion" type for stylistic improvements.
      5. Ensure reassembling the "text" fields produces the original text approximately.
      6. "replacement" should be the corrected version of that specific segment.
    `;

    try {
      const model = getAI().getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: { responseMimeType: "application/json" }
      });
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text());
    } catch (e) {
      console.error("Proofreading failed", e);
      throw e;
    }
  }
};
