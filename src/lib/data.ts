import { EHRRecord } from "@/types";

export const MOCK_RECORDS: EHRRecord[] = [
    {
        id: "RWD-10847",
        type: "Diagnosis",
        carrier: "audio_cello_01.wav",
        psnr: "125.67",
        date: "2024-11-15",
        status: "Protected",
        diagnosis: "J18.9 – Community-acquired pneumonia",
        icd: "J18.9, Z87.891",
    },
    {
        id: "RWD-10901",
        type: "Lab Results",
        carrier: "audio_piano_07.wav",
        psnr: "122.14",
        date: "2024-11-18",
        status: "Protected",
        diagnosis: "E11.9 – Type 2 Diabetes Mellitus",
        icd: "E11.9, Z79.4",
    },
    {
        id: "RWD-11023",
        type: "Prescription",
        carrier: "audio_guitar_04.wav",
        psnr: "119.88",
        date: "2024-11-20",
        status: "Extracted",
        diagnosis: "I10 – Essential Hypertension",
        icd: "I10, Z87.39",
    },
    {
        id: "RWD-11204",
        type: "Imaging",
        carrier: "audio_voice_13.wav",
        psnr: "121.33",
        date: "2024-11-22",
        status: "Protected",
        diagnosis: "M54.5 – Low back pain",
        icd: "M54.5",
    },
    {
        id: "RWD-11350",
        type: "Diagnosis",
        carrier: "audio_sax_10.wav",
        psnr: "116.92",
        date: "2024-11-24",
        status: "Pending",
        diagnosis: "J06.9 – Acute upper respiratory infection",
        icd: "J06.9",
    },
    {
        id: "RWD-11402",
        type: "Demographics",
        carrier: "audio_cello_02.wav",
        psnr: "124.01",
        date: "2024-11-25",
        status: "Protected",
        diagnosis: "Z00.00 – General adult medical exam",
        icd: "Z00.00",
    },
];

export const PSNR_BY_CARRIER = [
    { label: "Cello (1-3)", val: 110.6, color: "#2dd4bf" },
    { label: "Guitar (4-6)", val: 110.63, color: "#22d3ee" },
    { label: "Piano (7-9)", val: 110.65, color: "#2dd4bf" },
    { label: "Sax (10-12)", val: 110.59, color: "#5eead4" },
    { label: "Voice (13-15)", val: 110.73, color: "#34d399" },
];

export const BENCHMARK_DATA = [
    {
        method: "Proposed (Fourfold)",
        psnr1kb: "125.67 dB",
        psnr100kb: "105.72 dB",
        maxPayload: "100 kb",
        features: ["Interp.", "Multi-layer", "Smooth"],
        isProposed: true,
    },
    {
        method: "Samudra & Ahmad (2023)",
        psnr1kb: "119.00 dB",
        psnr100kb: "95.00 dB",
        maxPayload: "100 kb",
        features: ["Segmentation"],
        isProposed: false,
    },
    {
        method: "Amrulloh & Ahmad (2022)",
        psnr1kb: "115.00 dB",
        psnr100kb: "92.00 dB",
        maxPayload: "100 kb",
        features: ["Sample min."],
        isProposed: false,
    },
    {
        method: "Prayogi et al. (2021)",
        psnr1kb: "117.00 dB",
        psnr100kb: "93.50 dB",
        maxPayload: "700 kb",
        features: ["Modulo op."],
        isProposed: false,
    },
];

export const SAMPLE_EHR_TEMPLATE = `PATIENT_ID: RWD-2024-10847
NAME: [ENCRYPTED]
DOB: 1985-03-14
BLOOD_TYPE: O+
DIAGNOSIS: J18.9 - Community-acquired pneumonia
ICD10: J18.9, Z87.891
MEDICATIONS:
  - Amoxicillin 875mg PO BID x 7 days
  - Azithromycin 500mg PO QD x 5 days
LAB_RESULTS:
  WBC: 12.4 x10^3/uL (High)
  CRP: 48 mg/L (Elevated)
  O2_SAT: 94%
ATTENDING: Dr. Uwituze, R.
FACILITY: CHUK - Kigali, Rwanda
DATE: 2024-11-15`;
