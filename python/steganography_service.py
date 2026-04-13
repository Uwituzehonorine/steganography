import sys
import os
import json
import math
import numpy as np
import scipy.io.wavfile as scp
from pydub import AudioSegment
import tempfile

def reverse_string(input_string):
    return input_string[::-1]

def convert_audio_to_wav(input_path):
    """Convert any audio format to WAV format for processing"""
    import tempfile
    
    try:
        # First try to read as WAV directly
        try:
            samplerate, audiodata = scp.read(input_path)
            print(f"Successfully read WAV file directly: {input_path}", file=sys.stderr)
            return input_path, samplerate, audiodata
        except Exception as wav_error:
            print(f"Direct WAV reading failed: {wav_error}. Attempting conversion...", file=sys.stderr)
            
        # Check if file exists and is readable
        if not os.path.exists(input_path):
            raise Exception(f"Input file does not exist: {input_path}")
            
        file_size = os.path.getsize(input_path)
        if file_size == 0:
            raise Exception(f"Input file is empty: {input_path}")
            
        # Basic file format validation by checking file headers
        with open(input_path, 'rb') as f:
            header = f.read(16)
            
        # Check for common audio file signatures
        audio_signatures = [
            b'RIFF',     # WAV
            b'ID3',      # MP3 
            b'fLaC',     # FLAC
            b'OggS',     # OGG
            b'\xff\xfb', # MP3 (no ID3)
            b'\xff\xfa', # MP3 (no ID3)  
            b'ftypM4A',  # M4A (partial)
            b'ftyp',     # Generic MP4 container
            b'\x1a\x45\xdf\xa3', # WebM/Matroska
        ]
        
        is_audio = any(header.startswith(sig) for sig in audio_signatures)
        if not is_audio and len(header) >= 8:
            # Check for M4A/MP4 audio in different positions
            if b'ftyp' in header[:8]:
                is_audio = True
                
        if not is_audio:
            raise Exception(f"File does not appear to be a valid audio format. Header: {header[:8].hex()}")
            
        print(f"Converting audio format to WAV: {input_path} ({file_size} bytes)", file=sys.stderr)
        
        # Load audio file with pydub (supports many formats)
        audio = AudioSegment.from_file(input_path)
        
        original_duration = len(audio)
        print(f"Audio loaded: {original_duration}ms, {audio.channels} channels, {audio.frame_rate}Hz", file=sys.stderr)
        
        # Automatic standardization for large files (more conservative)
        audio_size_mb = file_size / (1024 * 1024)
        
        if audio_size_mb > 100:  # Only compress very large files
            print(f"Very large file detected ({audio_size_mb:.1f}MB) - applying minimal optimization", file=sys.stderr)
            target_sample_rate = 44100  # Keep high quality even for large files
            
            # Only trim extremely long audio (limit to 15 minutes)
            max_duration = 15 * 60 * 1000  # 15 minutes in milliseconds
            if original_duration > max_duration:
                print(f"Trimming audio from {original_duration/1000:.1f}s to {max_duration/1000:.1f}s", file=sys.stderr)
                audio = audio[:max_duration]
        else:
            # Minimal processing for better quality
            target_sample_rate = 44100  # Always keep high sample rate
            
        # Convert to mono if stereo (for algorithm compatibility)
        if audio.channels > 1:
            audio = audio.set_channels(1)
            print("Converted to mono", file=sys.stderr)
            
        # Maintain high sample rate for better quality
        if audio.frame_rate != target_sample_rate:
            audio = audio.set_frame_rate(target_sample_rate)
            print(f"Set sample rate to {target_sample_rate}Hz", file=sys.stderr)
            
        # Light normalization (reduce aggressive normalization)
        max_db_boost = 3.0  # Limit normalization boost
        if audio.max_dBFS < -max_db_boost:
            audio = audio.normalize(headroom=1.0)  # Gentle normalization
            print("Applied gentle volume normalization", file=sys.stderr)
        
        # Export to temporary WAV file with high quality settings
        temp_wav = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
        temp_wav_path = temp_wav.name
        temp_wav.close()
        
        print(f"Exporting to temporary WAV: {temp_wav_path}", file=sys.stderr)
        audio.export(
            temp_wav_path, 
            format='wav',
            parameters=[
                "-ac", "1",  # Mono
                "-ar", str(target_sample_rate),  # High sample rate
                "-acodec", "pcm_s16le",  # 16-bit PCM (standard quality)
            ]
        )
        
        # Verify the converted file
        if not os.path.exists(temp_wav_path) or os.path.getsize(temp_wav_path) == 0:
            raise Exception("Converted WAV file is empty or missing")
        
        # Read the converted WAV
        samplerate, audiodata = scp.read(temp_wav_path)
        new_size = os.path.getsize(temp_wav_path)
        compression_ratio = (file_size - new_size) / file_size * 100 if file_size > new_size else 0
        
        print(f"Successfully converted and read audio: {len(audiodata)} samples at {samplerate}Hz", file=sys.stderr)
        print(f"File size optimized: {file_size} -> {new_size} bytes ({compression_ratio:.1f}% reduction)", file=sys.stderr)
        
        return temp_wav_path, samplerate, audiodata
        
    except Exception as e:
        error_msg = f"Failed to convert audio format: {str(e)}"
        print(error_msg, file=sys.stderr)
        raise Exception(error_msg)

