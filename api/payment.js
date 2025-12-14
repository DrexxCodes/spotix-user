// Optimized payment route using undici for better performance
import { request } from 'undici'

// Fastify plugin with optimizations and cold start handling
export default async function paymentRoute(fastify, options) {
  // Paystack Secret Key
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
  const APP_URL = process.env.APP_URL

  // Validate environment variables on startup
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY environment variable is required')
  }

  // Track server start time for cold start detection
  let serverStartTime = Date.now()
  
  // Helper to detect if we might be in a cold start scenario
  function isPotentialColdStart() {
    return (Date.now() - serverStartTime) < 60000 // First minute after start
  }

  // Common headers for Paystack requests
  const commonHeaders = {
    'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Fastify-Payment-Service/1.0'
  }

  // Request timeout configuration (in milliseconds)
  const REQUEST_TIMEOUT = 15000 // 15 seconds for Paystack API calls
  const COLD_START_TIMEOUT = 45000 // 45 seconds for cold start scenarios

  // Helper function for making Paystack API calls with cold start detection
  async function makePaystackRequest(path, method = 'GET', body = null, isColdStart = false) {
    const url = `https://api.paystack.co${path}`
    
    // Use longer timeout for potential cold starts
    const timeout = isColdStart ? COLD_START_TIMEOUT : REQUEST_TIMEOUT
    
    const requestOptions = {
      method,
      headers: commonHeaders,
      bodyTimeout: timeout,
      headersTimeout: timeout,
    }

    if (body) {
      requestOptions.body = JSON.stringify(body)
    }

    try {
      const { statusCode, body: responseBody } = await request(url, requestOptions)
      const data = await responseBody.json()
      
      return {
        statusCode,
        data
      }
    } catch (error) {
      // Handle timeout and network errors
      if (error.code === 'UND_ERR_CONNECT_TIMEOUT' || error.code === 'UND_ERR_HEADERS_TIMEOUT') {
        throw new Error('Payment service timeout - please try again')
      }
      throw error
    }
  }

  // Input validation schema
  const initializePaymentSchema = {
    body: {
      type: 'object',
      required: ['amount', 'email'],
      properties: {
        amount: { 
          type: 'number', 
          minimum: 1,
          maximum: 10000000 // 100,000 NGN max
        },
        email: { 
          type: 'string', 
          format: 'email',
          maxLength: 254
        },
        metadata: { 
          type: 'object'
        }
      }
    }
  }

  const verifyPaymentSchema = {
    querystring: {
      type: 'object',
      required: ['reference'],
      properties: {
        reference: { 
          type: 'string',
          minLength: 1,
          maxLength: 100,
          pattern: '^[a-zA-Z0-9_-]+$'
        }
      }
    }
  }

  // Initialize payment endpoint
  fastify.post("/payment", {
    schema: initializePaymentSchema,
    handler: async (request, reply) => {
      const { amount, email, metadata } = request.body

      try {
        const paymentData = {
          email,
          amount: Math.round(amount * 100), // Convert to kobo
          callback_url: `${APP_URL}/paystack-success`,
        }

        // Only add metadata if it exists and is not empty
        if (metadata && Object.keys(metadata).length > 0) {
          paymentData.metadata = metadata
        }

        const response = await makePaystackRequest(
          '/transaction/initialize',
          'POST',
          paymentData,
          isPotentialColdStart()
        )

        // Handle Paystack API errors
        if (response.statusCode !== 200) {
          fastify.log.error('Paystack API error:', response.data)
          return reply.code(response.statusCode).send({
            error: response.data.message || 'Payment initialization failed'
          })
        }

        // Return successful response
        return reply.code(200).send(response.data)

      } catch (error) {
        fastify.log.error("Payment initialization error:", error)
        
        // Return appropriate error based on error type
        if (error.message.includes('timeout')) {
          return reply.code(408).send({ 
            error: "Payment service timeout - please try again" 
          })
        }
        
        return reply.code(500).send({ 
          error: "Failed to initialize payment" 
        })
      }
    }
  })

  // Verify payment endpoint
  fastify.get("/payment/verify", {
    schema: verifyPaymentSchema,
    handler: async (request, reply) => {
      const { reference } = request.query

      try {
        const response = await makePaystackRequest(
          `/transaction/verify/${reference}`,
          'GET',
          null,
          isPotentialColdStart()
        )

        // Handle Paystack API errors
        if (response.statusCode !== 200) {
          fastify.log.error('Paystack verification error:', response.data)
          return reply.code(response.statusCode).send({
            error: response.data.message || 'Payment verification failed'
          })
        }

        return reply.code(200).send(response.data)

      } catch (error) {
        fastify.log.error("Payment verification error:", error)
        
        if (error.message.includes('timeout')) {
          return reply.code(408).send({ 
            error: "Payment verification timeout - please try again" 
          })
        }
        
        return reply.code(500).send({ 
          error: "Failed to verify payment" 
        })
      }
    }
  })

  // Keep-alive endpoint to prevent cold starts
  fastify.get("/payment/ping", async (request, reply) => {
    return reply.code(200).send({ 
      status: 'alive', 
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - serverStartTime) / 1000) + 's'
    })
  })

  // Health check endpoint for payment service
  fastify.get("/payment/health", async (request, reply) => {
    try {
      // Quick health check - just verify we can reach Paystack
      const start = Date.now()
      await makePaystackRequest('/transaction?perPage=1')
      const responseTime = Date.now() - start
      
      return reply.code(200).send({
        status: 'healthy',
        paystack: 'connected',
        responseTime: `${responseTime}ms`
      })
    } catch (error) {
      return reply.code(503).send({
        status: 'unhealthy',
        paystack: 'disconnected',
        error: error.message
      })
    }
  })
}