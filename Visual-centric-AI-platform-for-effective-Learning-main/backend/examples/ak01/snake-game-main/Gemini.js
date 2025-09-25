const express = require("express");
const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();
app.use(express.json());

const GEMINI_API_KEY = "AIzaSyAvr-TV52Z8bgQDr88OYGzHYPCeFmZXqeg"; // Replace with your API Key
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
app.get("/", (req, res) => {
    res.send("Server is running. Use the /validate endpoints.");
});
// Function to call Gemini AI for text analysis
async function analyzeWithGemini(prompt) {
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error calling Gemini API", error);
        return null;
    }
}
// Validate financial institution
app.post("/validate/institution", async (req, res) => {
    const { institution } = req.body;
    const response = await analyzeWithGemini(`Is '${institution}' a valid financial institution? Reply 'true' or 'false'.`);
    res.json({
        found: !!response,
        institution_name: institution,
        valid: response?.toLowerCase().includes('true')
    });
});
app.post("/ask", async (req, res) => {
    const { prompt } = req.body;
    try {
        const result = await analyzeWithGemini(prompt);

        // Check for negative or not found responses (customize as needed)
        if (
            !result ||
            result.toLowerCase().includes("not found") ||
            result.toLowerCase().includes("no information") ||
            result.toLowerCase().includes("i don't know")
        ) {
            // Forward to MCP server for Bing search
            try {
                const mcpRes = await axios.post('http://127.0.0.1:9000/bing-search', { prompt });
                return res.json({ result: mcpRes.data.result, source: "bing" });
            } catch (bingErr) {
                return res.json({ error: "Neither Gemini nor Bing could answer your query." });
            }
        }

        res.json({ result, source: "gemini" });
    } catch (e) {
        res.json({ error: "Error processing your request." });
    }
});
// Validate name in document
app.post("/validate/name", async (req, res) => {
    const { name } = req.body;
    const response = await analyzeWithGemini(`Check if the name '${name}' exists in the document. Reply 'true' or 'false'.`);
    res.json({
        found: !!response,
        valid: response?.toLowerCase().includes('true')
    });
});
// Validate amount in document
app.post("/validate/amount", async (req, res) => {
    const { amount } = req.body;
    const response = await analyzeWithGemini(`Check if the amount '${amount}' exists in the document. Reply 'true' or 'false'.`);
    res.json({
        found: !!response,
        valid: response?.toLowerCase().includes('true')
    });
});
// Validate date within a specific range
app.post("/validate/date", async (req, res) => {
    const { days } = req.body;
    const response = await analyzeWithGemini(`Check if the document contains a date within the last '${days}' days. Reply 'true' or 'false'.`);
    res.json({
        found: !!response,
        valid: response?.toLowerCase().includes('true')
    });
});
// UI for Gemini Query
app.get("/ui", (req, res) => {
    res.send(`
        <html>
        <body>
            <h2>Gemini Query UI</h2>
            <form id="queryForm">
                <label>Prompt: <input type="text" id="prompt" size="60"/></label>
                <button type="submit">Ask Gemini</button>
            </form>
            <pre id="result"></pre>
            <script>
                document.getElementById('queryForm').onsubmit = async function(e) {
                    e.preventDefault();
                    const prompt = document.getElementById('prompt').value;
                    const res = await fetch('/ask', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ prompt })
                    });
                    const data = await res.json();
                    document.getElementById('result').textContent = data.result || data.error;
                }
            </script>
        </body>
        </html>
    `);
});
app.post("/ask", async (req, res) => {
    const { prompt } = req.body;
    try {
        const result = await analyzeWithGemini(prompt);
        res.json({ result });
    } catch (e) {
        res.json({ error: "Error processing your request." });
    }
});
// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

