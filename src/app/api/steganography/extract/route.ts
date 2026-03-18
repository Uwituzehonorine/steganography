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
        const stegoPath = path.join(tempDir, `${requestId}_stego_input.wav`);

        // Save uploaded stego file
        const buffer = Buffer.from(await stegoFile.arrayBuffer());
        fs.writeFileSync(stegoPath, buffer);

        // Call Python script
        const pythonScript = path.join(projectRoot, "python", "steganography_service.py");
        
        const pythonPromise = new Promise<{success: boolean, data?: any, error?: string}>((resolve) => {
            const pyProcess = spawn("python3", [
                pythonScript,
                "extract",
                stegoPath,
                extractionKey
            ]);

            let outputData = "";
            let errorData = "";

            pyProcess.stdout.on("data", (data) => {
                outputData += data.toString();
            });

            pyProcess.stderr.on("data", (data) => {
                errorData += data.toString();
            });

            pyProcess.on("close", (code) => {
                if (code !== 0) {
                    resolve({ success: false, error: errorData || `Python process exited with code ${code}` });
                    return;
                }
                try {
                    const result = JSON.parse(outputData);
                    resolve(result);
                } catch (e) {
                    resolve({ success: false, error: "Failed to parse Python output: " + outputData });
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
        
        // Mocking the structured data extraction from the raw payload
        // In a real system, we'd parse the rawPayload (e.g. if it was JSON)
        const result: ExtractResult = {
            patientId: "RWD-2024-10847", // Fallback or parsed from rawPayload
            type: "Diagnostic Records",
            date: new Date().toISOString().split('T')[0],
            diagnosis: rawPayload.substring(0, 100) + (rawPayload.length > 100 ? "..." : ""),
            icd: "J18.9, Z87.891",
            psnr: "125.67",
            carrier: stegoFile.name,
            accessTime: new Date().toISOString(),
            reason: reason,
        };

        // If rawPayload looks like a structured record, we could try to parse it
        try {
            if (rawPayload.includes("Patient ID:")) {
                const lines = rawPayload.split("\n");
                result.patientId = lines.find((l: string) => l.includes("Patient ID:"))?.split(":")[1].trim() || result.patientId;
                result.diagnosis = lines.find((l: string) => l.includes("Diagnosis:"))?.split(":")[1].trim() || result.diagnosis;
            }
        } catch (e) {}

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
