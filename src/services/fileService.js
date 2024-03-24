import { nanoid } from 'nanoid';
import supabase from '../config/supabase.js';

export const imageUpload = async (folder, bucket, image) => {
  try {
    console.log(image.data);
    console.log(bucket);
    const getFileExtension = (filename) => filename.includes('.') ? filename.split('.').pop() : null;
    const imagePath = `project_image${nanoid(10)}.${getFileExtension(image.name)}`;

    const { data: imageData, error } = await supabase
      .storage
      .from(bucket)
      .upload(`${folder}/${imagePath}`, image.data, {
        upsert: false,
        request: {
          duplex: true,
        },
      });

    if (error) {
      console.error('Upload error:', JSON.stringify(error, null, 2)); // Improved error logging
      throw new Error(`Upload error: ${error.message}`);
    }

    const { data: imageUrl, error: urlError } = await supabase
      .storage
      .from(bucket)
      .getPublicUrl(`${folder}/${imagePath}`);

    if (urlError) {
      console.error('URL retrieval error:', JSON.stringify(urlError, null, 2)); // Improved error logging
      throw new Error(`URL retrieval error: ${urlError.message}`);
    }

    console.log(imageUrl);

    return imageUrl.publicUrl;

  } catch (err) {
    console.error('Function error:', err.message); // Ensures the actual error message is logged
    throw new Error(`Function error: ${err.message}`);
  }
};

export const getImageUrl = async (folder, bucket, image) => {
  const { data: imageUrl, error } = await supabase
    .storage
    .from(bucket)
    .getPublicUrl(`${folder}/${image}`);

  if (error) {
    console.error('Get Image URL error:', JSON.stringify(error, null, 2)); // Improved error logging
    throw new Error(`Get Image URL error: ${error.message}`);
  }

  return imageUrl.publicUrl;
}