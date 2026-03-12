import { NextRequest, NextResponse } from "next/server";
import { MOCK_RECORDS } from "@/lib/data";
import { ApiResponse, EHRRecord } from "@/types";

// GET /api/records/[id]
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const record = MOCK_RECORDS.find((r) => r.id === id);

    if (!record) {
        return NextResponse.json(
            { success: false, error: "Record not found" } as ApiResponse,
            { status: 404 }
        );
    }

    return NextResponse.json({ success: true, data: record } as ApiResponse<EHRRecord>);
}

// PATCH /api/records/[id]
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const record = MOCK_RECORDS.find((r) => r.id === id);

    if (!record) {
        return NextResponse.json(
            { success: false, error: "Record not found" } as ApiResponse,
            { status: 404 }
        );
    }

    try {
        const body = await request.json();
        const updated = { ...record, ...body };
        return NextResponse.json({ success: true, data: updated } as ApiResponse<EHRRecord>);
    } catch {
        return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
    }
}
