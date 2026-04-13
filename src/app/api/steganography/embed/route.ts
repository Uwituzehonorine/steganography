import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, EmbedResult } from "@/types";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

// POST /api/steganography/embed
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const ehrPayload = formData.get("ehrPayload") as string;
        const audioFile = formData.get("audioFile") as File;
        const bitDepth = formData.get("bitDepth") as string || "16-bit";
        const outputFormat = formData.get("outputFormat") as string || ".wav";

        if (!ehrPayload || !ehrPayload.trim()) {
            return NextResponse.json(
                { success: false, error: "EHR payload is required" } as ApiResponse,
                { status: 400 }
            );
        }

        if (!audioFile) {
            return NextResponse.json(
                { success: false, error: "Audio carrier file is required" } as ApiResponse,
                { status: 400 }
            );
        }

        const projectRoot = process.cwd();
        const tempDir = path.join(projectRoot, "public", "temp");
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const requestId = uuidv4();

        // Preserve original file extension for proper format detection
        const originalFileName = audioFile.name || "audio.wav";
        const fileExtension = path.extname(originalFileName).toLowerCase() || ".wav";
        const inputPath = path.join(tempDir, `${requestId}_input${fileExtension}`);
        const outputPath = path.join(tempDir, `${requestId}_stego.wav`);

        // Save uploaded file with original extension
        const buffer = Buffer.from(await audioFile.arrayBuffer());

        console.log('File processing:', {
            filename: originalFileName,
            size: buffer.length,
            extension: fileExtension,
            type: audioFile.type
        });

        // Basic validation - check if file has content
        if (buffer.length === 0) {
            return NextResponse.json(
                { success: false, error: "Uploaded file is empty" } as ApiResponse,
                { status: 400 }
            );
        }

        // Note: Using ultra-subtle LSB embedding to preserve original audio quality
        console.log(`Processing ${(buffer.length / (1024 * 1024)).toFixed(2)}MB file - LSB method with minimal audio modifications`);

        // For very small files, provide more specific error
        if (buffer.length < 512) { // 512 bytes minimum (very small audio clip)
            const headerHex = buffer.slice(0, Math.min(16, buffer.length)).toString('hex');
            const headerText = buffer.slice(0, Math.min(16, buffer.length)).toString('ascii');
            return NextResponse.json(
                {
                    success: false,
                    error: `File is too small (${buffer.length} bytes) to be processed. Minimum size is 512 bytes. Header: "${headerText}" (${headerHex})`
                } as ApiResponse,
                { status: 400 }
            );
        }

        // Validate file header for basic audio format detection
        const header = buffer.slice(0, 16);
        const headerText = header.toString('ascii');
        const headerHex = header.toString('hex');

        console.log('File header analysis:', {
            text: headerText,
            hex: headerHex,
            size: buffer.length
        });

        // Check for common audio file signatures
        const validHeaders = [
            'RIFF',     // WAV
            'ID3',      // MP3
            'fLaC',     // FLAC
            'OggS',     // OGG
        ];

        const hasValidHeader = validHeaders.some(sig => headerText.startsWith(sig)) ||
            headerText.includes('ftyp') ||  // M4A/MP4
            header[0] === 0xFF && (header[1] & 0xE0) === 0xE0; // MP3 sync

        if (!hasValidHeader) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Invalid audio file format. Expected audio file header but found: "${headerText.substring(0, 8)}" (${headerHex.substring(0, 16)}). Please upload a valid audio file.`
                } as ApiResponse,
                { status: 400 }
            );
        }

        fs.writeFileSync(inputPath, buffer);

        // Call Python script
        const pythonScript = path.join(projectRoot, "python", "steganography_service.py");

        const pythonPromise = new Promise<{ success: boolean, data?: any, error?: string }>((resolve) => {
            const pythonExecutable = path.join(projectRoot, ".venv", "bin", "python");
            const pyProcess = spawn(pythonExecutable, [
                pythonScript,
                "embed",
                inputPath,
                ehrPayload,
                outputPath
            ], {
                env: {
                    ...process.env,
                    PATH: `/opt/homebrew/bin:${process.env.PATH}`
                }
            });

            let outputData = "";
            let errorData = "";

            pyProcess.stdout.on("data", (data) => {
                outputData += data.toString();
            });

            pyProcess.stderr.on("data", (data) => {
                errorData += data.toString();
            });

            pyProcess.on("close", (code) => {
                console.log('Python process completed:', {
                    exitCode: code,
                    stdout: outputData,
                    stderr: errorData
                });

                if (code !== 0) {
                    const errorMsg = errorData || `Python process exited with code ${code}`;
                    console.error('Python process failed:', errorMsg);
                    resolve({ success: false, error: errorMsg });
                    return;
                }
                try {
                    const result = JSON.parse(outputData);
                    console.log('Python result parsed successfully:', result.success);
                    resolve(result);
                } catch (e) {
                    const parseError = "Failed to parse Python output: " + outputData;
                    console.error('Parse error:', parseError);
                    resolve({ success: false, error: parseError });
                }
            });
        });

        const pythonResult = await pythonPromise;

        if (!pythonResult.success) {
            return NextResponse.json(
                { success: false, error: pythonResult.error } as ApiResponse,
                { status: 500 }
            );
        }

        const result: EmbedResult = {
            psnr: `${pythonResult.data.psnr.toFixed(2)} dB`,
            mse: pythonResult.data.mse.toFixed(6),
            carrier: `/temp/${requestId}_stego.wav`,
            payloadSize: `${(pythonResult.data.payload_size / 1024).toFixed(2)} kb`,
            timestamp: new Date().toISOString(),
            keyBundle: pythonResult.data.truekey,
        };

        // Auto-save record for tracking (in production, this would go to a database)
        try {
            const recordData = {
                type: "Stego Audio",
                carrier: audioFile.name,
                psnr: pythonResult.data.psnr.toFixed(2),
                diagnosis: `Payload: ${ehrPayload.substring(0, 50)}${ehrPayload.length > 50 ? '...' : ''}`,
                icd: "STEGO-001",
                date: new Date().toISOString().split('T')[0],
                status: "Protected"
            };

            // Call the records API to save the new record
            await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/records`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(recordData)
            });
        } catch (recordError) {
            console.warn('Failed to save record:', recordError);
            // Don't fail the main operation if record saving fails
        }

        // Note: In a production app, we'd delete inputPath and eventually outputPath
        // but for this demo we'll keep the stego file available for download.
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

        return NextResponse.json({ success: true, data: result } as ApiResponse<EmbedResult>);
    } catch (error: any) {
        console.error("Embedding error:", error);
        return NextResponse.json(
            { success: false, error: `Embedding failed: ${error.message}` } as ApiResponse,
            { status: 500 }
        );
    }
}
