// EHR Record Types
export type RecordStatus = "Protected" | "Extracted" | "Pending";
export type DataType =
    | "Patient Demographics"
    | "Lab Results"
    | "Prescription Records"
    | "Diagnostic Codes (ICD-10)"
    | "Imaging Reports"
    | "Custom / Raw";

export interface EHRRecord {
    id: string;
    type: DataType | string;
    carrier: string;
    psnr: string;
    date: string;
    status: RecordStatus;
    diagnosis: string;
    icd: string;
}

export interface EmbedResult {
    psnr: string;
    mse: string;
    carrier: string;
    payloadSize: string;
    timestamp: string;
    keyBundle: string;
}

export interface ExtractResult {
    patientId: string;
    type: string;
    date: string;
    diagnosis: string;
    icd: string;
    psnr: string;
    carrier: string;
    accessTime: string;
    reason: string;
}

export interface AudioCarrier {
    name: string;
    size: number;
    format: string;
    sampleRate?: string;
    bitDepth?: string;
}

export interface ProcessStep {
    label: string;
    log: string;
    type: "info" | "process" | "success" | "warning";
    pct: number;
}

export interface AnalyticsData {
    totalRecords: number;
    totalCarriers: number;
    recoveryRate: string;
    breaches: number;
    psnrByCarrier: { label: string; val: number; color: string }[];
}

// API Response Types
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface EmbedRequest {
    audioFile?: File;
    ehrPayload: string;
    dataType: string;
    encoding: string;
    encryptionKey: string;
    bitDepth: string;
    outputFormat: string;
    algorithmSteps: {
        interpolation: boolean;
        multiLayering: boolean;
        optimizedSampleSpace: boolean;
        smoothing: boolean;
    };
}

export interface ExtractRequest {
    stegoFile?: File;
    extractionKey: string;
    password: string;
    expectedDataType: string;
}
