import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const FLUX_API_URL = 'https://api.bfl.ai/v1/flux-kontext-pro';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Allow OPTIONS pre-flight requests for CORS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // Or your specific domain in production
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    };
  }
  
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed. Only POST requests are accepted." }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  const fluxApiKey = process.env.FLUX_API_KEY;

  if (!fluxApiKey) {
    console.error("FLUX_API_KEY is not set in Netlify environment variables.");
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Flux API key is not configured on the server." }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};

    const response = await fetch(FLUX_API_URL, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'x-key': fluxApiKey,
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseData = await response.json().catch(async () => {
        const textData = await response.text();
        return { message: `Flux API returned non-JSON response (status ${response.status}): ${textData}` };
    });

    return {
      statusCode: response.status,
      body: JSON.stringify(responseData),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // CORS header for the actual response
      },
    };
  } catch (error: any) {
    console.error("Error proxying request to Flux API:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: `Error proxying to Flux API: ${error.message || 'Unknown error'}` }),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  }
};

export { handler };