

import { GoogleGenAI } from "@google/genai";
import { Metadata } from "../components/VideoTranscriptionCard";

/**
 * Gets the appropriate API base URL for the current environment
 * In development, uses the Vite proxy. In production, uses the direct Google API URL.
 */
function getApiBaseUrl(): string {
    // Check if we're in development (Vite dev server)
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        return '/api/generativelanguage';
    }
    // In production, use the direct Google API URL
    return 'https://generativelanguage.googleapis.com';
}

/**
 * Polls the Gemini API to check the state of a file.
 * Resolves with the file metadata once the file state is 'ACTIVE'.
 * Rejects if the file state becomes 'FAILED'.
 * @param fileName The resource name of the file (e.g., "files/...")
 * @param apiKey Your Google AI API key.
 * @returns A promise that resolves with the active file metadata.
 */
async function pollFileState(fileName: string, apiKey: string): Promise<any> {
    const fileApiUrl = `${getApiBaseUrl()}/v1beta/${fileName}`;
    
    // This is a simplified polling loop. For a production app, you might want a timeout.
    // eslint-disable-next-line no-constant-condition
    while (true) {
        // Wait for 5 seconds before checking the status again.
        await new Promise(resolve => setTimeout(resolve, 5000)); 

        const getResponse = await fetch(fileApiUrl, {
            headers: {
                'x-goog-api-key': apiKey,
            }
        });
        if (!getResponse.ok) {
            console.error("Polling for file status failed:", await getResponse.text());
            // Continue polling, assuming it might be a transient network issue.
            continue; 
        }

        const responseData = await getResponse.json();
        // The file metadata is at the top level of the response for a get request.
        const fileMetadata = responseData; 
        
        if (fileMetadata?.state === 'ACTIVE') {
            return fileMetadata;
        } else if (fileMetadata?.state === 'FAILED') {
            const errorMessage = fileMetadata.error ? JSON.stringify(fileMetadata.error) : "Unknown error";
            throw new Error(`File processing failed. Error: ${errorMessage}`);
        }
        // If state is 'PROCESSING' or not yet present, continue the loop.
    }
}


/**
 * Uploads a file to the Gemini API using the resumable REST endpoint.
 * This is a more robust method for handling larger files.
 * @param file The file to upload.
 * @param apiKey Your Google AI API key.
 * @returns A promise that resolves with the file metadata once the file is 'ACTIVE'.
 */
async function uploadFileWithRest(file: File, apiKey: string): Promise<any> {
    // Step 1: Initiate a resumable upload to get a unique session URI.
    // This uses the /upload/ prefix and uploadType=resumable query parameter.
    const resumableInitResponse = await fetch(`${getApiBaseUrl()}/upload/v1beta/files?uploadType=resumable`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json; charset=UTF-8',
            'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
            file: {
                displayName: file.name,
                mimeType: file.type
            }
        }),
    });

    if (!resumableInitResponse.ok) {
        throw new Error(`Failed to initiate file upload session: ${await resumableInitResponse.text()}`);
    }

    const uploadUri = resumableInitResponse.headers.get('Location');
    if (!uploadUri) {
        throw new Error('Failed to get upload URI from server.');
    }

    // For large file uploads, use the original Google URI directly (not through proxy)
    // The CORS issue is typically only with the initial request, not the upload URI
    console.log('Original upload URI:', uploadUri);
    console.log('Using direct upload URI for large file');

    // Step 2: Upload the raw file bytes to the received session URI.
    console.log('Starting file upload, size:', file.size, 'bytes');
    
    let uploadResponse;
    try {
        uploadResponse = await fetch(uploadUri, {
            method: 'POST',
            headers: { 'Content-Type': file.type },
            body: file,
        });

        console.log('Upload response status:', uploadResponse.status);
        
        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('Upload failed with status:', uploadResponse.status, 'Error:', errorText);
            throw new Error(`Failed to upload file bytes (${uploadResponse.status}): ${errorText}`);
        }
    } catch (error) {
        console.error('Upload fetch error:', error);
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            throw new Error('Network error during file upload. This might be due to file size or network timeout.');
        }
        throw error;
    }

    // Step 3: The response from the upload contains the final file metadata.
    // The response is the File resource itself (not nested).
    const uploadedFileMetadata = await uploadResponse.json();
    console.log('Upload response:', uploadedFileMetadata);

    // Step 4: Poll the file's status until it's 'ACTIVE' and ready for use.
    if (uploadedFileMetadata?.state === 'ACTIVE') {
        return uploadedFileMetadata;
    }
    // If it's still processing, start polling.
    const fileName = uploadedFileMetadata.name || uploadedFileMetadata.file?.name;
    if (!fileName) {
        throw new Error('Failed to get file name from upload response');
    }
    return pollFileState(fileName, apiKey);
}


