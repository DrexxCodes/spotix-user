import dotenv from "dotenv"
import Mailjet from "node-mailjet"

// Configure dotenv
dotenv.config()

// Initialize Mailjet with environment variables
const mailjet = Mailjet.apiConnect(process.env.MJ_APIKEY_PUBLIC, process.env.MJ_APIKEY_PRIVATE)

export default async function notifyRoutes(fastify, options) {
  // Route: Team member added
  fastify.post("/team-member-added", async (request, reply) => {
    try {
      const { collaborationId, eventId, bookerId, userRole, eventName, bookerName, username, email, recipientName } =
        request.body

      if (!collaborationId || !eventId || !bookerId || !userRole || !eventName || !bookerName || !username || !email) {
        return reply.code(400).send({
          success: false,
          message: "Missing required fields for team member notification",
        })
      }

      await mailjet.post("send", { version: "v3.1" }).request({
        Messages: [
          {
            From: { Email: "teams@spotix.com.ng", Name: "Spotix Teams" },
            To: [{ Email: email, Name: recipientName || username }],
            TemplateID: 6986222,
            TemplateLanguage: true,
            Subject: "You've been added to a Spotix event team",
            Variables: {
              collab_id: collaborationId,
              event_id: eventId,
              booker_id: bookerId,
              UserRole: userRole,
              eventname: eventName,
              bookername: bookerName,
              username: username,
            },
          },
        ],
      })

      return {
        success: true,
        message: "Team member notification sent successfully",
      }
    } catch (error) {
      fastify.log.error("Error sending team member notification:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to send team member notification",
        error: error.message,
      })
    }
  })

  // Route: Agent onboarding
  fastify.post("/agent-onboard", async (request, reply) => {
    try {
      const { email, name, agent_id, username } = request.body

      if (!email || !agent_id) {
        return reply.code(400).send({
          success: false,
          message: "Missing required fields for agent notification",
        })
      }

      await mailjet.post("send", { version: "v3.1" }).request({
        Messages: [
          {
            From: { Email: "agent@spotix.com.ng", Name: "Spotix" },
            To: [{ Email: email, Name: name || username || "Spotix Agent" }],
            TemplateID: 6989783,
            TemplateLanguage: true,
            Subject: "Howdy! You're an agent",
            Variables: {
              year: new Date().getFullYear().toString(),
              agent_id: agent_id,
              username: username || name || "Agent",
            },
          },
        ],
      })

      console.log("Agent onboarding email sent successfully to:", email)

      return {
        success: true,
        message: "Agent notification sent successfully",
      }
    } catch (error) {
      fastify.log.error("Error sending agent notification:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to send agent notification",
        error: error.message,
      })
    }
  })

  // Route: Agent ticket purchase notification
  fastify.post("/agent-ticket", async (request, reply) => {
    try {
      const {
        email,
        name,
        agent_ID,
        agent_name,
        payment_method,
        ticket_price,
        booker_email,
        ticket_type,
        payment_ref,
        event_name,
        event_host,
        ticket_ID,
        year,
      } = request.body

      if (!email || !ticket_ID || !event_name) {
        return reply.code(400).send({
          success: false,
          message: "Missing required fields for ticket notification",
        })
      }

      await mailjet.post("send", { version: "v3.1" }).request({
        Messages: [
          {
            From: { Email: "tickets@spotix.com.ng", Name: "Spotix Tickets" },
            To: [{ Email: email, Name: name || "Valued Customer" }],
            TemplateID: 6989847,
            TemplateLanguage: true,
            Subject: "Our Agent has sold you a ticket",
            Variables: {
              year: year || new Date().getFullYear().toString(),
              agent_ID,
              agent_name,
              payment_method: payment_method || "Agent Wallet",
              ticket_price,
              booker_email: booker_email || "support@spotix.com.ng",
              ticket_type,
              payment_ref,
              event_name,
              event_host,
              ticket_ID,
              name: name || "Valued Customer",
              email,
            },
          },
        ],
      })

      console.log("Agent ticket email sent successfully to:", email)

      return {
        success: true,
        message: "Ticket notification sent successfully",
      }
    } catch (error) {
      fastify.log.error("Error sending ticket notification:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to send ticket notification",
        error: error.message,
      })
    }
  })

  // ✅ Route: Agent sale notification
  fastify.post("/agent-sale", async (request, reply) => {
    try {
      const { agent_email, agent_name, customer_email, customer_name, price, ticket_type, event_name, year } =
        request.body

      if (!agent_email || !customer_email || !event_name) {
        return reply.code(400).send({
          success: false,
          message: "Missing required fields for agent sale notification",
        })
      }

      await mailjet.post("send", { version: "v3.1" }).request({
        Messages: [
          {
            From: { Email: "agent@spotix.com.ng", Name: "Spotix" },
            To: [{ Email: agent_email, Name: agent_name || "Spotix Agent" }],
            TemplateID: 6989769,
            TemplateLanguage: true,
            Subject: "You have completed a sale",
            Variables: {
              year: year || new Date().getFullYear().toString(),
              customer_email,
              customer_name,
              price,
              ticket_type,
              event_name,
              agent_name: agent_name || "Agent",
            },
          },
        ],
      })

      console.log("Agent sale notification sent successfully to:", agent_email)

      return {
        success: true,
        message: "Agent sale notification sent successfully",
      }
    } catch (error) {
      fastify.log.error("Error sending agent sale notification:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to send agent sale notification",
        error: error.message,
      })
    }
  })

  // 🆕 Route: New refund request notification
  fastify.post("/refund-request", async (request, reply) => {
    try {
      const {
        refundId,
        userEmail,
        userName,
        eventName,
        ticketType,
        ticketPrice,
        refundReason,
        customReason,
        moreInformation,
        ticketReference,
        requestDate,
        requestTime,
      } = request.body

      if (!refundId || !userEmail || !eventName || !ticketPrice) {
        return reply.code(400).send({
          success: false,
          message: "Missing required fields for refund notification",
        })
      }

      // Send notification my email
      await mailjet.post("send", { version: "v3.1" }).request({
        Messages: [
          {
            From: { Email: "tickets@spotix.com.ng", Name: "Spotix Alert" },
            To: [{ Email: "mo22445boss@gmail.com", Name: "Spotix Admin" }],
            TemplateID: 7053759, 
            TemplateLanguage: true,
            Subject: "New Refund Request",
            Variables: {
              refund_id: refundId,
              user_email: userEmail,
              user_name: userName || "User",
              event_name: eventName,
              ticket_type: ticketType || "Standard",
              ticket_price: `NGN ${ticketPrice.toLocaleString()}`,
              refund_reason: customReason || refundReason,
              additional_info: moreInformation || "None provided",
              ticket_reference: ticketReference || "N/A",
              request_date: requestDate || new Date().toLocaleDateString(),
              request_time: requestTime || new Date().toLocaleTimeString(),
              year: new Date().getFullYear().toString(),
            },
          },
        ],
      })

      console.log("Refund request notification sent successfully for refund ID:", refundId)

      return {
        success: true,
        message: "Refund notification sent successfully",
      }
    } catch (error) {
      fastify.log.error("Error sending refund notification:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to send refund notification",
        error: error.message,
      })
    }
  })
}
