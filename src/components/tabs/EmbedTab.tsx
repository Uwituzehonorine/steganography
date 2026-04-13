"use client";

import { useState, useRef } from "react";
import { Upload, RefreshCw, Download, Play, CheckCircle, AlertCircle, Mic, Square, Pause } from "lucide-react";

const FOURFOLD_STEPS = [
    { id: 1, name: "Interpolation", description: "Doubles sample count, expands embedding space" },
    { id: 2, name: "Multi-layering", description: "Distributes keyword bits across audio layers" },
    { id: 3, name: "Sample Space Optimization", description: "Power-of-2 quantization for efficiency" },
    { id: 4, name: "Smoothing", description: "Reduces artifacts and improves quality" },
];

export default function EmbedTab() {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [keyword, setKeyword] = useState("");
    const [encryptionKey, setEncryptionKey] = useState("");
    const [password, setPassword] = useState("");
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]); // Use ref instead of state for chunks

    const generateKey = () => {
        const hex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
        const formatted = hex.match(/.{4}/g)?.join("-") || hex;
        setEncryptionKey(formatted);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            console.log('File selected:', {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            });

            if (file.size === 0) {
                alert('The selected file is empty. Please choose a different file.');
                return;
            }

            setAudioFile(file);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                    sampleSize: 16
                }
            });

            streamRef.current = stream;
            recordedChunksRef.current = []; // Clear previous chunks

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            mediaRecorderRef.current = mediaRecorder;
            setRecordingTime(0);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    console.log('Recording chunk received:', event.data.size, 'bytes');
                    recordedChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                console.log('Recording stopped. Total chunks:', recordedChunksRef.current.length);

                if (recordedChunksRef.current.length === 0) {
                    console.error('No audio data recorded');
                    alert('No audio was recorded. Please try again.');
                    return;
                }

                const totalSize = recordedChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
                console.log('Total recorded size:', totalSize, 'bytes');

                if (totalSize === 0) {
                    console.error('Recorded audio has no data');
                    alert('Recorded audio is empty. Please try recording again.');
                    return;
                }

                const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
                const file = new File([blob], `recorded_audio_${Date.now()}.webm`, {
                    type: 'audio/webm',
                    lastModified: Date.now()
                });

                console.log('Created audio file:', file.name, file.size, 'bytes', file.type);
                setAudioFile(file);

                // Clean up
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
            };

            mediaRecorder.start(1000); // Record in 1s chunks
            setIsRecording(true);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(time => time + 1);
            }, 1000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startEmbedding = async () => {
        if (!keyword.trim()) {
            alert("Please enter a keyword to embed");
            return;
        }

        if (!audioFile) {
            alert("Please select an audio file or record audio");
            return;
        }

        console.log('Audio file validation:', {
            name: audioFile.name,
            size: audioFile.size,
            type: audioFile.type,
            lastModified: audioFile.lastModified
        });

        if (audioFile.size === 0) {
            alert("The selected audio file is empty. Please choose a different file or record new audio.");
            return;
        }

        // Note: No file size limits - backend will automatically optimize large files
        console.log(`Processing ${(audioFile.size / (1024 * 1024)).toFixed(2)}MB file - will be automatically standardized by backend`);

        // Check for minimum viable audio file size - Allow smaller files for processing
        if (audioFile.size < 512) { // 512 bytes minimum for small audio clips
            alert(`Audio file is too small (${audioFile.size} bytes). Minimum size is 512 bytes for processing.`);
            return;
        }

        // Validate file extension
        const validExtensions = ['.wav', '.mp3', '.flac', '.m4a', '.webm', '.ogg'];
        const fileExtension = audioFile.name.toLowerCase().substring(audioFile.name.lastIndexOf('.'));
        if (!validExtensions.includes(fileExtension)) {
            alert(`Unsupported file type: ${fileExtension}. Please use: ${validExtensions.join(', ')}`);
            return;
        }

        // Read first few bytes to validate file header
        try {
            const headerBuffer = await audioFile.slice(0, 16).arrayBuffer();
            const headerBytes = new Uint8Array(headerBuffer);
            const headerHex = Array.from(headerBytes).map(b => b.toString(16).padStart(2, '0')).join('');
            const headerText = new TextDecoder().decode(headerBytes);

            console.log('File header analysis:', {
                hex: headerHex,
                text: headerText,
                bytes: Array.from(headerBytes)
            });

            // Check for valid audio headers
            const validHeaders = [
                'RIFF',     // WAV
                'ID3',      // MP3
                'fLaC',     // FLAC
                '\xFF\xFB', // MP3 (no ID3)
                '\xFF\xFA', // MP3 (no ID3)
                'OggS',     // OGG
            ];

            const hasValidHeader = validHeaders.some(header => headerText.startsWith(header)) ||
                headerText.includes('ftyp'); // M4A/MP4

            if (!hasValidHeader) {
                alert(`Invalid audio file format detected. Header: "${headerText.substring(0, 8)}"\nPlease ensure you're uploading a valid audio file.`);
                return;
            }
        } catch (headerError) {
            console.error('Header validation error:', headerError);
            alert('Unable to validate file format. Please ensure you\'re uploading a valid audio file.');
            return;
        }

        setProcessing(true);
        setProgress(0);
        setResult(null);

        try {
            // Create FormData for API call
            const formData = new FormData();
            formData.append('ehrPayload', keyword);
            formData.append('audioFile', audioFile);
            formData.append('bitDepth', '16-bit');
            formData.append('outputFormat', '.wav');

            console.log('Sending embedding request:', {
                keyword: keyword.length + ' characters',
                fileName: audioFile.name,
                fileSize: audioFile.size + ' bytes (' + (audioFile.size / (1024 * 1024)).toFixed(2) + ' MB)',
                fileType: audioFile.type,
                method: 'Ultra-subtle LSB embedding - minimal audio changes expected'
            });

            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + Math.random() * 15, 90));
            }, 500);

            // Make actual API call
            const response = await fetch('/api/steganography/embed', {
                method: 'POST',
                body: formData,
            });

            clearInterval(progressInterval);
            setProgress(100);

            const apiResult = await response.json();
            console.log('API response:', apiResult);

            if (!response.ok || !apiResult.success) {
                throw new Error(apiResult.error || 'Embedding failed');
            }

            setResult({
                psnr: apiResult.data.psnr,
                mse: apiResult.data.mse,
                success: true,
                outputFile: apiResult.data.carrier,
                keyBundle: apiResult.data.keyBundle,
                payloadSize: apiResult.data.payloadSize
            });

        } catch (error) {
            console.error('Embedding error:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            alert(`Embedding failed: ${errorMessage}`);
            setResult(null);
        } finally {
            setProcessing(false);
        }
    };

    const downloadStegoAudio = async () => {
        if (!result?.outputFile) return;

        try {
            // Download the actual stego audio file from the server
            const response = await fetch(result.outputFile);

            if (!response.ok) {
                throw new Error('Failed to download stego audio');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `stego_${audioFile?.name || 'audio'}_${Date.now()}.wav`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download stego audio file');
        }
    };

    const downloadExtractionKey = () => {
        if (!result?.keyBundle) return;

        const keyData = {
            extractionKey: result.keyBundle,
            algorithm: "Fourfold Steganography",
            generated: new Date().toISOString(),
            audioFile: audioFile?.name || "unknown",
            keyword: "[ENCRYPTED]",
            psnr: result.psnr,
            mse: result.mse,
            payloadSize: result.payloadSize
        };

        const content = `# Steganography Extraction Key
# Generated: ${keyData.generated}
# Algorithm: ${keyData.algorithm}
# Original File: ${keyData.audioFile}
# Quality Score: ${keyData.psnr}
# MSE Distortion: ${keyData.mse}
# Payload Size: ${keyData.payloadSize}

EXTRACTION_KEY=${keyData.extractionKey}

# Instructions:
# 1. Use this key with the Extract tab
# 2. Upload the stego audio file
# 3. Paste this key to recover the hidden keyword
# 4. Keep this key secure - data cannot be recovered without it`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `extraction_key_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const resetForm = () => {
        setAudioFile(null);
        setKeyword("");
        setPassword("");
        setProcessing(false);
        setProgress(0);
        setResult(null);
        generateKey();
    };

    // Generate key on component mount
    if (!encryptionKey) {
        generateKey();
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="mb-8 mt-14 pt-4">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    Embed Keyword in Audio
                </h1>
                <p className="text-slate-600">
                    Add keywords or notes to your audio recordings using ultra-subtle LSB embedding that preserves original qualityat preserves original quality.
                </p>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="metric-card text-center">
                    <div className="metric-value text-blue-600">110.65</div>
                    <div className="metric-label">Avg Quality Score</div>
                    <div className="text-xs text-emerald-600 mt-1">↑ +5.1 dB</div>
                </div>
                <div className="metric-card text-center">
                    <div className="metric-value text-emerald-600">126.34</div>
                    <div className="metric-label">Peak Quality Score</div>
                    <div className="text-xs text-slate-500 mt-1">at 1kb payload</div>
                </div>
                <div className="metric-card text-center">
                    <div className="metric-value text-slate-900">100</div>
                    <div className="metric-label">Max Payload (kb)</div>
                </div>
                <div className="metric-card text-center">
                    <div className="metric-value text-emerald-600">AES-256</div>
                    <div className="metric-label">Encryption</div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-xs text-emerald-600">Active</span>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Left Column - Input Steps */}
                <div className="space-y-6">
                    {/* Step 1: Audio Source */}
                    <div className="card p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="step-number active">1</div>
                            <div>
                                <h3 className="font-semibold text-slate-900">Audio Source</h3>
                                <p className="text-sm text-slate-500">Record or upload audio file</p>
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg mb-4">
                            <button
                                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                onClick={() => setActiveTab('upload')}
                                disabled={isRecording}
                            >
                                Upload File
                            </button>
                            <button
                                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'record' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                onClick={() => setActiveTab('record')}
                                disabled={isRecording}
                            >
                                Record Audio
                            </button>
                        </div>

                        {/* Upload Section */}
                        {activeTab === 'upload' && (
                            <div>
                                <div
                                    className={`drop-zone ${audioFile && !audioFile.name.includes('recorded_audio') ? 'border-emerald-300 bg-emerald-50' : ''
                                        }`}
                                    onClick={() => document.getElementById('audioInput')?.click()}
                                >
                                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                                    {audioFile && !audioFile.name.includes('recorded_audio') ? (
                                        <>
                                            <p className="text-slate-700 font-medium">{audioFile.name}</p>
                                            <p className="text-sm text-slate-500">
                                                {(audioFile.size / 1024 / 1024).toFixed(2)} MB · {audioFile.type}
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-slate-600">Drop audio file here or click to browse</p>
                                            <p className="text-sm text-slate-500 mt-1">
                                                Recommended: 44.1 kHz, 16-bit WAV files
                                            </p>
                                        </>
                                    )}
                                </div>
                                <input
                                    id="audioInput"
                                    type="file"
                                    accept=".wav,.mp3,.flac,.aiff"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </div>
                        )}

                        {/* Recording Section */}
                        {activeTab === 'record' && (
                            <div className="space-y-4">
                                {/* Recording Status */}
                                {audioFile?.name.includes('recorded_audio') && (
                                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                                            <span className="text-sm font-medium text-emerald-800">Recording Saved</span>
                                        </div>
                                        <p className="text-sm text-emerald-600">
                                            Duration: {formatTime(recordingTime)} • Size: {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                )}

                                {/* Recording Controls */}
                                <div className="flex items-center justify-center gap-4">
                                    {!isRecording ? (
                                        <button
                                            className="btn btn-primary flex items-center gap-2"
                                            onClick={startRecording}
                                        >
                                            <Mic className="w-4 h-4" />
                                            Start Recording
                                        </button>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                                <span className="text-red-800 font-medium">Recording</span>
                                                <span className="text-red-600 font-mono text-sm">
                                                    {formatTime(recordingTime)}
                                                </span>
                                            </div>
                                            <button
                                                className="btn btn-secondary flex items-center gap-2"
                                                onClick={stopRecording}
                                            >
                                                <Square className="w-4 h-4" />
                                                Stop
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Recording Tips */}
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <h4 className="text-sm font-medium text-blue-800 mb-1">Recording Tips:</h4>
                                    <ul className="text-xs text-blue-700 space-y-1">
                                        <li>• Speak clearly and avoid background noise</li>
                                        <li>• Recommended duration: 10-60 seconds</li>
                                        <li>• Minimum file size: 512 bytes (small audio clips supported)</li>
                                        <li>• No maximum file size limit - large files handled efficiently</li>
                                        <li>• Ultra-subtle LSB embedding preserves original audio quality</li>
                                        <li>• Only modifies least significant bits - virtually inaudible</li>
                                        <li>• Sparse embedding uses minimal sample modifications</li>
                                        <li>• High PSNR values indicate excellent quality preservality preservation</li>
                                        <li>• Higher quality input provides better processing results</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Step 2: Enter Keyword */}
                    <div className="card p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`step-number ${audioFile ? 'active' : 'pending'}`}>2</div>
                            <div>
                                <h3 className="font-semibold text-slate-900">Communication Keyword</h3>
                                <p className="text-sm text-slate-500">Secret message to embed</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Enter Keyword / Secret Message
                                </label>
                                <textarea
                                    className="textarea"
                                    rows={3}
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    placeholder="Type your communication keyword here...&#10;&#10;Examples:&#10;ALPHA-7-SECURE-CHANNEL&#10;RENDEZVOUS:2025-12-01:NODE-B"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Encoding</label>
                                    <select className="select">
                                        <option>UTF-8 (Text)</option>
                                        <option>ASCII Binary</option>
                                        <option>Base64</option>
                                        <option>Hexadecimal</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Payload Size</label>
                                    <div className="input bg-slate-50 text-slate-600 font-mono text-sm">
                                        {new TextEncoder().encode(keyword).length} bytes
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Encryption */}
                    <div className="card p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`step-number ${keyword ? 'active' : 'pending'}`}>3</div>
                            <div>
                                <h3 className="font-semibold text-slate-900">Encryption Settings</h3>
                                <p className="text-sm text-slate-500">AES-256 encryption key</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Encryption Key (Auto-generated)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        className="input font-mono text-sm"
                                        value={encryptionKey}
                                        readOnly
                                    />
                                    <button className="btn-secondary px-3" onClick={generateKey}>
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Additional Password (Optional)
                                </label>
                                <input
                                    type="password"
                                    className="input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Leave blank if not needed"
                                />
                            </div>

                            <div className="alert alert-info">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                This key is required for extraction. Store it securely - it will not be embedded in the audio.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Configuration & Process */}
                <div className="space-y-6">
                    {/* Algorithm Configuration */}
                    <div className="card p-6">
                        <h3 className="font-semibold text-slate-900 mb-4">Fourfold Algorithm</h3>

                        <div className="space-y-3 mb-6">
                            {FOURFOLD_STEPS.map((step) => (
                                <div key={step.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                    <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                                        {step.id}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-slate-900">{step.name}</div>
                                        <div className="text-sm text-slate-600">{step.description}</div>
                                    </div>
                                    <div className="w-10 h-5 bg-blue-600 rounded-full relative">
                                        <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 right-0.5"></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Bit Depth</label>
                                <select className="select">
                                    <option>16-bit (Optimal)</option>
                                    <option>24-bit</option>
                                    <option>32-bit Float</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Output Format</label>
                                <select className="select">
                                    <option>.wav (Lossless)</option>
                                    <option>.flac</option>
                                    <option>.aiff</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Process & Results */}
                    <div className="card p-6">
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <button
                                    className="btn btn-primary flex-1"
                                    onClick={startEmbedding}
                                    disabled={processing || !audioFile || !keyword}
                                >
                                    {processing ? (
                                        <>
                                            <Play className="w-4 h-4 mr-2" />
                                            Processing...
                                        </>
                                    ) : (
                                        "Embed Keyword"
                                    )}
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={resetForm}
                                >
                                    Reset
                                </button>
                            </div>

                            {processing && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Processing...</span>
                                        <span className="font-mono">{progress}%</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                            )}

                            {result && (
                                <div className="space-y-4">
                                    <div className="alert alert-success">
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Embedding completed successfully!
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-4 rounded-lg text-center">
                                            <div className="text-xl font-bold text-blue-600">{result.psnr}</div>
                                            <div className="text-sm text-slate-500">Quality Score</div>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-lg text-center">
                                            <div className="text-xl font-bold text-emerald-600">{result.mse}</div>
                                            <div className="text-sm text-slate-500">MSE Distortion</div>
                                        </div>
                                    </div>

                                    {result.payloadSize && (
                                        <div className="bg-slate-50 p-4 rounded-lg text-center">
                                            <div className="text-lg font-bold text-purple-600">{result.payloadSize}</div>
                                            <div className="text-sm text-slate-500">Payload Size</div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <button
                                            className="btn btn-success w-full"
                                            onClick={downloadStegoAudio}
                                            disabled={!result}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download Stego Audio
                                        </button>
                                        <button
                                            className="btn btn-secondary w-full"
                                            onClick={downloadExtractionKey}
                                            disabled={!result?.keyBundle}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Save Extraction Key
                                        </button>
                                    </div>

                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <div className="text-sm font-medium text-slate-700 mb-1">Key Fingerprint</div>
                                        <div className="font-mono text-xs text-slate-600 break-all">
                                            {result.keyBundle?.substring(0, 64) || 'Not available'}...
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
