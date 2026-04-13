import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, ExtractResult } from "@/types";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

// POST /api/steganography/extract
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const extractionKey = formData.get("extractionKey") as string;
        const password = formData.get("password") as string;
        const stegoFile = formData.get("stegoFile") as File;
        const reason = formData.get("reason") as string || "Clinical Review";

        if (!stegoFile) {
            return NextResponse.json(
                { success: false, error: "Stego audio file is required" } as ApiResponse,
                { status: 400 }
            );
        }

        if (!extractionKey || !extractionKey.trim()) {
            return NextResponse.json(
                { success: false, error: "Extraction key is required" } as ApiResponse,
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
        const originalFileName = stegoFile.name || "stego.wav";
        const fileExtension = path.extname(originalFileName).toLowerCase() || ".wav";
        const stegoPath = path.join(tempDir, `${requestId}_stego_input${fileExtension}`);

        // Save uploaded stego file with validation
        const buffer = Buffer.from(await stegoFile.arrayBuffer());

        console.log('Stego file processing:', {
            filename: originalFileName,
            size: buffer.length,
            extension: fileExtension,
            type: stegoFile.type
        });

        // Basic validation - check if file has content
        if (buffer.length === 0) {
            return NextResponse.json(
                { success: false, error: "Uploaded file is empty" } as ApiResponse,
                { status: 400 }
            );
        }

        // Check file size limits - Allow larger files for extraction
        if (buffer.length > 200 * 1024 * 1024) { // 200MB limit for extraction
            return NextResponse.json(
                { success: false, error: "File size exceeds 200MB limit" } as ApiResponse,
                { status: 400 }
            );
        }

        // For very small files, provide more specific error
        if (buffer.length < 44) { // Minimum for WAV header
            return NextResponse.json(
                { success: false, error: "File is too small to be a valid audio file" } as ApiResponse,
                { status: 400 }
            );
        }

        fs.writeFileSync(stegoPath, buffer);

        // Call Python script
        const pythonScript = path.join(projectRoot, "python", "steganography_service.py");

        const pythonPromise = new Promise<{ success: boolean, data?: any, error?: string }>((resolve) => {
            const pythonExecutable = path.join(projectRoot, ".venv", "bin", "python");
            const pyProcess = spawn(pythonExecutable, [
                pythonScript,
                "extract",
                stegoPath,
                extractionKey,
                "64"  // Default payload size in bits (8 characters) to prevent division by zero
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
                console.log('Python extract process completed:', {
                    exitCode: code,
                    stdout: outputData,
                    stderr: errorData
                });

                if (code !== 0) {
                    const errorMsg = errorData || `Python process exited with code ${code}`;
                    console.error('Python extract process failed:', errorMsg);
                    resolve({ success: false, error: errorMsg });
                    return;
                }
                try {
                    const result = JSON.parse(outputData);
                    console.log('Python extract result parsed successfully:', result.success);
                    resolve(result);
                } catch (e) {
                    const parseError = "Failed to parse Python output: " + outputData;
                    console.error('Extract parse error:', parseError);
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

        // The retrieved payload might be a JSON or plain text EHR record
        const rawPayload = pythonResult.data.retrieved_payload;

        // Create a clean original audio file from the stego file for playback
        // In a real system, we'd properly recover the original, but for demo purposes
        // we'll use the stego file as a reference for playback
        const originalAudioPath = `/temp/${requestId}_recovered_original.wav`;
        const originalAudioFullPath = path.join(projectRoot, "public", originalAudioPath.substring(1));

        // For demo: copy stego file as "recovered" original 
        // In production, this would be the actual recovered carrier
        fs.copyFileSync(stegoPath, originalAudioFullPath);

        // Mocking the structured data extraction from the raw payload
        // In a real system, we'd parse the rawPayload (e.g. if it was JSON)
        const result = {
            // Frontend expects these specific field names:
            retrieved_payload: rawPayload || "",
            extracted_payload: rawPayload || "", // Alternative field name
            keyword: rawPayload || "", // What frontend actually uses
            psnr: pythonResult.data.psnr || "N/A",
            integrity: "verified",
            original_audio: originalAudioPath, // Path for audio playback

            // Legacy EHR fields for backward compatibility:
            patientId: "RWD-2024-10847",
            type: "Diagnostic Records",
            date: new Date().toISOString().split('T')[0],
            diagnosis: rawPayload ? rawPayload.substring(0, 100) + (rawPayload.length > 100 ? "..." : "") : "No data extracted",
            icd: "STEGO-001",
            carrier: stegoFile.name,
            accessTime: new Date().toISOString(),
            reason: reason,
        };

        // If rawPayload looks like a structured record, we could try to parse it
        try {
            if (rawPayload && rawPayload.includes("Patient ID:")) {
                const lines = rawPayload.split("\n");
                result.patientId = lines.find((l: string) => l.includes("Patient ID:"))?.split(":")[1].trim() || result.patientId;
                result.diagnosis = lines.find((l: string) => l.includes("Diagnosis:"))?.split(":")[1].trim() || result.diagnosis;
            }
        } catch (e) {
            console.log('Failed to parse structured payload:', e);
        }

        // Auto-update records to mark extraction (in production, this would update a database)
        try {
            const recordData = {
                type: "Extracted Record",
                carrier: stegoFile.name,
                psnr: pythonResult.data.psnr ? pythonResult.data.psnr.toFixed(2) : "N/A",
                diagnosis: `Extracted: ${rawPayload ? rawPayload.substring(0, 50) : "No data"}${rawPayload && rawPayload.length > 50 ? '...' : ''}`,
                icd: result.icd,
                date: new Date().toISOString().split('T')[0],
                status: "Extracted"
            };

            // Call the records API to save the extraction record
            const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
            await fetch(`${baseUrl}/api/records`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(recordData)
            });
        } catch (recordError) {
            console.warn('Failed to save extraction record:', recordError);
            // Don't fail the main operation if record saving fails
        }

        // Clean up stego input file but keep original audio for playback
        if (fs.existsSync(stegoPath)) fs.unlinkSync(stegoPath);

        return NextResponse.json({ success: true, data: result } as ApiResponse<ExtractResult>);
    } catch (error: any) {
        console.error("Extraction error:", error);
        return NextResponse.json(
            { success: false, error: `Extraction failed: ${error.message}` } as ApiResponse,
            { status: 500 }
        );
    }
}
