import { requestQueue } from './request-queue.js';

// Cache for storing responses
const responseCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Rate limit handling
const MAX_RETRIES = 5;
const INITIAL_BACKOFF = 1000; // 1 second
const MAX_BACKOFF = 30000; // 30 seconds

/**
 * Sends a question to the LLM and gets a response
 * @param {string} prompt - The prompt to send to the LLM
 * @param {Object} context - The context for the request
 * @returns {Promise<string>} The LLM's response
 */
export async function askLLM(prompt, context = {}) {
    let retryCount = 0;
    let lastError = null;

    while (retryCount < MAX_RETRIES) {
        try {
            const systemMessage = context.systemMessage || 'You are a helpful assistant.';
            
            // Create a cache key based on prompt and context
            const cacheKey = JSON.stringify({ prompt, systemMessage, type: context.type });
            
            // Check cache first
            const cachedResponse = responseCache.get(cacheKey);
            if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
                console.log('[askLLM] Using cached response');
                return cachedResponse.response;
            }

            // Make the request through the queue
            const response = await requestQueue.enqueue(async () => {
                const response = await fetch('/.netlify/functions/ask-llm', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        prompt,
                        context: {
                            systemMessage,
                            type: context.type || 'general'
                        }
                    })
                });

                if (!response.ok) {
                    const error = new Error(`LLM API error: ${response.status} ${response.statusText}`);
                    error.status = response.status;
                    error.headers = response.headers;
                    
                    // Try to parse error details
                    try {
                        const errorData = await response.json();
                        error.details = errorData;
                    } catch (e) {
                        error.details = await response.text();
                    }
                    
                    throw error;
                }

                return response;
            });

            const data = await response.json();
            
            if (!data.response) {
                console.error('Invalid LLM response:', data);
                throw new Error('Invalid response from LLM API');
            }

            // Clean up the response
            let cleanedResponse = data.response.trim();
            
            // Remove any markdown code block markers
            cleanedResponse = cleanedResponse.replace(/```json\n?|\n?```/g, '');
            
            // Remove any leading/trailing whitespace
            cleanedResponse = cleanedResponse.trim();

            // Cache the response
            responseCache.set(cacheKey, {
                response: cleanedResponse,
                timestamp: Date.now()
            });

            // Log rate limit information if available
            if (data.rateLimit) {
                console.log('[askLLM] Rate limit info:', data.rateLimit);
            }

            return cleanedResponse;
        } catch (error) {
            lastError = error;
            console.error(`[askLLM] Error (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);

            if (error.status === 429) {
                // Get retry delay from headers or calculate exponential backoff
                let retryDelay = INITIAL_BACKOFF * Math.pow(2, retryCount);
                
                // If we have a Retry-After header, use that instead
                if (error.headers?.get('Retry-After')) {
                    retryDelay = parseInt(error.headers.get('Retry-After'), 10) * 1000;
                }
                
                // Cap the delay at MAX_BACKOFF
                retryDelay = Math.min(retryDelay, MAX_BACKOFF);
                
                console.log(`[askLLM] Rate limited. Waiting ${retryDelay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                retryCount++;
                continue;
            }

            // For other errors, throw immediately
            throw error;
        }
    }

    // If we've exhausted all retries, throw the last error
    throw new Error(`LLM request failed after ${MAX_RETRIES} attempts: ${lastError.message}`);
} 