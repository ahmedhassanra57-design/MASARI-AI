import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 })
    }

    // Option 1: Use Cloudinary (recommended for production)
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const cloudinary = require('cloudinary').v2
      
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      })

      // Convert file to buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: "image",
            folder: "receipts",
            public_id: `receipt_${session.user.id}_${Date.now()}`,
          },
          (error: any, result: any) => {
            if (error) reject(error)
            else resolve(result)
          }
        ).end(buffer)
      })

      return NextResponse.json({
        success: true,
        url: (result as any).secure_url,
        publicId: (result as any).public_id
      })
    }

    // Option 2: Local storage (for development)
    else {
      console.log("Using local storage for image upload")
      const fs = require('fs')
      const path = require('path')
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'receipts')
      console.log("Upload directory:", uploadsDir)
      
      if (!fs.existsSync(uploadsDir)) {
        console.log("Creating uploads directory...")
        fs.mkdirSync(uploadsDir, { recursive: true })
      }

      // Generate unique filename
      const fileName = `receipt_${session.user.id}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const filePath = path.join(uploadsDir, fileName)
      console.log("Saving file to:", filePath)

      // Save file
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      fs.writeFileSync(filePath, buffer)
      
      console.log("File saved successfully, size:", buffer.length, "bytes")

      const url = `/uploads/receipts/${fileName}`
      console.log("Generated URL:", url)
      
      return NextResponse.json({
        success: true,
        url,
        fileName
      })
    }

  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ 
      error: "Failed to upload image",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 