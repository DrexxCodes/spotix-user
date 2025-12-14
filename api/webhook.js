// Convert to Fastify plugin
import crypto from "crypto"
import admin from "firebase-admin"

// Fastify plugin
export default async function webhookRoute(fastify, options) {
  // Paystack Secret Key
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

  // Initialize Firebase Admin if not already initialized
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
      // Removed databaseURL as it's not needed for Firestore
    })
  }

  const db = admin.firestore()

  fastify.post("/webhook", async (request, reply) => {
    const signature = request.headers["x-paystack-signature"]

    // Verify the webhook signature
    const hash = crypto.createHmac("sha512", PAYSTACK_SECRET_KEY).update(JSON.stringify(request.body)).digest("hex")

    if (hash !== signature) {
      return reply.code(401).send({ error: "Invalid signature" })
    }

    // Process the webhook event
    const event = request.body

    try {
      // Handle different event types
      switch (event.event) {
        case "charge.success":
          await handleSuccessfulPayment(event.data)
          break

        case "transfer.success":
          // Handle successful transfer
          console.log("Successful transfer:", event.data)
          break

        // Add more event handlers as needed
      }

      return { status: "success" }
    } catch (error) {
      fastify.log.error("Webhook processing error:", error)
      return reply.code(500).send({ error: "Failed to process webhook" })
    }
  })

  async function handleSuccessfulPayment(data) {
    try {
      // Extract metadata from the payment
      const { metadata } = data

      if (!metadata || !metadata.userId || !metadata.eventId || !metadata.eventCreatorId || !metadata.ticketType) {
        console.error("Missing required metadata in payment")
        return
      }

      const { userId, eventId, eventCreatorId, ticketType } = metadata

      // Generate ticket ID
      const ticketId = generateTicketId()
      const ticketReference = data.reference

      // Get current date and time
      const now = new Date()
      const purchaseDate = now.toLocaleDateString()
      const purchaseTime = now.toLocaleTimeString()

      // Get user data
      const userDoc = await db.collection("users").doc(userId).get()

      if (!userDoc.exists) {
        console.error("User not found")
        return
      }

      const userData = userDoc.data()

      // Add to attendees collection for the event
      await db
        .collection("events")
        .doc(eventCreatorId)
        .collection("userEvents")
        .doc(eventId)
        .collection("attendees")
        .add({
          uid: userId,
          fullName: userData.fullName || "",
          email: userData.email || "",
          ticketType: ticketType,
          ticketId,
          ticketReference,
          purchaseDate,
          purchaseTime,
          verified: false,
        })

      // Add to user's ticket history
      await db
        .collection("TicketHistory")
        .doc(userId)
        .collection("tickets")
        .add({
          eventId,
          eventName: metadata.eventName || "Event",
          ticketType,
          ticketPrice: data.amount / 100, // Convert from kobo to naira
          ticketId,
          ticketReference,
          purchaseDate,
          purchaseTime,
          verified: false,
          paymentMethod: "Paystack",
          eventCreatorId,
        })

      // Update event stats
      const eventDoc = await db.collection("events").doc(eventCreatorId).collection("userEvents").doc(eventId).get()

      if (eventDoc.exists) {
        const eventData = eventDoc.data()
        await db
          .collection("events")
          .doc(eventCreatorId)
          .collection("userEvents")
          .doc(eventId)
          .update({
            ticketsSold: (eventData.ticketsSold || 0) + 1,
            totalRevenue: (eventData.totalRevenue || 0) + data.amount / 100, // Convert from kobo to naira
          })
      }

      console.log("Payment processed successfully via webhook")
    } catch (error) {
      console.error("Error handling successful payment:", error)
      throw error
    }
  }

  function generateTicketId() {
    const randomNumbers = Math.floor(10000000 + Math.random() * 90000000).toString()
    const randomLetters = Math.random().toString(36).substring(2, 4).toUpperCase()

    // Insert the random letters at random positions in the numbers
    const pos1 = Math.floor(Math.random() * 8)
    const pos2 = Math.floor(Math.random() * 7) + pos1 + 1

    const part1 = randomNumbers.substring(0, pos1)
    const part2 = randomNumbers.substring(pos1, pos2)
    const part3 = randomNumbers.substring(pos2)

    return `SPTX-TX-${part1}${randomLetters[0]}${part2}${randomLetters[1]}${part3}`
  }
}
