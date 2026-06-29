import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize server-side Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not defined in the environment variables!");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "MOCK_KEY_FOR_BUILD_ONLY",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API Route to generate a productivity plan using Gemini 3.5 Flash
app.post("/api/generate-plan", async (req, res) => {
  try {
    const { rawText, tone, existingTasks, currentLocalTime } = req.body;

    if (!rawText || typeof rawText !== "string") {
      return res.status(400).json({ error: "Missing or invalid rawText input." });
    }

    // Normalize the tone value to be fully robust against legacy localstorage values
    let normalizedTone = "Encouraging & Supportive";
    if (tone && (tone.includes("Strict") || tone.includes("Bootcamp") || tone.includes("No-Nonsense"))) {
      normalizedTone = "Strict & No-Nonsense";
    }

    const ai = getGeminiClient();

    const localTimeContext = currentLocalTime ? `
USER CURRENT LOCAL TIME CONTEXT:
- ISO string: "${currentLocalTime.isoString}"
- Local string representation: "${currentLocalTime.localString}"
- Day of week: "${currentLocalTime.dayOfWeek}"
- Timezone: "${currentLocalTime.timeZone}"
- Short time-only: "${currentLocalTime.timeOnly}"
` : `
USER CURRENT LOCAL TIME CONTEXT:
- Local string representation: "${new Date().toLocaleString()}"
- Day of week: "${new Date().toLocaleDateString(undefined, { weekday: 'long' })}"
`;

    const dateUnderstandingRules = `
DATE AND TIME UNDERSTANDING INSTRUCTIONS:
- You must interpret relative terms (like "today," "tomorrow," "next week," or "this Friday") naturally using the local time context provided below.
- CRITICAL DATE AMBIGUITY / MIDNIGHT CHECK:
- If the current local time is close to midnight (specifically between 11:00 PM and 1:30 AM), OR if the notes are ambiguous about when tasks are due (e.g., user says "tomorrow morning" but it's already 11:30 PM, or they say "this Friday" but today is Friday, or write "tonight" but it's already past 11:00 PM, or there is another genuine date ambiguity in the notes), you MUST NOT guess or assume.
  Instead, you MUST return the "clarificationRequest" field containing a precise, detailed question explaining the ambiguity and 2-3 structured options/choices (with concrete dates) for the user to pick from.
  When generating a "clarificationRequest", DO NOT populate "tasks" or "blueprint" (leave them out or set to null/empty).
  If there is no date ambiguity, proceed to generate "tasks" and "blueprint" normally and omit "clarificationRequest".
`;

    const numericalContextExtractionRules = `
NUMERICAL CONTEXT EXTRACTION RULES:
- You MUST intelligently detect quantities, repetitions, sets, durations, pages, chapters, and study sessions mentioned in the text.
- NEVER discard, omit, or simplify away numerical context. For example, if the user mentions "do 3 sets of 15 reps of squats" or "read chapter 4 (pages 20-45) for 2 hours", the extracted task title or details MUST preserve these numbers exactly (do NOT shorten to just "squats" or "read chapter").
- Extract these parameters and populate the "numericalContext" object with fields like "quantity", "repetitions", "sets", "duration", "pages", "chapters", "sessions" if explicitly or implicitly mentioned.
- Ensure the task's "notes" and "title" also retain references to these quantities so they are clearly visible in the UI.
`;

    // Build the prompt for Gemini
    const systemPrompt = `You are an elite productivity agent, schedule optimizer, and life coach.
Your job is to analyze a user's rough notes, a messy list of tasks, deadlines, and their stressful thoughts. 
You will parse them into structured tasks, prioritize them, detect scheduling conflicts, draft an optimized timeline (schedule), and write a customized coaching message.

CRITICAL: You must tailor the coaching message specifically to the selected tone:
- Tone choice: "${normalizedTone}"

If tone is "Encouraging & Supportive":
  - Be warm, highly empathetic, reassuring, and validating of their overwhelm.
  - Break tasks into small, non-scary steps. Use encouraging exclamation marks and supportive words.
  - Assure them they can do it, and emphasize self-care.

If tone is "Strict & No-Nonsense":
  - Be direct, firm, high-energy, and ultra-focused on action. No excuses, no whining, and no sugar-coating.
  - Call out procrastination head-on. Tell them to turn off distractions and get to work like a bootcamp sergeant.
  - Keep it punchy, demanding, and action-oriented, but still deeply motivating and constructive.

You should also look at the existing active tasks in their dashboard to see if they need to be kept, merged, or reprioritized in the generated plan:
${JSON.stringify(existingTasks || [])}

${dateUnderstandingRules}
${numericalContextExtractionRules}
${localTimeContext}
`;

    const userPrompt = `Here is my current raw notes list, stressful thoughts, and deadlines:
---
${rawText}
---

Please analyze this text. If relative dates or timings are ambiguous (especially around midnight), return a clarificationRequest. Otherwise, extract any actionable tasks (including identifying deadlines, estimating urgency, assigning proper priority: High, Medium, Low), detect conflicts, make a practical schedule, and give me recommendations and a highly focused coaching message in the requested coach tone ("${normalizedTone}").`;

    console.log("Calling Gemini API with model: gemini-3.5-flash...");
    
    let response;
    const responseSchemaDefinition = {
      type: Type.OBJECT,
      properties: {
        clarificationRequest: {
          type: Type.OBJECT,
          description: "Set this ONLY when relative dates are ambiguous (especially around midnight) or unclear, requiring the user's input before a schedule can be compiled. Omit tasks and blueprint if this is returned.",
          properties: {
            message: { type: Type.STRING, description: "Detailed, friendly question pointing out the ambiguity and asking for clarification (e.g., 'Since it is currently 11:45 PM on Sunday, did you mean Monday morning or Tuesday morning?')." },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2-3 precise choices complete with concrete dates."
            }
          },
          required: ["message", "options"]
        },
        tasks: {
          type: Type.ARRAY,
          description: "Structured tasks extracted and prioritized from the raw text and existing tasks list. Omit if clarificationRequest is provided.",
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Title of the task." },
              deadline: { type: Type.STRING, description: "Extracted deadline (e.g., 'Today', 'By Friday', 'June 30th', or 'No specific deadline')." },
              priority: { type: Type.STRING, description: "AI prioritized level. Must be exactly 'High', 'Medium', or 'Low'." },
              status: { type: Type.STRING, description: "Status of the task. Must be exactly 'Not Started', 'In Progress', or 'Completed'." },
              notes: { type: Type.STRING, description: "A brief contextual explanation or stress-reducing note for this task. ALWAYS include or mention any numerical quantity context if relevant." },
              estimatedUrgency: { type: Type.STRING, description: "Estimated urgency and reason why (e.g., 'Due in 3 hours' or 'Long-term priority')." },
              numericalContext: {
                type: Type.OBJECT,
                description: "Extracted numerical parameters, quantities, reps, sets, durations, pages, chapters, or study sessions if explicitly or implicitly mentioned.",
                properties: {
                  quantity: { type: Type.STRING, description: "Any generic quantity details, e.g. '500 words', '2 essays'." },
                  repetitions: { type: Type.STRING, description: "Repetitions/reps count, e.g. '12 reps', '15 times'." },
                  sets: { type: Type.STRING, description: "Sets count, e.g. '3 sets', '4 circuits'." },
                  duration: { type: Type.STRING, description: "Expected duration or time commitment, e.g. '2 hours', '45 mins'." },
                  pages: { type: Type.STRING, description: "Pages count or range, e.g. '25 pages', 'pages 40-55'." },
                  chapters: { type: Type.STRING, description: "Chapters numbers or names, e.g. 'Chapter 4', 'Chapters 1-3'." },
                  sessions: { type: Type.STRING, description: "Number of study/work sessions, e.g. '2 sessions', '1 session'." }
                }
              }
            },
            required: ["title", "deadline", "priority", "status"]
          }
        },
        blueprint: {
          type: Type.OBJECT,
          description: "The intelligent action plan and coaching insights. Omit if clarificationRequest is provided.",
          properties: {
            coachingMessage: {
              type: Type.STRING,
              description: "A short, powerful coaching paragraph in the exact selected tone (Encouraging or Strict Bootcamp) targeting their stressful thoughts and tasks."
            },
            urgencyAnalysis: {
              type: Type.STRING,
              description: "A professional, bold overall summary of their situational urgency and cognitive load."
            },
            conflictsDetected: {
              type: Type.ARRAY,
              description: "Any scheduling conflicts, bottlenecks, or potential stressors found in the notes or deadlines.",
              items: { type: Type.STRING }
            },
            schedule: {
              type: Type.ARRAY,
              description: "A proposed time-blocked action schedule or order of operations to tackle these tasks today/tomorrow.",
              items: {
                type: Type.OBJECT,
                properties: {
                  timeWindow: { type: Type.STRING, description: "Recommended block, e.g., 'Morning (9 AM - 11 AM)', 'Afternoon Focus', or 'Quick Win #1'." },
                  taskTitle: { type: Type.STRING, description: "The task to tackle in this slot." },
                  focusTip: { type: Type.STRING, description: "A micro-tip for maximum concentration during this block." }
                },
                required: ["timeWindow", "taskTitle", "focusTip"]
              }
            },
            recommendations: {
              type: Type.ARRAY,
              description: "A list of 3-5 specific, actionable productivity/stress-management recommendations for the user.",
              items: { type: Type.STRING }
            }
          },
          required: ["coachingMessage", "urgencyAnalysis", "conflictsDetected", "schedule", "recommendations"]
        }
      }
    };

    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: responseSchemaDefinition
        }
      });
    } catch (geminiError: any) {
      console.log("Applying secondary model execution context.");
      
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: responseSchemaDefinition
        }
      });
    }

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from Gemini API.");
    }

    const parsedResponse = JSON.parse(resultText);
    return res.json(parsedResponse);
  } catch (error: any) {
    console.error("Error in /api/generate-plan:", error);
    return res.status(500).json({
      error: "Failed to generate plan from Gemini.",
      details: error.message || error
    });
  }
});

// Vite Middleware integration for development and Static Assets for production
const setupViteOrStatic = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
};

// Start Server
const startServer = async () => {
  await setupViteOrStatic();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
