import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, ExtractResult } from "@/types";

// POST /api/steganography/extract
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { extractionKey, password, reason } = body;

        if (!password || !password.trim()) {
            return NextResponse.json(
                { success: false, error: "Decryption password is required" } as ApiResponse,
                { status: 400 }
            );
        }

        if (!extractionKey || !extractionKey.trim()) {
            return NextResponse.json(
                { success: false, error: "Extraction key is required" } as ApiResponse,
                { status: 400 }
            );
        }

        // Simulate extraction delay
        await new Promise((r) => setTimeout(r, 80));

        const result: ExtractResult = {
            patientId: "RWD-2024-10847",
            type: "Diagnostic Records",
            date: "2024-11-15",
            diagnosis: "J18.9 – Community-acquired pneumonia",
            icd: "J18.9, Z87.891",
            psnr: "125.67",
            carrier: "stego_carrier.wav",
            accessTime: new Date().toISOString(),
            reason: reason || "Clinical Review",
        };

        return NextResponse.json({ success: true, data: result } as ApiResponse<ExtractResult>);
    } catch {
        return NextResponse.json(
            { success: false, error: "Extraction failed" } as ApiResponse,
            { status: 500 }
        );
    }
}
