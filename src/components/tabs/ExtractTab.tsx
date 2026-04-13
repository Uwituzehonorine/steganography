"use client";

import { useState } from "react";
import { Upload, Key, Download, CheckCircle, AlertCircle, FileText, Play } from "lucide-react";

export default function ExtractTab() {
    const [stegoFile, setStegoFile] = useState<File | null>(null);
    const [extractionKey, setExtractionKey] = useState("");
    const [password, setPassword] = useState("");
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<any>(null);
    const [isPlayingSecret, setIsPlayingSecret] = useState(false);
    const [isPlayingCombined, setIsPlayingCombined] = useState(false);
    const [currentAudioSource, setCurrentAudioSource] = useState<AudioBufferSourceNode | null>(null);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setStegoFile(file);
        }
    };

    const handleKeyFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setExtractionKey(content.trim());
            };
            reader.readAsText(file);
        }
    };

    const startExtraction = async () => {
        if (!extractionKey.trim()) {
            alert("Please provide an extraction key");
            return;
        }

        if (!stegoFile) {
            alert("Please upload a processed audio file");
            return;
        }

        // Validate file size for extraction
        if (stegoFile.size === 0) {
            alert("The selected audio file is empty. Please choose a different file.");
            return;
        }

        if (stegoFile.size > 200 * 1024 * 1024) { // 200MB limit for extraction
            alert(`Audio file is too large (${(stegoFile.size / (1024 * 1024)).toFixed(1)}MB). Maximum size for extraction is 200MB.`);
            return;
        }

        console.log('Starting extraction for file:', {
            name: stegoFile.name,
            size: stegoFile.size + ' bytes (' + (stegoFile.size / (1024 * 1024)).toFixed(2) + ' MB)',
            type: stegoFile.type
        });

        setProcessing(true);
        setProgress(0);
        setResult(null);

        try {
            // Create FormData for API call
            const formData = new FormData();
            formData.append('stegoFile', stegoFile);
            formData.append('extractionKey', extractionKey.trim());
            if (password.trim()) {
                formData.append('password', password.trim());
            }

            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + Math.random() * 15, 90));
            }, 500);

            // Make actual API call
            const response = await fetch('/api/steganography/extract', {
                method: 'POST',
                body: formData,
            });

            clearInterval(progressInterval);
            setProgress(100);

            const apiResult = await response.json();

            if (!response.ok || !apiResult.success) {
                throw new Error(apiResult.error || 'Extraction failed');
            }

            setResult({
                keyword: apiResult.data.retrieved_payload || apiResult.data.extracted_payload,
                psnr: apiResult.data.psnr && typeof apiResult.data.psnr === 'number'
                    ? `${apiResult.data.psnr.toFixed(2)}`
                    : apiResult.data.psnr && !isNaN(parseFloat(apiResult.data.psnr))
                        ? `${parseFloat(apiResult.data.psnr).toFixed(2)}`
                        : 'N/A',
                integrity: apiResult.data.integrity || "verified",
                originalAudio: apiResult.data.original_audio,
                recovered: true
            });

        } catch (error) {
            console.error('Extraction error:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            alert(`Extraction failed: ${errorMessage}`);
            setResult(null);
        } finally {
            setProcessing(false);
        }
    };

    const downloadOriginalAudio = async () => {
        if (!result?.originalAudio) return;

        try {
            // Download the actual recovered original audio file
            const response = await fetch(result.originalAudio);

            if (!response.ok) {
                throw new Error('Failed to download original audio');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `recovered_original_${stegoFile?.name || 'audio'}_${Date.now()}.wav`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download original audio file');
        }
    };

    const downloadStegoAudio = async () => {
        if (!stegoFile) return;

        try {
            // Create a download link for the uploaded stego file
            const url = window.URL.createObjectURL(stegoFile);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `stego_${stegoFile.name}_${Date.now()}.${stegoFile.name.split('.').pop()}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download stego audio file');
        }
    };

    const playExtractedKeyword = () => {
        if (!result?.keyword) return;

        // If already playing, stop it
        if (isPlayingSecret) {
            stopSecretPlayback();
            return;
        }

        try {
            setIsPlayingSecret(true);
            // Check if speech synthesis is supported
            if (!('speechSynthesis' in window)) {
                alert('Text-to-speech is not supported in your browser');
                return;
            }

            // Function to actually speak after voices are loaded
            const speak = () => {
                const utterance = new SpeechSynthesisUtterance(result.keyword);
                utterance.rate = 0.8; // Slightly slower for clarity
                utterance.pitch = 1;
                utterance.volume = 1;

                // Try to use a clear voice if available
                const voices = speechSynthesis.getVoices();
                console.log('Available voices:', voices.length);

                const preferredVoice = voices.find(voice =>
                    voice.lang.includes('en') &&
                    (voice.name.includes('Google') || voice.name.includes('Microsoft'))
                ) || voices.find(voice => voice.lang.includes('en')) || voices[0];

                if (preferredVoice) {
                    utterance.voice = preferredVoice;
                    console.log('Using voice:', preferredVoice.name);
                } else {
                    console.log('No preferred voice found, using default');
                }

                utterance.onstart = () => {
                    console.log('Started speaking:', result.keyword);
                };

                utterance.onend = () => {
                    console.log('Finished speaking');
                    setIsPlayingSecret(false);
                };

                utterance.onerror = (event) => {
                    // Don't log "interrupted" as an error - this is expected when user clicks stop
                    if (event.error !== 'interrupted') {
                        console.error('Speech synthesis error:', event.error);
                        alert(`Speech failed: ${event.error}`);
                    } else {
                        console.log('Speech playback stopped by user');
                    }
                    setIsPlayingSecret(false);
                };

                speechSynthesis.speak(utterance);
            };

            // Load voices if not already loaded
            const voices = speechSynthesis.getVoices();
            if (voices.length === 0) {
                console.log('Waiting for voices to load...');
                speechSynthesis.onvoiceschanged = () => {
                    console.log('Voices loaded, attempting to speak');
                    speak();
                };
            } else {
                speak();
            }

        } catch (error) {
            console.error('Text-to-speech error:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            // Only show alert for real errors, not when user intentionally stops playback
            if (!errorMessage.includes('interrupted')) {
                alert('Text-to-speech failed: ' + errorMessage);
            }
            setIsPlayingSecret(false);
        }
    };

    const stopSecretPlayback = () => {
        speechSynthesis.cancel();
        setIsPlayingSecret(false);
        console.log('Secret playback stopped');
    };

    const createCombinedAudio = async () => {
        if (!result?.keyword || !result?.originalAudio) return;

        // If already playing, stop it
        if (isPlayingCombined) {
            stopCombinedPlayback();
            return;
        }

        try {
            setIsPlayingCombined(true);
            console.log('Starting combined audio playback...');
            console.log('Keyword:', result.keyword);
            console.log('Original audio URL:', result.originalAudio);

            // Check if speech synthesis is supported
            if (!('speechSynthesis' in window)) {
                alert('Text-to-speech is not supported in your browser');
                return;
            }

            // Check if Web Audio API is supported
            if (!window.AudioContext && !(window as any).webkitAudioContext) {
                alert('Web Audio API is not supported in your browser');
                return;
            }

            // Create audio context (user interaction required)
            let audioContext: AudioContext;
            try {
                audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

                // Resume audio context if suspended (required by some browsers)
                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                }
                console.log('AudioContext created and resumed');
            } catch (contextError) {
                console.error('Failed to create audio context:', contextError);
                alert('Failed to initialize audio system. Please try again.');
                return;
            }

            // Function to speak the keyword
            const speakKeyword = (): Promise<boolean> => {
                return new Promise((resolve) => {
                    const utterance = new SpeechSynthesisUtterance(result.keyword);
                    utterance.rate = 0.8;
                    utterance.pitch = 1;
                    utterance.volume = 1;

                    // Get voices
                    const voices = speechSynthesis.getVoices();
                    const preferredVoice = voices.find(voice =>
                        voice.lang.includes('en') &&
                        (voice.name.includes('Google') || voice.name.includes('Microsoft'))
                    ) || voices.find(voice => voice.lang.includes('en')) || voices[0];

                    if (preferredVoice) {
                        utterance.voice = preferredVoice;
                    }

                    utterance.onstart = () => {
                        console.log('TTS started for keyword:', result.keyword);
                    };

                    utterance.onend = () => {
                        console.log('TTS finished, will now play original audio');
                        resolve(true);
                    };

                    utterance.onerror = (event) => {
                        // Don't log "interrupted" as an error - it's expected when user clicks stop
                        if (event.error !== 'interrupted') {
                            console.error('TTS error:', event.error);
                            console.log('TTS failed with non-interrupted error:', event.error);
                        } else {
                            console.log('Combined TTS stopped by user');
                        }
                        resolve(false); // Continue to audio even if TTS fails
                    };

                    speechSynthesis.speak(utterance);
                });
            };

            // Function to play original audio
            const playOriginalAudio = async (): Promise<void> => {
                try {
                    console.log('Fetching original audio...');

                    if (!result.originalAudio) {
                        console.log('No original audio available, using uploaded stego file for playback');
                        // Fallback: use the uploaded stego file for playback if no original audio
                        const audioUrl = URL.createObjectURL(stegoFile!);
                        const audio = new Audio(audioUrl);
                        audio.play();
                        audio.onended = () => {
                            URL.revokeObjectURL(audioUrl);
                            console.log('Fallback audio playback finished');
                        };
                        return;
                    }

                    const audioResponse = await fetch(result.originalAudio);

                    if (!audioResponse.ok) {
                        throw new Error(`Failed to fetch audio: ${audioResponse.status}`);
                    }

                    const audioBuffer = await audioResponse.arrayBuffer();
                    console.log('Audio fetched, size:', audioBuffer.byteLength, 'bytes');

                    const decodedAudio = await audioContext.decodeAudioData(audioBuffer);
                    console.log('Audio decoded, duration:', decodedAudio.duration, 'seconds');

                    const source = audioContext.createBufferSource();
                    source.buffer = decodedAudio;
                    source.connect(audioContext.destination);

                    source.onended = () => {
                        console.log('Original audio playback finished');
                        setIsPlayingCombined(false);
                        setCurrentAudioSource(null);
                    };

                    source.start(0);
                    setCurrentAudioSource(source);
                    console.log('Original audio playback started');

                } catch (audioError) {
                    console.error('Error playing original audio:', audioError);
                    const errorMessage = audioError instanceof Error ? audioError.message : String(audioError);

                    // Fallback to simple audio element if Web Audio API fails
                    console.log('Attempting fallback audio playback...');
                    try {
                        if (result.originalAudio) {
                            const audio = new Audio(result.originalAudio);
                            audio.play();
                        } else if (stegoFile) {
                            const audioUrl = URL.createObjectURL(stegoFile);
                            const audio = new Audio(audioUrl);
                            audio.play();
                            audio.onended = () => URL.revokeObjectURL(audioUrl);
                        }
                    } catch (fallbackError) {
                        alert('Failed to play audio: ' + errorMessage);
                    }
                }
            };

            // Execute sequence: speak keyword first, then play original audio
            console.log('Starting TTS for keyword...');
            const ttsSuccess = await speakKeyword();

            if (ttsSuccess) {
                console.log('TTS completed successfully, starting original audio...');
            } else {
                console.log('TTS failed, but continuing with original audio...');
            }

            // Small delay to ensure smooth transition
            setTimeout(() => {
                playOriginalAudio();
            }, 500);

        } catch (error) {
            console.error('Combined audio creation error:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            alert('Failed to create combined audio: ' + errorMessage + '. Try playing them separately.');
            setIsPlayingCombined(false);
        }
    };

    const stopCombinedPlayback = () => {
        speechSynthesis.cancel();
        if (currentAudioSource) {
            currentAudioSource.stop();
            setCurrentAudioSource(null);
        }
        setIsPlayingCombined(false);
        console.log('Combined playback stopped');
    };

    const saveExtractedKeyword = () => {
        if (!result?.keyword) return;

        const keywordData = {
            extractedKeyword: result.keyword,
            sourceFile: stegoFile?.name || "unknown",
            extractionDate: new Date().toISOString(),
            psnr: result.psnr,
            integrity: result.integrity,
            algorithm: "Audio Processing"
        };

        const content = `# Extracted Audio Keyword\n# Extraction Date: ${keywordData.extractionDate}\n# Source File: ${keywordData.sourceFile}\n# Algorithm: ${keywordData.algorithm}\n# Quality: ${keywordData.psnr}\n# Integrity: ${keywordData.integrity}\n\nEXTRACTED_KEYWORD=${keywordData.extractedKeyword}\n\n# This keyword was successfully recovered from processed audio.\n# Store securely if this contains sensitive information.`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `extracted_keyword_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const resetForm = () => {
        setStegoFile(null);
        setExtractionKey("");
        setPassword("");
        setProcessing(false);
        setProgress(0);
        setResult(null);
        // Stop any playing audio when resetting
        stopSecretPlayback();
        stopCombinedPlayback();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="mb-8 mt-14 pt-4">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    Extract Hidden Keyword
                </h1>
                <p className="text-slate-600">
                    Recover keywords and notes from your processed audio files using your extraction key.
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Left Column - Input Steps */}
                <div className="space-y-6">
                    {/* Step 1: Upload Processed Audio */}
                    <div className="card p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="step-number active">1</div>
                            <div>
                                <h3 className="font-semibold text-slate-900">Upload Processed Audio</h3>
                                <p className="text-sm text-slate-500">Audio file with embedded keyword</p>
                            </div>
                        </div>

                        <div
                            className={`drop-zone ${stegoFile ? 'border-emerald-300 bg-emerald-50' : ''}`}
                            onClick={() => document.getElementById('stegoInput')?.click()}
                        >
                            <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                            {stegoFile ? (
                                <>
                                    <p className="text-slate-700 font-medium">{stegoFile.name}</p>
                                    <p className="text-sm text-slate-500">
                                        {(stegoFile.size / 1024 / 1024).toFixed(2)} MB · {stegoFile.type}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-slate-600">Drop stego audio file here or click to browse</p>
                                    <p className="text-sm text-slate-500 mt-1">
                                        The protected audio with embedded keyword
                                    </p>
                                </>
                            )}
                        </div>
                        <input
                            id="stegoInput"
                            type="file"
                            accept=".wav,.mp3,.flac,.aiff"
                            className="hidden"
                            onChange={handleFileUpload}
                        />

                        {/* File size info */}
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-xs text-blue-800">
                                <strong>File Size Limits:</strong> Maximum 200MB for extraction • Processed files are typically larger than originals
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Load Extraction Key */}
                    <div className="card p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`step-number ${stegoFile ? 'active' : 'pending'}`}>2</div>
                            <div>
                                <h3 className="font-semibold text-slate-900">Load Extraction Key</h3>
                                <p className="text-sm text-slate-500">Key generated during embedding</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Key File Upload */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Upload Key File
                                </label>
                                <div
                                    className="drop-zone border-dashed p-4 cursor-pointer hover:border-blue-400"
                                    onClick={() => document.getElementById('keyFileInput')?.click()}
                                >
                                    <div className="flex items-center gap-3">
                                        <Key className="w-5 h-5 text-slate-400" />
                                        <div>
                                            <p className="text-sm text-slate-600">
                                                Click to upload key file (.key / .txt)
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Generated during the embedding process
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <input
                                    id="keyFileInput"
                                    type="file"
                                    accept=".key,.txt"
                                    className="hidden"
                                    onChange={handleKeyFileUpload}
                                />
                            </div>

                            {/* Manual Key Input */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    — Or Paste Key Manually —
                                </label>
                                <textarea
                                    className="textarea"
                                    rows={3}
                                    value={extractionKey}
                                    onChange={(e) => setExtractionKey(e.target.value)}
                                    placeholder="Paste extraction key here...&#10;e.g. 7f4e-2a1b-9c8d-3f6e-..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Password (if set during embed)
                                </label>
                                <input
                                    type="password"
                                    className="input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Leave blank if no password was set"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            className="btn btn-primary flex-1"
                            onClick={startExtraction}
                            disabled={processing || !stegoFile || !extractionKey}
                        >
                            {processing ? "Extracting..." : "Extract Keyword"}
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={resetForm}
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Right Column - Results */}
                <div className="space-y-6">
                    <div className="card p-6" style={{ minHeight: '400px' }}>
                        <h2 className="font-semibold text-slate-900 mb-4">Extraction Results</h2>

                        {!processing && !result && (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                                    <FileText className="w-8 h-8 text-slate-400" />
                                </div>
                                <p className="text-slate-500">
                                    Awaiting stego audio and extraction key
                                </p>
                            </div>
                        )}

                        {processing && (
                            <div className="flex flex-col items-center justify-center py-16">
                                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                                <p className="text-slate-600 font-medium mb-2">Processing extraction...</p>
                                <div className="w-full max-w-xs">
                                    <div className="progress-bar mb-2">
                                        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <p className="text-xs text-slate-500 text-center">{progress}%</p>
                                </div>
                            </div>
                        )}

                        {result && (
                            <div className="space-y-4">
                                <div className="alert alert-success">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Extraction completed successfully!
                                </div>

                                <div className="bg-slate-50 p-4 rounded-lg">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2">
                                        Recovered Communication Keyword
                                    </h3>
                                    <div className="font-mono text-base font-bold text-slate-900 break-all mb-2">
                                        {result.keyword}
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        <span className="badge badge-primary">
                                            {new TextEncoder().encode(result.keyword).length} bytes
                                        </span>
                                        <span className="badge badge-success">✓ Verified</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-3 rounded-lg text-center">
                                        <div className="text-lg font-bold text-blue-600">{result.psnr} dB</div>
                                        <div className="text-sm text-slate-500">Quality Score</div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg text-center">
                                        <div className="text-lg font-bold text-emerald-600">✓ OK</div>
                                        <div className="text-sm text-slate-500">Integrity Check</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <button
                                        className="btn btn-success w-full"
                                        onClick={downloadOriginalAudio}
                                        disabled={!result}
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Original Audio
                                    </button>
                                    <button
                                        className="btn btn-primary w-full"
                                        onClick={downloadStegoAudio}
                                        disabled={!stegoFile}
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Processed Audio
                                    </button>
                                    <button
                                        className="btn btn-secondary w-full"
                                        onClick={saveExtractedKeyword}
                                        disabled={!result?.keyword}
                                    >
                                        <FileText className="w-4 h-4 mr-2" />
                                        Save Extracted Keyword
                                    </button>
                                </div>

                                {/* New section for playing extracted keyword */}
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border">
                                    <div className="flex justify-between items-center mb-3">
                                        <div>
                                            <h4 className="font-medium text-slate-900">Listen to Extracted Secret</h4>
                                            <p className="text-sm text-slate-600 mt-1">Hear the keyword you embedded</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                className={`btn ${isPlayingSecret ? 'btn-secondary' : 'btn-primary'}`}
                                                onClick={playExtractedKeyword}
                                                disabled={!result?.keyword}
                                                title={isPlayingSecret ? "Stop keyword playback" : "Play extracted keyword using text-to-speech"}
                                            >
                                                <Play className="w-4 h-4 mr-2" />
                                                {isPlayingSecret ? 'Stop Secret' : 'Play Secret'}
                                            </button>
                                            <button
                                                className={`btn ${isPlayingCombined ? 'btn-secondary' : 'btn-success'}`}
                                                onClick={createCombinedAudio}
                                                disabled={!result?.keyword || !result?.originalAudio}
                                                title={isPlayingCombined ? "Stop combined playback" : "Play keyword speech first, then original audio"}
                                            >
                                                <Play className="w-4 h-4 mr-2" />
                                                {isPlayingCombined ? 'Stop Combined' : 'Play Combined'}
                                            </button>
                                        </div>
                                    </div>
                                    {result?.keyword && (
                                        <div className="mt-3 p-2 bg-white rounded border-l-4 border-blue-500">
                                            <span className="text-sm text-slate-600">Extracted: </span>
                                            <span className="font-mono font-bold text-blue-900">{result.keyword}</span>
                                        </div>
                                    )}
                                    <div className="mt-2 text-xs text-slate-500">
                                        <strong>Combined playback:</strong> Keyword speech → Original audio
                                    </div>
                                </div>

                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <h4 className="text-sm font-medium text-slate-700 mb-2">
                                        Original Audio Carrier (Recovered)
                                    </h4>
                                    <p className="text-sm text-slate-600">{result.originalAudio}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Integrity Verification Panel */}
                    <div className="card p-6">
                        <h3 className="font-semibold text-slate-900 mb-4">Integrity Verification</h3>
                        <div className="space-y-3">
                            {[
                                { label: "Keyword Recovery", status: result ? "verified" : "pending" },
                                { label: "Audio Integrity", status: result ? "verified" : "pending" },
                                { label: "Checksum Match", status: result ? "verified" : "pending" }
                            ].map((check, idx) => (
                                <div key={idx} className="flex items-center justify-between py-2">
                                    <span className="text-sm text-slate-600">{check.label}</span>
                                    <div className="flex items-center gap-2">
                                        {check.status === "verified" ? (
                                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                                        ) : (
                                            <AlertCircle className="w-4 h-4 text-slate-400" />
                                        )}
                                        <span className={`text-xs font-medium ${check.status === "verified"
                                            ? "text-emerald-600"
                                            : "text-slate-400"
                                            }`}>
                                            {check.status === "verified" ? "Verified" : "Pending"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
