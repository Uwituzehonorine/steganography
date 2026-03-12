import { NextResponse } from "next/server";
import { PSNR_BY_CARRIER, BENCHMARK_DATA, MOCK_RECORDS } from "@/lib/data";
import { ApiResponse } from "@/types";

// GET /api/analytics
export async function GET() {
    const protected_ = MOCK_RECORDS.filter((r) => r.status === "Protected").length;
    const carriers = new Set(MOCK_RECORDS.map((r) => r.carrier)).size;
    const avgPSNR =
        MOCK_RECORDS.reduce((sum, r) => sum + parseFloat(r.psnr), 0) / MOCK_RECORDS.length;

    const data = {
        totalRecords: 128,
        totalCarriers: 15,
        recoveryRate: "99.9%",
        breaches: 0,
        protectedRecords: protected_,
        avgPSNR: avgPSNR.toFixed(2),
        psnrByCarrier: PSNR_BY_CARRIER,
        benchmarks: BENCHMARK_DATA,
    };

    return NextResponse.json({ success: true, data } as ApiResponse<typeof data>);
}
