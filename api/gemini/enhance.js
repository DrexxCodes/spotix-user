// enhanceRoute.js
import { request } from 'undici'
import { z } from "zod"

const eventSchema = z.object({
  eventName: z.string().min(1, "Event name is required").max(100, "Event name too long"),
  eventDescription: z.string().min(10, "Event description must be at least 10 characters").max(500, "Event description too long"),
  eventDate: z.string().min(1, "Event date is required"),
  eventVenue: z.string().min(1, "Event venue is required").max(100, "Event venue too long"),
  eventType: z.string().min(1, "Event type is required").max(50, "Event type too long"),
})

export default async function enhanceRoute(fastify, options) {
  // Validate environment variables on startup
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error('HUGGINGFACE_API_KEY environment variable is required')
  }

  const HF_API_KEY = process.env.HUGGINGFACE_API_KEY
  const REQUEST_TIMEOUT = 30000 // 30 seconds for AI processing

  // Multiple model options (fallback strategy)
  const MODELS = [
    'microsoft/DialoGPT-medium',
    // 'google/flan-t5-base',
    'facebook/blenderbot-400M-distill',
    'microsoft/DialoGPT-small'
  ]

  // Helper function to make HuggingFace API calls
  async function callHuggingFaceAPI(prompt, modelIndex = 0) {
    if (modelIndex >= MODELS.length) {
      throw new Error('All models failed to respond')
    }

    const model = MODELS[modelIndex]
    const url = `https://api-inference.huggingface.co/models/${model}`
    
    try {
      const { statusCode, body } = await request(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Fastify-Enhancement-Service/1.0'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 300,
            min_length: 100,
            do_sample: true,
            temperature: 0.7,
            top_p: 0.9,
            repetition_penalty: 1.1
          },
          options: {
            wait_for_model: true,
            use_cache: false
          }
        }),
        bodyTimeout: REQUEST_TIMEOUT,
        headersTimeout: REQUEST_TIMEOUT,
      })

      const responseData = await body.json()

      // Handle different response formats
      if (statusCode === 503) {
        // Model is loading, try next model
        fastify.log.warn(`Model ${model} is loading, trying next model...`)
        return await callHuggingFaceAPI(prompt, modelIndex + 1)
      }

      if (statusCode === 404) {
        // Model not found, try next model
        fastify.log.warn(`Model ${model} not found, trying next model...`)
        return await callHuggingFaceAPI(prompt, modelIndex + 1)
      }

      if (statusCode !== 200) {
        fastify.log.error(`HuggingFace API error ${statusCode}:`, responseData)
        // Try next model on error
        return await callHuggingFaceAPI(prompt, modelIndex + 1)
      }

      // Handle different response structures
      let enhancedText = ''
      
      if (Array.isArray(responseData)) {
        enhancedText = responseData[0]?.generated_text || responseData[0]?.text || ''
      } else if (responseData.generated_text) {
        enhancedText = responseData.generated_text
      } else if (responseData.text) {
        enhancedText = responseData.text
      } else {
        throw new Error('Unexpected response format from AI model')
      }

      return {
        enhancedText: enhancedText.trim(),
        modelUsed: model,
        statusCode
      }

    } catch (error) {
      fastify.log.error(`Error with model ${model}:`, error.message)
      
      // If it's a timeout or connection error, try next model
      if (error.code === 'UND_ERR_CONNECT_TIMEOUT' || 
          error.code === 'UND_ERR_HEADERS_TIMEOUT' ||
          error.code === 'ECONNRESET') {
        return await callHuggingFaceAPI(prompt, modelIndex + 1)
      }
      
      throw error
    }
  }

  // Create optimized prompt
  function createPrompt(eventData) {
    const { eventName, eventDescription, eventDate, eventVenue, eventType } = eventData
    
    return `You are an expert event copywriter. Create a captivating and professional event description for the following event:

Event: ${eventName}
Type: ${eventType}
Date: ${eventDate}
Venue: ${eventVenue}

Original: ${eventDescription}

Please enhance this description to make it more engaging, professional, and appealing to potential attendees.
      The enhanced description should:
      1. Be approximately 150-250 words
      2. Highlight the unique aspects of the event
      3. Create excitement and urgency
      4. Include relevant details about what attendees can expect
      5. Use professional but engaging language
      6. Maintain the core information from the original description
      
      Return only the enhanced description text without any additional commentary or formatting.

Enhanced professional description:`
  }

  // Main enhance endpoint
  fastify.post("/enhance", {
    schema: {
      body: {
        type: 'object',
        required: ['eventName', 'eventDescription', 'eventDate', 'eventVenue', 'eventType'],
        properties: {
          eventName: { type: 'string', minLength: 1, maxLength: 100 },
          eventDescription: { type: 'string', minLength: 10, maxLength: 500 },
          eventDate: { type: 'string', minLength: 1 },
          eventVenue: { type: 'string', minLength: 1, maxLength: 100 },
          eventType: { type: 'string', minLength: 1, maxLength: 50 }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        // Log incoming request
        request.log.info("Enhancement request received", {
          eventName: request.body.eventName,
          eventType: request.body.eventType
        })

        // Validate request body using Zod (double validation for extra safety)
        const validation = eventSchema.safeParse(request.body)

        if (!validation.success) {
          request.log.warn("Validation failed:", validation.error.errors)
          return reply.code(400).send({
            error: "Validation failed",
            issues: validation.error.errors.map(e => ({
              field: e.path[0],
              message: e.message,
            })),
          })
        }

        const validatedData = validation.data
        const prompt = createPrompt(validatedData)

        // Log the attempt
        request.log.info("Calling HuggingFace API for enhancement...")
        request.log.debug("Prompt length:", prompt.length)

        // Call HuggingFace API with fallback models
        const result = await callHuggingFaceAPI(prompt)

        // Clean up the response
        let enhancedDescription = result.enhancedText

        // Remove the original prompt from the response if it was included
        if (enhancedDescription.includes('Enhanced professional description:')) {
          enhancedDescription = enhancedDescription.split('Enhanced professional description:')[1]?.trim() || enhancedDescription
        }

        // Ensure minimum quality
        if (enhancedDescription.length < 50) {
          enhancedDescription = `${validatedData.eventDescription} This exciting ${validatedData.eventType.toLowerCase()} event promises to be an unforgettable experience for all attendees.`
        }

        request.log.info("Enhancement completed successfully", {
          modelUsed: result.modelUsed,
          originalLength: validatedData.eventDescription.length,
          enhancedLength: enhancedDescription.length
        })

        return reply.send({
          success: true,
          enhancedDescription,
          metadata: {
            modelUsed: result.modelUsed,
            originalLength: validatedData.eventDescription.length,
            enhancedLength: enhancedDescription.length,
            timestamp: new Date().toISOString()
          }
        })

      } catch (error) {
        request.log.error("Enhancement error:", {
          error: error.message,
          stack: error.stack
        })

        // Provide fallback enhancement
        const fallbackEnhancement = `${request.body.eventDescription} Join us for this amazing ${request.body.eventType.toLowerCase()} at ${request.body.eventVenue} on ${request.body.eventDate}. This event promises to deliver an exceptional experience with engaging activities and memorable moments for all participants.`

        return reply.code(200).send({
          success: false,
          enhancedDescription: fallbackEnhancement,
          error: "AI enhancement temporarily unavailable, fallback used",
          metadata: {
            fallbackUsed: true,
            timestamp: new Date().toISOString()
          }
        })
      }
    }
  })

  // Test endpoint to check API connectivity
  fastify.get("/enhance/test", async (request, reply) => {
    try {
      const testPrompt = "Enhance this text: Test event for connectivity check."
      const result = await callHuggingFaceAPI(testPrompt)
      
      return reply.send({
        status: 'connected',
        modelUsed: result.modelUsed,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      return reply.code(503).send({
        status: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
  })

  // Health check for enhancement service
  fastify.get("/enhance/health", async (request, reply) => {
    const hasApiKey = !!process.env.HUGGINGFACE_API_KEY
    
    return reply.send({
      status: hasApiKey ? 'ready' : 'misconfigured',
      apiKeyConfigured: hasApiKey,
      availableModels: MODELS.length,
      timestamp: new Date().toISOString()
    })
  })
}