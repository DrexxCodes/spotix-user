// enhanceRoute.js
import axios from "axios"
import { z } from "zod"

const eventSchema = z.object({
  eventName: z.string().min(1, "Event name is required"),
  eventDescription: z.string().min(1, "Event description is required"),
  eventDate: z.string().min(1, "Event date is required"),
  eventVenue: z.string().min(1, "Event venue is required"),
  eventType: z.string().min(1, "Event type is required"),
})

export default async function enhanceRoute(fastify, options) {
  fastify.post("/enhance", async (request, reply) => {
    try {
      // Validate request body using Zod
      const validation = eventSchema.safeParse(request.body)

      if (!validation.success) {
        return reply.code(400).send({
          error: "Validation failed",
          issues: validation.error.errors.map(e => ({
            field: e.path[0],
            message: e.message,
          })),
        })
      }

      const { eventName, eventDescription, eventDate, eventVenue, eventType } = validation.data

      const prompt = `
You are a professional event copywriter. Rewrite the following event description to make it more professional, exciting, and engaging. Include key details and help potential attendees understand why they should attend. Keep it around 150–250 words.

Event Name: ${eventName}
Event Type: ${eventType}
Event Date: ${eventDate}
Event Venue: ${eventVenue}
Original Description: "${eventDescription}"

Enhanced Description:
      `

      const hfResponse = await axios.post(
        "https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct",
        {
          inputs: prompt,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 20000, // optional: 20s timeout for slow models
        }
      )

      if (hfResponse.data?.error) {
        throw new Error(hfResponse.data.error)
      }

      const enhancedText = hfResponse.data[0]?.generated_text || "No enhancement was generated."

      return reply.send({ enhancedDescription: enhancedText })
    } catch (error) {
      request.log.error("Enhancement error:", error)
      return reply.code(500).send({
        error: "Failed to enhance event description",
        message: error?.message || "Unknown error",
      })
    }
  })
}




// npm install @fastify/env
// npm install @fastify/axios
// npm install @fastify/plugin
// npm install @huggingface/inference --save
// npm install @huggingface/hub --save
// npm install @huggingface/node-hub --save
// npm install dotenv
// npm install @huggingface/inference --save
// npm install @huggingface/transformers --save
