

import { GoogleGenAI } from "@google/genai";
import { Metadata } from "../components/VideoTranscriptionCard";

/**
 * Gets the appropriate API base URL for the current environment
 * In development, uses the Vite proxy. In production, uses the direct Google API URL.
 */
function getApiBaseUrl(): string {
    // Always use the proxy endpoint for consistency
    return '/api/gemini-proxy';
}

/**
 * Makes a proxied request to the Gemini API
 */
async function makeGeminiRequest(path: string, options: RequestInit, apiKey: string): Promise<Response> {
    return fetch(getApiBaseUrl(), {
        ...options,
        headers: {
            ...options.headers,
            'x-goog-api-key': apiKey,
            'x-gemini-path': path,
        },
    });
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
    const filePath = `/v1beta/${fileName}`;
    
    // This is a simplified polling loop. For a production app, you might want a timeout.
    // eslint-disable-next-line no-constant-condition
    while (true) {
        // Wait for 5 seconds before checking the status again.
        await new Promise(resolve => setTimeout(resolve, 5000)); 

        const getResponse = await makeGeminiRequest(filePath, {
            method: 'GET',
        }, apiKey);
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
 * Uploads a file to the Gemini API using resumable upload through proxy.
 * This method works better with proxy servers by keeping all requests proxied.
 * @param file The file to upload.
 * @param apiKey Your Google AI API key.
 * @returns A promise that resolves with the file metadata once the file is 'ACTIVE'.
 */
async function uploadFileWithRest(file: File, apiKey: string): Promise<any> {
    console.log('Starting file upload with proxied resumable method, size:', file.size, 'bytes');
    console.log('File size in MB:', (file.size / (1024 * 1024)).toFixed(2), 'MB');
    
    try {
        // Step 1: Initiate a resumable upload session through proxy
        const resumableInitResponse = await makeGeminiRequest('/upload/v1beta/files?uploadType=resumable', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify({
                file: {
                    displayName: file.name,
                    mimeType: file.type
                }
            }),
        }, apiKey);

        console.log('Resumable init response status:', resumableInitResponse.status);
        
        if (!resumableInitResponse.ok) {
            const errorText = await resumableInitResponse.text();
            console.error('Failed to initiate upload session:', {
                status: resumableInitResponse.status,
                statusText: resumableInitResponse.statusText,
                error: errorText
            });
            throw new Error(`Failed to initiate upload session (${resumableInitResponse.status}): ${errorText}`);
        }

        // Debug: Log all response headers
        console.log('All resumable init response headers:');
        for (const [key, value] of resumableInitResponse.headers.entries()) {
            console.log(`  ${key}: ${value}`);
        }
        
        const uploadUri = resumableInitResponse.headers.get('Location');
        console.log('Location header value:', uploadUri);
        
        if (!uploadUri) {
            console.error('Missing Location header in resumable upload response');
            console.error('Response status:', resumableInitResponse.status);
            console.error('Response headers:', Object.fromEntries(resumableInitResponse.headers.entries()));
            throw new Error('Failed to get upload URI from server.');
        }

        console.log('Got upload URI:', uploadUri);

        // Step 2: Upload the file bytes through our proxy
        // Extract the path from the upload URI to proxy it
        let uploadPath;
        try {
            const uploadUrl = new URL(uploadUri);
            uploadPath = uploadUrl.pathname + uploadUrl.search;
            console.log('Uploading file through proxy, path:', uploadPath);
        } catch (urlError) {
            console.error('Failed to parse upload URI:', uploadUri);
            console.error('URL parse error:', urlError.message);
            throw new Error(`Invalid upload URI received: ${uploadUri}`);
        }
        
        const uploadResponse = await makeGeminiRequest(uploadPath, {
            method: 'POST',
            headers: { 
                'Content-Type': file.type,
            },
            body: file,
        }, apiKey);

        console.log('Upload response status:', uploadResponse.status);
        
        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('File upload failed:', {
                status: uploadResponse.status,
                statusText: uploadResponse.statusText,
                error: errorText,
                uploadPath: uploadPath
            });
            throw new Error(`Failed to upload file (${uploadResponse.status}): ${errorText}`);
        }

        // Step 3: Get the uploaded file metadata
        const uploadedFileMetadata = await uploadResponse.json();
        console.log('Upload response:', uploadedFileMetadata);

        // Step 4: Poll the file's status until it's 'ACTIVE'
        if (uploadedFileMetadata?.state === 'ACTIVE') {
            return uploadedFileMetadata;
        }
        
        const fileName = uploadedFileMetadata.name;
        if (!fileName) {
            throw new Error('Failed to get file name from upload response');
        }
        
        return pollFileState(fileName, apiKey);
        
    } catch (error) {
        console.error('Resumable upload error:', error);
        
        // Try different fallback methods based on the error type
        if (error.message.includes('Failed to get upload URI from server')) {
            console.log('Falling back to multipart upload method...');
            try {
                return await uploadFileWithMultipart(file, apiKey);
            } catch (multipartError) {
                console.log('Multipart upload also failed, trying direct API method...');
                return await uploadFileWithDirectAPI(file, apiKey);
            }
        }
        
        if (error.message.includes('Network error') || error.message.includes('Failed to fetch')) {
            console.log('Network error detected, file size:', (file.size / (1024 * 1024)).toFixed(2), 'MB');
            
            // For large files, try multipart first, then direct API
            if (file.size > 50 * 1024 * 1024) { // 50MB - adjusted based on actual API limits
                console.log('Large file detected, trying multipart first...');
                try {
                    return await uploadFileWithMultipart(file, apiKey);
                } catch (multipartError) {
                    console.log('Multipart also failed, trying direct API...');
                    return await uploadFileWithDirectAPI(file, apiKey);
                }
            } else {
                console.log('Smaller file, trying direct API first...');
                try {
                    return await uploadFileWithDirectAPI(file, apiKey);
                } catch (directAPIError) {
                    console.log('Direct API method also failed, trying multipart...');
                    return await uploadFileWithMultipart(file, apiKey);
                }
            }
        }
        
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            throw new Error('Network error during file upload. This might be due to file size or network timeout.');
        }
        
        // If all methods fail, provide a helpful error message
        if (error.message.includes('File too large')) {
            throw new Error('حجم ملف الفيديو كبير جدًا (أكثر من 50 ميجابايت). حاول ضغط الفيديو إلى حجم أصغر.');
        }
        
        throw error;
    }
}