def embed(audio_path, payload, output_path):
    # Convert input audio to WAV format
    converted_path, samplerate, audiodata = convert_audio_to_wav(audio_path)
    
    try:
        if len(audiodata.shape) > 1:
            audiodata = audiodata[:, 0]
            
        # Convert text payload to binary representation
        binary_payload = ''.join(format(ord(char), '08b') for char in payload.replace('\t', ''))
        print(f"Text '{payload}' converted to binary: {len(binary_payload)} bits", file=sys.stderr)
        
        # Use LSB (Least Significant Bit) steganography for minimal audio impact
        audiodata_copy = audiodata.astype(np.int32).copy()
        payload_length = len(binary_payload)
        
        # Check if we have enough samples for the payload
        if payload_length > len(audiodata_copy):
            raise Exception(f"Payload too large: {payload_length} bits needed, but only {len(audiodata_copy)} samples available")
        
        print(f"Embedding {payload_length} bits into {len(audiodata_copy)} audio samples using LSB method", file=sys.stderr)
        
        # Embed payload length first (32 bits)
        length_binary = format(payload_length, '032b')
        full_payload = length_binary + binary_payload
        
        modifications = 0
        original_audio = audiodata_copy.copy()
        
        # Use sparse embedding - only modify every Nth sample for better quality
        step_size = max(1, len(audiodata_copy) // (len(full_payload) * 4))  # Spread out modifications
        print(f"Using step size {step_size} for sparse embedding", file=sys.stderr)
        
        for i, bit in enumerate(full_payload):
            if i >= len(audiodata_copy):
                break
                
            sample_idx = i * step_size
            if sample_idx >= len(audiodata_copy):
                break
            
            # Get current sample
            current_sample = audiodata_copy[sample_idx]
            
            # Modify only the least significant bit
            if bit == '1':
                # Set LSB to 1
                new_sample = (current_sample & 0xFFFE) | 1
            else:
                # Set LSB to 0  
                new_sample = current_sample & 0xFFFE
                
            # Always apply the modification to ensure consistent extraction positions
            # Even if the value doesn't change, we need to maintain bit positions
            audiodata_copy[sample_idx] = new_sample
            if new_sample != current_sample:
                modifications += 1
        
        print(f"Made only {modifications} minimal LSB modifications (out of {len(audiodata_copy)} samples)", file=sys.stderr)
        
        # Create a simple key for extraction
        extraction_key = f"LSB_SPARSE_{step_size}_{payload_length}"
        
        # Save the modified audio directly (no additional processing)
        print(f"Saving high-quality audio with minimal modifications", file=sys.stderr)
        scp.write(output_path, samplerate, audiodata_copy.astype(np.int16))
        
        # Calculate actual PSNR
        mse = np.mean((audiodata_copy.astype(np.float64) - original_audio.astype(np.float64))**2)
        max_val = 32767.0
        psnr_value = float('inf') if mse == 0 else 20 * np.log10(max_val / np.sqrt(mse))
        
        print(f"Audio quality: MSE={mse:.10f}, PSNR={psnr_value:.2f}dB", file=sys.stderr)
        print(f"Output file size: {os.path.getsize(output_path)} bytes", file=sys.stderr)

        return {
            "psnr": psnr_value,
            "mse": mse,
            "truekey": extraction_key,
            "payload_size": payload_length
        }
        
    finally:
        # Clean up temporary WAV file if it was created
        if converted_path != audio_path and os.path.exists(converted_path):
            try:
                os.unlink(converted_path)
            except:
                pass

def extract(audio_path, truekey, original_payload_len):
    # Convert input audio to WAV format
    converted_path, samplerate, faudiodata = convert_audio_to_wav(audio_path)
    
    try:
        if len(faudiodata.shape) > 1:
            faudiodata = faudiodata[:, 0]
        
        audiodata = faudiodata.astype(np.int32)
        
        # Validate original_payload_len to prevent division by zero
        if original_payload_len is None or original_payload_len <= 0:
            original_payload_len = 64  # Default fallback payload length in bits
            print(f"Invalid original payload length, using default: {original_payload_len} bits", file=sys.stderr)
        
        # Parse extraction key to get parameters
        print(f"Received extraction key: '{truekey[:100]}...'" if len(truekey) > 100 else f"Received extraction key: '{truekey}'", file=sys.stderr)
        
        # Handle full key file format (extract just the key value)
        actual_key = truekey
        if "EXTRACTION_KEY=" in truekey:
            # Extract just the key value from the file format
            for line in truekey.split('\n'):
                if line.startswith('EXTRACTION_KEY='):
                    actual_key = line.split('=', 1)[1].strip()
                    print(f"Extracted key from file format: '{actual_key}'", file=sys.stderr)
                    break
        
        try:
            parts = actual_key.split('_')
            print(f"Key parts: {parts}", file=sys.stderr)
            if len(parts) >= 4 and parts[0] == 'LSB' and parts[1] == 'SPARSE':
                step_size = int(parts[2])
                expected_payload_length = int(parts[3])
                is_lsb_sparse = True
                print(f"Using LSB extraction with step size {step_size}, expected payload length {expected_payload_length}", file=sys.stderr)
            else:
                # Fallback for old format or manual keys - safe division
                step_size = max(1, len(audiodata) // max(1, (original_payload_len * 4)))
                expected_payload_length = original_payload_len
                is_lsb_sparse = False
                print(f"Using fallback LSB extraction with step size {step_size} (key format not recognized)", file=sys.stderr)
        except Exception as parse_error:
            # Safe fallback calculation
            step_size = max(1, len(audiodata) // max(1, (original_payload_len * 4)))
            expected_payload_length = original_payload_len
            is_lsb_sparse = False
            print(f"Key parsing failed ({parse_error}), using fallback step size {step_size}", file=sys.stderr)
        
        # For LSB_SPARSE format, skip length extraction and use expected length directly
        if is_lsb_sparse:
            payload_length = expected_payload_length
            print(f"Using direct payload length from key: {payload_length} bits", file=sys.stderr)
            # IMPORTANT: For LSB_SPARSE, we need to start from bit 32 because embedding included length prefix
            start_idx = 32  # Skip the 32-bit length that was embedded first
        else:
            # Extract payload length first (32 bits) for other formats
            length_bits = ""
            for i in range(32):
                sample_idx = i * step_size
                if sample_idx >= len(audiodata):
                    print(f"Reached end of audio while extracting length at bit {i}", file=sys.stderr)
                    break
                sample = audiodata[sample_idx]
                length_bits += str(sample & 1)  # Get LSB
            
            if len(length_bits) == 32:
                try:
                    payload_length = int(length_bits, 2)
                    print(f"Extracted payload length: {payload_length} bits", file=sys.stderr)
                    # Safety check for payload length
                    if payload_length <= 0 or payload_length > 10000:  # Reasonable limits
                        print(f"Invalid payload length {payload_length}, using expected: {expected_payload_length}", file=sys.stderr)
                        payload_length = expected_payload_length
                except Exception as length_error:
                    payload_length = expected_payload_length
                    print(f"Failed to extract length ({length_error}), using expected: {payload_length}", file=sys.stderr)
            else:
                payload_length = expected_payload_length
                print(f"Insufficient bits for length ({len(length_bits)}/32), using expected: {payload_length}", file=sys.stderr)
        
        # Safety check to prevent issues
        if payload_length <= 0:
            payload_length = expected_payload_length
            print(f"Corrected zero/negative payload length to: {payload_length}", file=sys.stderr)
        
        # Extract actual payload
        binary_result = ""
        # start_idx already set above based on format type
        
        print(f"Starting payload extraction: {payload_length} bits with step size {step_size}, start_idx {start_idx}", file=sys.stderr)
        
        for i in range(payload_length):
            try:
                bit_idx = start_idx + i
                sample_idx = bit_idx * step_size
                if sample_idx >= len(audiodata):
                    print(f"Reached end of audio at bit {i}/{payload_length}", file=sys.stderr)
                    break
                
                sample = audiodata[sample_idx]
                binary_result += str(sample & 1)  # Extract LSB
            except Exception as extraction_error:
                print(f"Error extracting bit {i}: {extraction_error}", file=sys.stderr)
                break
        
        print(f"Extracted binary data: {binary_result[:50]}... (length: {len(binary_result)} bits)", file=sys.stderr)
        
        # Convert binary string back to text
        try:
            # Ensure we have complete bytes (multiples of 8 bits)
            remainder = len(binary_result) % 8
            if remainder != 0:
                # Truncate to complete bytes only if there's actually a remainder
                binary_result = binary_result[:len(binary_result) - remainder]
                print(f"Truncated to complete bytes: {len(binary_result)} bits", file=sys.stderr)
            
            text_result = ""
            if len(binary_result) > 0:  # Safety check to prevent division by zero
                for i in range(0, len(binary_result), 8):
                    byte = binary_result[i:i+8]
                    if len(byte) == 8:
                        char_code = int(byte, 2)
                        if 32 <= char_code <= 126:  # Printable ASCII range
                            text_result += chr(char_code)
                        elif char_code == 0:  # Handle null terminator
                            break
                        else:
                            print(f"Skipping non-printable character: {char_code}", file=sys.stderr)
            else:
                print("No binary data extracted - binary result is empty", file=sys.stderr)
            
            print(f"Extracted text: '{text_result}'", file=sys.stderr)
            return {"retrieved_payload": text_result}
            
        except Exception as conversion_error:
            print(f"Binary to text conversion failed: {conversion_error}", file=sys.stderr)
            print("Returning raw binary data instead", file=sys.stderr)
            return {"retrieved_payload": binary_result}
        
    finally:
        # Clean up temporary WAV file if it was created
        if converted_path != audio_path and os.path.exists(converted_path):
            try:
                os.unlink(converted_path)
            except:
                pass

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No operation"}))
        sys.exit(1)

    op = sys.argv[1]
    try:
        if op == "embed":
            print(json.dumps({"success": True, "data": embed(sys.argv[2], sys.argv[3], sys.argv[4])}))
        elif op == "extract":
            # Use payload_len from arguments if provided, otherwise use safe default
            payload_len = int(sys.argv[4]) if len(sys.argv) > 4 else 64  # Default 64 bits (8 characters)
            print(json.dumps({"success": True, "data": extract(sys.argv[2], sys.argv[3], payload_len)}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
