import { GoogleGenAI } from "@google/genai";
import { Expense, Debt } from "../types";

// Note: In a real production app, API keys should be handled via a proxy server
// or user input if strictly client-side to avoid exposure.
// The prompt instructions stipulate using process.env.API_KEY.

export const generateFinancialInsights = async (expenses: Expense[], debts: Debt[]): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found");
    }

    const ai = new GoogleGenAI({ apiKey });

    const expenseSummary = expenses.slice(0, 50).map(e => 
      `${e.date}: ${e.type} - ${e.description} (₹${e.amount}) [${e.category}]`
    ).join('\n');

    const debtSummary = debts.filter(d => d.status === 'PENDING').map(d => 
      `${d.type}: ₹${d.amount} involved with ${d.person}`
    ).join('\n');

    const prompt = `
      Analyze the following financial data snippet (Currency: Indian Rupees ₹).
      
      Expenses/Income (Last 50):
      ${expenseSummary}

      Active Debts:
      ${debtSummary}

      Please provide 3 brief, actionable bullet points of financial advice or observation based on this data.
      Keep the tone professional yet encouraging. Focus on spending habits or debt management in the Indian context if relevant.
      Return plain text formatted with bullet points.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not generate insights at this time.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate AI insights. Please check your API configuration.";
  }
};