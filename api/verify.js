// api/verify.js
import fetch from "node-fetch"

export default async function verifyRoute(fastify, options) {
  fastify.get("/verify", async (request, reply) => {
    const { accountNumber, bankName } = request.query || {}

    if (!accountNumber || !bankName) {
      return reply.code(400).send({ status: false, message: "Account number and bank name are required" })
    }

    const bankCodes = {
      "Opay": "999992",
      "Palmpay": "999991",
      "Moniepoint": "50515",
      "Kuda": "50515",
      "First Bank": "011",
      "Access Bank": "044",
      "GT Bank": "058",
      "UBA": "033",
      "Zenith Bank": "057",
      "Wema Bank": "035",
      "Sterling Bank": "232",
      "Fidelity Bank": "070",
      "Union Bank": "032",
      "Stanbic IBTC": "221",
      "Ecobank": "050",
    }

    const bankCode = bankCodes[bankName]
    if (!bankCode) {
      return reply.code(400).send({ status: false, message: "Invalid bank name" })
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      console.error("Paystack secret key is missing")
      return reply.code(500).send({ status: false, message: "Internal server error" })
    }

    try {
      const url = `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json()

      if (data.status === true) {
        return reply.send({ status: true, account_name: data.data.account_name })
      } else {
        return reply.code(400).send({ status: false, message: data.message || "Account verification failed" })
      }
    } catch (error) {
      console.error("Error from Paystack API:", error)
      return reply.code(500).send({ status: false, message: "Failed to verify account" })
    }
  })
}
