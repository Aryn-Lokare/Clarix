import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request) {
  try {
    const { question, context } = await request.json()
    if (!question || typeof question !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing question' }), { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server missing GEMINI_API_KEY' }), { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    // Use a stable default model; allow override via env if desired
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
    const model = genAI.getGenerativeModel({ model: modelName })

const system = `You are a helpful medical imaging assistant for X-ray/MRI/CT results.
- Provide general, educational explanations about conditions, imaging findings, and typical clinical workflows.
- You may give high-level overviews of common treatment approaches (e.g., "antibiotics are often used", "immobilization is typical"), but never provide prescriptive medical advice or instructions specific to a person.
- Always include a short disclaimer when discussing treatment and advise the user to consult a qualified clinician for diagnosis and treatment decisions.
- If context is provided, use it to answer. Keep answers concise and clear.`

    const parts = []
    parts.push({ text: system })
    if (context && typeof context === 'string' && context.trim()) {
      parts.push({ text: `Context (AI findings):\n${context}` })
    }
    parts.push({ text: `Question: ${question}` })

    const result = await model.generateContent({ contents: [{ role: 'user', parts }] })
    const text = result?.response?.text?.() || 'No response generated.'

    return new Response(JSON.stringify({ answer: text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Ask AI error:', err)
    return new Response(JSON.stringify({ error: 'Failed to get answer' }), { status: 500 })
  }
}