export const transcribeVideoStream = async (
  videoFile: File,
  metadata: Metadata,
  onChunk: (chunk: string) => void,
  onStatusChange: (status: 'preparing' | 'transcribing') => void,
  onProgress?: (progress: number) => void
): Promise<void> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("متغير البيئة API_KEY غير معين.");
  }
  
  onStatusChange('preparing'); // Status 'preparing' now means uploading and processing the file
  onProgress?.(0); // Start at 0%
  const ai = new GoogleGenAI({ apiKey });
  let uploadedFile; // To hold file metadata for potential cleanup

  try {
    // Use direct Google API calls with proper error handling
    onProgress?.(10); // 10% - Starting upload
    uploadedFile = await uploadFileWithRest(videoFile, apiKey);
    onProgress?.(50); // 50% - Upload complete, file processing

    onStatusChange('transcribing');
    onProgress?.(60); // 60% - Starting transcription

    // Step 2: Use the URI of the now-active file.
    const videoPart = {
      fileData: {
        mimeType: uploadedFile.mimeType,
        fileUri: uploadedFile.uri,
      },
    };
    
    const contextSentence = `الفيديو الحالي خاص بالمنهج التعليمي المصري. الصف الدراسي (وقد يتضمن الشعبة): "${metadata.grade}", المادة: "${metadata.subject}", الوحدة الدراسية: "${metadata.unit}".`;

    const textPart = {
      text: `أنت خدمة تفريغ صوتي خبيرة متخصصة في اللغة العربية والمناهج التعليمية المصرية.
${contextSentence}

مهامك هي:
1. قم بتفريغ الصوت المنطوق من الفيديو إلى نص باللغة العربية.
2. **هام للغاية: لا تقم بتضمين أي طوابع زمنية.** يجب أن يكون الناتج نصًا نظيفًا فقط.
3. **هام للغاية: تحديد وتصحيح أي أخطاء في التفريغ.** عندما تقوم بإجراء تصحيح، **يجب** عليك وضع الكلمة أو العبارة المصححة بين علامتي \`<u>\` و \`</u>\`. على سبيل المثال، إذا قال المتحدث شيئًا يبدو مثل "ذهبت إلى المسجد لي أصلي" ولكن السياق يشير إلى أنه قصد "ذهبت إلى المسجد <u>لأصلي</u>"، فيجب عليك إخراج "ذهبت إلى المسجد <u>لأصلي</u>".
4. قم بتوفير النص النهائي النظيف والمصحح فقط كبث مباشر (stream). لا تقم بإضافة أي تعليقات أو شروحات إضافية.
`,
    };
  
    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [videoPart, textPart] }],
    });
    
    let chunkCount = 0;
    for await (const chunk of response) {
      onChunk(chunk.text);
      chunkCount++;
      // Progress from 60% to 95% during streaming
      const streamProgress = Math.min(95, 60 + (chunkCount * 2));
      onProgress?.(streamProgress);
    }
    
    // Complete at 100%
    onProgress?.(100);
  } catch (error) {
    console.error("Gemini API Error:", error);

    // If an uploaded file resource exists and an error occurred, try to delete it via REST API.
    if (uploadedFile?.name) {
        try {
            await fetch(`${getApiBaseUrl()}/v1beta/${uploadedFile.name}`, {
                method: 'DELETE',
                headers: { 'x-goog-api-key': apiKey }
            });
            console.log(`Cleaned up failed upload: ${uploadedFile.displayName || uploadedFile.name}`);
        } catch (deleteError) {
            console.error(`Failed to delete orphaned file ${uploadedFile.name}:`, deleteError);
        }
    }

    const apiErrorMessage = error instanceof Error ? error.message : "حدث خطأ غير معروف.";
    if (apiErrorMessage.includes('finishReason: SAFETY')) {
        throw new Error("توقف التفريغ بسبب إعدادات السلامة. قد يكون المحتوى غير لائق.");
    }
    if (apiErrorMessage.includes('413') || apiErrorMessage.includes('Too Large')) {
         throw new Error("حجم ملف الفيديو كبير جدًا بالنسبة للطلب المباشر. حاول استخدام ملف أصغر.");
    }

    const userFriendlyMessage = `فشل الحصول على التفريغ من Gemini API. قد لا يتمكن النموذج من معالجة هذا الفيديو. السبب: ${apiErrorMessage}`;
    throw new Error(userFriendlyMessage);
  }
};