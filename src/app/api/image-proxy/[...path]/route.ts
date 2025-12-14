import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = params.path
    if (!path || path.length === 0) {
      return new NextResponse("Invalid path", { status: 400 })
    }

    // Get the original image URL from query params
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get("url")
    const eventName = searchParams.get("name")

    if (!imageUrl) {
      return new NextResponse("Missing image URL", { status: 400 })
    }

    let finalImageUrl = imageUrl

    // Check if it's a Cloudinary URL and add transformations
    if (imageUrl.includes("cloudinary.com")) {
      // Extract the public ID from the Cloudinary URL
      const urlParts = imageUrl.split("/")
      const uploadIndex = urlParts.findIndex((part) => part === "upload")

      if (uploadIndex !== -1) {
        // Insert transformations after "upload/"
        const beforeUpload = urlParts.slice(0, uploadIndex + 1)
        const afterUpload = urlParts.slice(uploadIndex + 1)

        // Cloudinary transformations for watermarking
        const transformations = [
        //   "c_fill,w_1200,h_630",
            "e_shadow:30", // Lighter shadow
          "q_auto,f_auto", // Auto quality and format
        ]

        finalImageUrl = [...beforeUpload, transformations.join(","), ...afterUpload].join("/")
      }
    }

    // Fetch the image
    const response = await fetch(finalImageUrl)

    if (!response.ok) {
      return new NextResponse("Failed to fetch image", { status: 404 })
    }

    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get("content-type") || "image/jpeg"

    // Set headers for the proxied image
    const headers = new Headers()
    headers.set("Content-Type", contentType)
    headers.set("Cache-Control", "public, max-age=86400") // Cache for 24 hours

    if (eventName) {
      const sanitizedEventName = eventName.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-")
      headers.set("Content-Disposition", `inline; filename="${sanitizedEventName}.jpg"`)
    } else {
      headers.set("Content-Disposition", `inline; filename="Spotix-Event-Image.jpg"`)
    }

    return new NextResponse(imageBuffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("Error proxying image:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