/**
 * Simplified upload method that uses direct API calls with better error handling.
 * Used as a fallback when the main upload methods fail.
 */
async function uploadFileWithDirectAPI(file: File, apiKey: string): Promise<any> {
    console.log('Starting direct API upload method, size:', file.size, 'bytes');
    
    try {
        // For very large files, we'll use a different approach
        if (file.size > 50 * 1024 * 1024) { // 50MB - more conservative based on actual API limits
            throw new Error('File too large for direct API upload');
        }
        
        // Use a simple media upload endpoint
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`, {
            method: 'POST',
            body: formData,
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Direct API upload failed: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Direct API upload successful:', result);
        
        return result;
        
    } catch (error) {
        console.error('Direct API upload error:', error);
        throw error;
    }
}

/**
 * Fallback upload method using multipart upload.
 * Used when resumable upload fails due to proxy issues.
 */
async function uploadFileWithMultipart(file: File, apiKey: string): Promise<any> {
    console.log('Starting multipart upload fallback, size:', file.size, 'bytes');
    
    try {
        // Create FormData for multipart upload
        const formData = new FormData();
        
        // Add metadata as JSON
        const metadata = {
            file: {
                displayName: file.name,
                mimeType: file.type
            }
        };
        
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('data', file);
        
        // Use multipart upload endpoint
        const uploadResponse = await makeGeminiRequest('/upload/v1beta/files?uploadType=multipart', {
            method: 'POST',
            body: formData, // Don't set Content-Type header, let browser set it with boundary
        }, apiKey);

        console.log('Multipart upload response status:', uploadResponse.status);
        
        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('Multipart upload failed:', errorText);
            throw new Error(`Failed to upload file with multipart (${uploadResponse.status}): ${errorText}`);
        }

        // Get the uploaded file metadata
        const uploadedFileMetadata = await uploadResponse.json();
        console.log('Multipart upload response:', uploadedFileMetadata);

        // Poll the file's status until it's 'ACTIVE'
        if (uploadedFileMetadata?.state === 'ACTIVE') {
            return uploadedFileMetadata;
        }
        
        const fileName = uploadedFileMetadata.name;
        if (!fileName) {
            throw new Error('Failed to get file name from multipart upload response');
        }
        
        return pollFileState(fileName, apiKey);
        
    } catch (error) {
        console.error('Multipart upload error:', error);
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            throw new Error('Network error during multipart file upload.');
        }
        throw error;
    }
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
            await makeGeminiRequest(`/v1beta/${uploadedFile.name}`, {
                method: 'DELETE',
            }, apiKey);
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
        const fileSizeMB = videoFile.size ? (videoFile.size / (1024 * 1024)).toFixed(2) : 'غير معروف';
        
        // For files under 100MB, this might be a different issue
        if (videoFile.size && videoFile.size < 100 * 1024 * 1024) {
            throw new Error(`خطأ في رفع الملف (${fileSizeMB} ميجابايت). قد تكون هناك مشكلة مؤقتة في الخدمة أو تنسيق الفيديو غير مدعوم. حاول مرة أخرى أو استخدم تنسيق MP4.`);
        }
        
        throw new Error(`حجم ملف الفيديو كبير جدًا (${fileSizeMB} ميجابايت). الحد الأقصى المدعوم هو حوالي 50 ميجابايت للاستقرار الأمثل. حاول ضغط الفيديو أو استخدام ملف أصغر.`);
    }

    const userFriendlyMessage = `فشل الحصول على التفريغ من Gemini API. قد لا يتمكن النموذج من معالجة هذا الفيديو. السبب: ${apiErrorMessage}`;
    throw new Error(userFriendlyMessage);
  }
};