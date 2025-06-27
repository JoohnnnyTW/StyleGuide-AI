"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/flux-proxy.ts
var flux_proxy_exports = {};
__export(flux_proxy_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(flux_proxy_exports);
var FLUX_API_URL = "https://api.bfl.ai/v1/flux-kontext-pro";
var handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        // Or your specific domain in production
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
    };
  }
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed. Only POST requests are accepted." }),
      headers: { "Content-Type": "application/json" }
    };
  }
  const fluxApiKey = process.env.FLUX_API_KEY;
  if (!fluxApiKey) {
    console.error("FLUX_API_KEY is not set in Netlify environment variables.");
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Flux API key is not configured on the server." }),
      headers: { "Content-Type": "application/json" }
    };
  }
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const response = await fetch(FLUX_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-key": fluxApiKey,
        "Accept": "application/json"
      },
      body: JSON.stringify(body)
    });
    const responseData = await response.json().catch(async () => {
      const textData = await response.text();
      return { message: `Flux API returned non-JSON response (status ${response.status}): ${textData}` };
    });
    return {
      statusCode: response.status,
      body: JSON.stringify(responseData),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
        // CORS header for the actual response
      }
    };
  } catch (error) {
    console.error("Error proxying request to Flux API:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: `Error proxying to Flux API: ${error.message || "Unknown error"}` }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=flux-proxy.js.map
