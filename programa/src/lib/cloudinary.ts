import { v2 as cloudinary } from "cloudinary"

export async function subirImagen(buffer: Buffer, carpeta: string): Promise<string> {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: carpeta, resource_type: "image" },
      (error, result) => {
        if (error || !result) return reject(error)
        resolve(result.secure_url)
      }
    ).end(buffer)
  })
}