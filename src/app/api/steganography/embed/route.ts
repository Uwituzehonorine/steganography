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
        const inputPath = path.join(tempDir, `${requestId}_input.wav`);
        const outputPath = path.join(tempDir, `${requestId}_stego.wav`);

        // Save uploaded file
        const buffer = Buffer.from(await audioFile.arrayBuffer());
        fs.writeFileSync(inputPath, buffer);

        // Call Python script
        const pythonScript = path.join(projectRoot, "python", "steganography_service.py");
        
        const pythonPromise = new Promise<{success: boolean, data?: any, error?: string}>((resolve) => {
            const pyProcess = spawn("python3", [
                pythonScript,
                "embed",
                inputPath,
                ehrPayload,
                outputPath
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

        const result: EmbedResult = {
            psnr: `${pythonResult.data.psnr.toFixed(2)} dB`,
            mse: pythonResult.data.mse.toFixed(6),
            carrier: `/temp/${requestId}_stego.wav`,
            payloadSize: `${(pythonResult.data.payload_size / 1024).toFixed(2)} kb`,
            timestamp: new Date().toISOString(),
            keyBundle: pythonResult.data.truekey,
        };

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
