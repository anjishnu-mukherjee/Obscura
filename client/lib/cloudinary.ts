// Cloudinary utility for image uploads
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  secureUrl: string;
}

/**
 * Upload an image from ArrayBuffer to Cloudinary
 * @param arrayBuffer - The image data as ArrayBuffer
 * @param fileName - Optional filename for the upload
 * @param folder - Optional folder path in Cloudinary
 * @returns Promise with upload result
 */
export const uploadImageFromArrayBuffer = async (
  arrayBuffer: ArrayBuffer,
  fileName?: string,
  folder: string = 'obscura/maps'
): Promise<CloudinaryUploadResult> => {
  try {
    console.log('Uploading image to Cloudinary...');
    
    // Convert ArrayBuffer to base64
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const dataURI = `data:image/png;base64,${base64Image}`;
    
    // Upload to Cloudinary
    const uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      cloudinary.uploader.upload(
        dataURI,
        {
          folder: folder,
          public_id: fileName ? `${folder}/${fileName}` : undefined,
          resource_type: 'image',
          format: 'png',
          transformation: [
            { quality: 'auto:good' }, // Optimize quality
            { fetch_format: 'auto' }  // Auto-format
          ]
        },
        (error: any, result: any) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(new Error(`Failed to upload image: ${error.message}`));
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              secureUrl: result.secure_url
            });
          } else {
            reject(new Error('No result from Cloudinary upload'));
          }
        }
      );
    });
    
    console.log('Image uploaded successfully:', uploadResult.url);
    return uploadResult;
    
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
};

/**
 * Delete an image from Cloudinary
 * @param publicId - The public ID of the image to delete
 * @returns Promise with deletion result
 */
export const deleteImageFromCloudinary = async (publicId: string): Promise<boolean> => {
  try {
    console.log('Deleting image from Cloudinary:', publicId);
    
    const result = await new Promise<boolean>((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error: any, result: any) => {
        if (error) {
          console.error('Cloudinary delete error:', error);
          reject(new Error(`Failed to delete image: ${error.message}`));
        } else {
          console.log('Image deleted successfully');
          resolve(true);
        }
      });
    });
    
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

/**
 * Upload an audio file from ArrayBuffer to Cloudinary
 * @param arrayBuffer - The audio data as ArrayBuffer
 * @param fileName - Optional filename for the upload
 * @param folder - Optional folder path in Cloudinary
 * @returns Promise with upload result
 */
export const uploadAudioFromArrayBuffer = async (
  arrayBuffer: ArrayBuffer,
  fileName?: string,
  folder: string = 'obscura/audio'
): Promise<CloudinaryUploadResult> => {
  try {
    console.log('Uploading audio to Cloudinary...');
    
    // Convert ArrayBuffer to base64
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString('base64');
    const dataURI = `data:audio/wav;base64,${base64Audio}`;
    
    // Upload to Cloudinary
    const uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      cloudinary.uploader.upload(
        dataURI,
        {
          folder: folder,
          public_id: fileName ? fileName : undefined,
          resource_type: 'raw', // Use 'raw' for audio files instead of 'video'
          // Don't specify format for raw uploads, let Cloudinary detect
        },
        (error: any, result: any) => {
          if (error) {
            console.error('Cloudinary audio upload error:', error);
            reject(new Error(`Failed to upload audio: ${error.message}`));
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              secureUrl: result.secure_url
            });
          } else {
            reject(new Error('No result from Cloudinary audio upload'));
          }
        }
      );
    });
    
    console.log('Audio uploaded successfully:', uploadResult.url);
    return uploadResult;
    
  } catch (error) {
    console.error('Error uploading audio to Cloudinary:', error);
    throw error;
  }
};

/**
 * Generate a unique filename for map images
 * @param caseId - The case ID
 * @param timestamp - Optional timestamp
 * @returns Unique filename
 */
export const generateMapFileName = (caseId: string, timestamp?: number): string => {
  const ts = timestamp || Date.now();
  return `map_${caseId}_${ts}`;
}; 