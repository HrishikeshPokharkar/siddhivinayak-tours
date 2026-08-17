const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event, context) => {
  // CORS Headers - useful if you are calling this from a frontend domain
  const headers = {
    "Access-Control-Allow-Origin": "*", // Or specify your frontend URL
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight OPTIONS request for CORS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed. Please use POST." }),
    };
  }

  try {
    // Parse the incoming request body
    const body = JSON.parse(event.body || "{}");
    const userQuery = body.query;

    if (!userQuery) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing 'query' in the request body." }),
      };
    }

    // Initialize the Gemini API client
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY environment variable.");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Internal server misconfiguration." }),
      };
    }
    const genAI = new GoogleGenerativeAI(apiKey);

    // Setup the system instructions for the AI's persona
    const systemInstruction = 
      "You are a calm, helpful, and budget-conscious spiritual travel agent. " +
      "Help users plan spiritual tours and pilgrimages, offering practical advice " +
      "on itineraries, local transport, budget stays, and cultural/temple etiquette. " +
      "Always maintain a peaceful, welcoming, and respectful tone in your responses.";

    // Using gemini-3.7-flash 
    const model = genAI.getGenerativeModel({
      model: "gemini-3.7-flash",
      systemInstruction: systemInstruction,
    });

    // Request content generation from Gemini
    const result = await model.generateContent(userQuery);
    const aiResponse = result.response.text();

    // Return the AI's response in clean JSON
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        reply: aiResponse 
      }),
    };

  } catch (error) {
    console.error("Error communicating with Gemini API:", error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: "An error occurred while consulting the spiritual guide." 
      }),
    };
  }
};