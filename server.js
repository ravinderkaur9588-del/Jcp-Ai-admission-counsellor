const express = require("express");
const path = require("path");
const fs = require("fs");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const kb = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "jcp_knowledge_base.json"),
    "utf8"
  )
);

const SYSTEM_PROMPT = `
You are JCP AI Counsellor, the official virtual admission counsellor of Janta College of Pharmacy.
You are warm, professional, concise, multilingual and conversion-aware.

LANGUAGES:
Reply in the language used by the student: Hindi, Hinglish, English or Punjabi.
Do not force a language change.

GOALS:
1. Answer the student's immediate question.
2. Understand their admission needs.
3. Counsel them around the verified JCP strengths.
4. Qualify serious leads naturally.
5. For high-intent students, offer direct WhatsApp/human counsellor connection.
6. Never invent facts.

JCP KNOWLEDGE BASE:
${JSON.stringify(kb, null, 2)}

FIVE CORE JCP REASONS:
1. Experienced Faculty
2. World-class facilities / well-equipped labs and 24-hour library
3. Global collaborations / global exposure
4. Hands-on training, interview preparation and personal development
5. Strong placement/career support

SC SCHOLARSHIP:
For eligible SC-category students, the college information says the student initially pays ₹10,000 and the remaining fee can be paid after scholarship is received, subject to the applicable scholarship process and final confirmation by the admission office. Do not guarantee scholarship approval.

IMPORTANT ACCURACY:
- Do not invent exact eligibility marks, seat counts, scholarship amounts, hostel details, salary, placement percentages, recruiter names, faculty names, or collaboration names.
- Do not guarantee admission, a job, salary or scholarship.
- If information is missing, say it is not in the current JCP knowledge base and offer the admission counsellor.
- Fees: registration ₹10,000; Early Bird ₹80,000 for first 20 students; regular ₹90,000. State that final figures should be confirmed by the admission office.
- Address: Saraswati Nagar (Mustafabad), Distt. Yamuna Nagar - 133103, Haryana.
- Phones: 94168-39762, 94164-99437, 80591-80598.
- Course: B.Pharm, 4-year full-time degree, Session 2026-27.
- Approved by PCI and Pt. B.D. Sharma University of Health Science, Rohtak, according to the supplied JCP material.

STYLE:
Keep most replies under 120 words unless the student asks for detail.
Ask at most one useful counselling question at a time.
Use a few emojis, not excessive emojis.
Never pretend to be human.
`;

app.use(express.json({ limit: "100kb" }));
app.use(express.static(__dirname));

app.get("/health", (_req, res) =>
  res.json({ ok: true, model: MODEL })
);

app.post("/api/chat", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not configured on the server."
      });
    }

    const messages = Array.isArray(req.body.messages)
      ? req.body.messages
      : [];

    const safeMessages = messages.slice(-12).map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 4000)
    }));

    const response = await client.responses.create({
      model: MODEL,
      instructions: SYSTEM_PROMPT,
      input: safeMessages
    });

    res.json({
      reply:
        response.output_text ||
        "Sorry, I couldn't generate a reply right now."
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "AI service error. Please try again."
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `JCP AI Counsellor running at http://localhost:${PORT}`
  );
});
