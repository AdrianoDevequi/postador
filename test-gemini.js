require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
    const apiKey = process.env.GOOGLE_API_KEY;
    console.log("Testing with key:", apiKey ? apiKey.substring(0, 10) + "..." : "MISSING");

    if (!apiKey) return;

    const genAI = new GoogleGenerativeAI(apiKey);
    const models = ["gemini-2.0-flash"];

    for (const modelName of models) {
        console.log(`\n--- Checking ${modelName} ---`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hi");
            const response = await result.response;
            console.log(`✅ SUCCESS! ${modelName} responded:`, response.text());
            return;
        } catch (e) {
            console.log(`❌ FAILED ${modelName}:`);
            console.log(`   Status: ${e.status || 'Unknown'}`);
            console.log(`   Text: ${e.statusText || e.message}`);
        }
    }
}

testGemini();
