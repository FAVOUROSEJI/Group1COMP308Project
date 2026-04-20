const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-3.1-flash-lite-preview",
});
console.log("API KEY:", process.env.GEMINI_API_KEY);
const summarizeText = async (text) => {
  const prompt = `Summarize this community discussion in 2-3 sentences:\n\n${text}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;

  return response.text();
};

module.exports = { summarizeText };