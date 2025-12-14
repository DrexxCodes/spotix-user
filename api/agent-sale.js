import dotenv from "dotenv"
import Mailjet from "node-mailjet"

// Configure dotenv
dotenv.config()

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" })
  }

  try {
    const { agent_email, agent_name, customer_email, customer_name, price, ticket_type, event_name, year } = req.body

    // Validate required fields
    if (!agent_email || !customer_email || !event_name) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields for agent sale notification",
      })
    }

    // Initialize Mailjet with environment variables
    const mailjet = Mailjet.apiConnect(process.env.MJ_APIKEY_PUBLIC, process.env.MJ_APIKEY_PRIVATE)

    // Send email using Mailjet
    const response = await mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: "agent@spotix.com.ng",
            Name: "Spotix",
          },
          To: [
            {
              Email: agent_email,
              Name: agent_name || "Spotix Agent",
            },
          ],
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

    console.log("Agent sale notification email sent successfully to:", agent_email)

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Agent sale notification sent successfully",
    })
  } catch (error) {
    console.error("Error sending agent sale notification:", error)

    // Return error response
    return res.status(500).json({
      success: false,
      message: "Failed to send agent sale notification",
      error: error.message,
    })
  }
}
