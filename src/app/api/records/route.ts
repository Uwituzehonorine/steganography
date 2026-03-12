import { NextRequest, NextResponse } from "next/server";
import { MOCK_RECORDS } from "@/lib/data";
import { ApiResponse, EHRRecord } from "@/types";

// GET /api/records – list all records
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "6");

    let records = [...MOCK_RECORDS];

    if (search) {
        records = records.filter(
            (r) =>
                r.id.toLowerCase().includes(search.toLowerCase()) ||
                r.type.toLowerCase().includes(search.toLowerCase()) ||
                r.diagnosis.toLowerCase().includes(search.toLowerCase())
        );
    }
    if (type && type !== "All Types") {
        records = records.filter((r) => r.type === type);
    }
    if (status && status !== "All Status") {
        records = records.filter((r) => r.status === status);
    }

    const total = records.length;
    const paginated = records.slice((page - 1) * pageSize, page * pageSize);

    const response: ApiResponse<{ records: EHRRecord[]; total: number; page: number; pageSize: number }> = {
        success: true,
        data: { records: paginated, total, page, pageSize },
    };

    return NextResponse.json(response);
}

// POST /api/records – create a new record
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const newRecord: EHRRecord = {
            id: `RWD-${Date.now().toString().slice(-5)}`,
            type: body.type || "Custom / Raw",
            carrier: body.carrier || "unknown.wav",
            psnr: body.psnr || "0.00",
            date: new Date().toISOString().split("T")[0],
            status: "Pending",
            diagnosis: body.diagnosis || "Unknown",
            icd: body.icd || "—",
        };

        const response: ApiResponse<EHRRecord> = {
            success: true,
            data: newRecord,
            message: "Record created successfully",
        };

        return NextResponse.json(response, { status: 201 });
    } catch {
        return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
    }
}
