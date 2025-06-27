import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { Buffer } from "node:buffer";

const POLLING_INTERVAL_MS = 3000; // 3 seconds
const MAX_POLLING_ATTEMPTS = 10; // Max attempts, e.g., 10 * 3s = 30 seconds
const FLUX_API_URL = 'https://api.bfl.ai/v1/flux-kontext-max';

function getMimeTypeFromFluxOutputFormat(outputFormat?: string, fallback = 'image/png'): string {
  if (outputFormat === 'jpeg') return 'image/jpeg';
  if (outputFormat === 'png') return 'image/png';
  return fallback;
}

async function pollForResult(pollingUrl: string, apiKey: string, attempt = 1, requestedOutputFormat = 'png'): Promise<{ image_bytes: string; mime_type: string; }> {
  if (attempt > MAX_POLLING_ATTEMPTS) {
    console.error(`Flux Proxy: Polling timed out for URL: ${pollingUrl}`);
    throw new Error('Polling timed out for image generation.');
  }

  console.log(`Flux Proxy: Polling attempt ${attempt} for URL: ${pollingUrl}`);
  const pollResponse = await fetch(pollingUrl, {
    method: 'GET',
    headers: { 'x-key': apiKey },
  });

  const responseText = await pollResponse.text();
  console.log(`Flux Proxy: Polling attempt ${attempt}. Status: ${pollResponse.status}, Raw Text: ${responseText.substring(0, 300)}...`);

  if (!pollResponse.ok) {
    let errorDetail = `Flux API Polling Error (Status: ${pollResponse.status}): ${pollResponse.statusText}`;
    try {
        const errorJson = JSON.parse(responseText);
        errorDetail = errorJson.detail || errorJson.message || errorJson.error?.message || errorDetail;
    } catch (e) { /* Ignore if not JSON */ }
    console.error(`Flux Proxy: Polling attempt ${attempt} failed. Detail: ${errorDetail}`);
    throw new Error(errorDetail);
  }

  try {
    const pollData = JSON.parse(responseText);
    
    if (pollData.status && pollData.status.toLowerCase() === 'ready' && pollData.result && pollData.result.sample) {
      console.log(`Flux Proxy: Image URL found (attempt ${attempt}): ${pollData.result.sample}. Fetching...`);
      const imageResponse = await fetch(pollData.result.sample);
      if (!imageResponse.ok) throw new Error(`Failed to fetch image from sample URL (Status: ${imageResponse.status})`);
      const imageArrayBuffer = await imageResponse.arrayBuffer();
      const imageBuffer = Buffer.from(imageArrayBuffer);
      return {
        image_bytes: imageBuffer.toString('base64'),
        mime_type: getMimeTypeFromFluxOutputFormat(requestedOutputFormat),
      };
    } 
    else if (pollData.image_b64 && pollData.mime_type) { // Direct image data in polling response
       console.log(`Flux Proxy: Direct image data found in polling response (attempt ${attempt}).`);
       return { image_bytes: pollData.image_b64, mime_type: pollData.mime_type };
    }
    else if (pollData.status && ['processing', 'pending', 'queued'].includes(pollData.status.toLowerCase())) {
      console.log(`Flux Proxy: Polling attempt ${attempt} - Image still processing (status: ${pollData.status}). Retrying...`);
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
      return pollForResult(pollingUrl, apiKey, attempt + 1, requestedOutputFormat);
    } 
    else if (pollData.status && pollData.status.toLowerCase() === 'failed') {
      console.error('Flux Proxy: Image generation failed via polling.', pollData);
      const errorMessage = pollData.error_message || pollData.detail || (pollData.error ? JSON.stringify(pollData.error) : 'Image generation failed (status: failed).');
      throw new Error(errorMessage);
    }
    else if (typeof pollData === 'string' && (pollData.startsWith('http://') || pollData.startsWith('https://'))) { 
        console.log(`Flux Proxy: Polling returned direct image URL (attempt ${attempt}): ${pollData}. Fetching...`);
        const imageResponse = await fetch(pollData);
        if (!imageResponse.ok) throw new Error(`Failed to fetch image from direct URL (Status: ${imageResponse.status})`);
        const imageArrayBuffer = await imageResponse.arrayBuffer();
        const imageBuffer = Buffer.from(imageArrayBuffer);
        return {
          image_bytes: imageBuffer.toString('base64'),
          mime_type: getMimeTypeFromFluxOutputFormat(requestedOutputFormat),
        };
    }
    else {
      console.warn(`Flux Proxy: Polling attempt ${attempt} - Unexpected status or structure. Status: ${pollData.status}. Response:`, pollData, "Retrying...");
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
      return pollForResult(pollingUrl, apiKey, attempt + 1, requestedOutputFormat);
    }
  } catch (e: any) {
    console.error(`Flux Proxy: Error parsing JSON or during polling logic (attempt ${attempt}). Raw: "${responseText}". Error:`, e);
    throw new Error(`Failed to process polling response from Flux. Details: ${e.message}`);
  }
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ message: "Method Not Allowed" }),
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    };
  }

  const fluxApiKey = process.env.FLUX_API_KEY;

  if (!fluxApiKey) {
    console.error("FLUX_API_KEY is not set in Netlify environment variables.");
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Flux API key is not configured on the server." }),
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    };
  }

  try {
    const requestBody = JSON.parse(event.body || '{}');

    if (!requestBody.prompt) {
        return { 
          statusCode: 400, 
          body: JSON.stringify({ message: 'Prompt is required.' }),
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        };
    }
    
    console.log("Flux Proxy: Sending initial request with keys:", JSON.stringify(Object.keys(requestBody)));
    const initialBflResponse = await fetch(FLUX_API_URL, {
      method: 'POST',
      headers: { 
        'x-key': fluxApiKey, 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody) // Forward the entire body from the client
    });
    
    const initialResponseText = await initialBflResponse.text();
    console.log(`Flux Proxy: Initial response status: ${initialBflResponse.status}, Raw: ${initialResponseText.substring(0, 500)}`);

    if (!initialBflResponse.ok) {
      let errorDetail = `Flux API Error (Status: ${initialBflResponse.status}): ${initialBflResponse.statusText}`;
      try {
        const errorJson = JSON.parse(initialResponseText);
        errorDetail = errorJson.detail || errorJson.message || errorJson.error?.message || errorDetail;
      } catch (e) { /* Ignore if not a valid JSON error */ }
      console.error("Flux Proxy: Initial API request failed.", { status: initialBflResponse.status, detail: errorDetail });
      return { 
        statusCode: initialBflResponse.status, 
        body: JSON.stringify({ message: errorDetail }),
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      };
    }
    
    let initialData;
    try {
        initialData = JSON.parse(initialResponseText);
    } catch (e) {
        console.error("Flux Proxy: Failed to parse initial JSON. Raw:", initialResponseText, "Error:", e);
        return { 
          statusCode: 500, 
          body: JSON.stringify({ message: 'Flux API returned non-JSON.', details: initialResponseText.substring(0,200) }),
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        };
    }

    // Handle response: either poll or return direct image data
    let finalData;
    if (initialData.polling_url) {
      console.log(`Flux Proxy: Polling URL received: ${initialData.polling_url}. Starting poll...`);
      finalData = await pollForResult(initialData.polling_url, fluxApiKey, 1, requestBody.output_format);
    } else if (initialData.image_b64 && initialData.mime_type) {
      console.log("Flux Proxy: Direct image data in initial response.");
      finalData = { image_bytes: initialData.image_b64, mime_type: initialData.mime_type };
    } else {
      console.error("Flux Proxy: No polling_url or direct image in initial response.", initialData);
      return { 
        statusCode: 500, 
        body: JSON.stringify({ message: 'Failed to get polling URL or image data from Flux.', details: initialData }),
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      };
    }
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(finalData),
    };

  } catch (error: any) {
    console.error('Flux Proxy: Unhandled error in handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message || 'Internal server error in Flux proxy.' }),
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    };
  }
};

export { handler };
