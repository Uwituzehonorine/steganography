import sys
import os
import json
import math
import numpy as np
import scipy.io.wavfile as scp

def reverse_string(input_string):
    return input_string[::-1]

def embed(audio_path, payload, output_path):
    samplerate, audiodata = scp.read(audio_path)
    
    if len(audiodata.shape) > 1:
        audiodata = audiodata[:, 0]
        
    audiodata_int32 = audiodata.astype(np.int32)
    normaudiodata_arr = audiodata_int32 + 32768
    num_samples = len(normaudiodata_arr)

    # Step 2 - Interpolation
    interpolasi = np.zeros(2 * num_samples - 1, dtype=np.int32)
    interpolasi[0::2] = normaudiodata_arr
    if num_samples > 1:
        interpolasi[1::2] = np.floor((normaudiodata_arr[:-1] + normaudiodata_arr[1:]) / 2).astype(np.int32)

    # Step 3 - Distance Variable
    duration = len(interpolasi) / samplerate
    C = (duration * 1000.0) / (len(interpolasi) * 2.0)

    # Pre-calculate N values
    num_samples_interpolasi = len(interpolasi)
    even_indices = np.arange(0, num_samples_interpolasi - 1, 2)
    diffs = interpolasi[even_indices].astype(np.float64) - interpolasi[even_indices + 1].astype(np.float64)
    d_vals = np.sqrt(1.0 + diffs**2)
    N_vals = np.floor(np.log2(np.maximum(1e-10, C * d_vals))).astype(np.int32)

    # Steps 4 and 5 - Embedding
    payload = payload.replace('\t', '')
    n_payload = len(payload)
    nSpace = 0
    truekey_parts = []
    
    original_interpolated = interpolasi.copy()

    for idx_in_evens, i in enumerate(even_indices):
        if nSpace >= n_payload:
            break
            
        N = N_vals[idx_in_evens]
        absN = abs(N)
        
        if absN == 0:
            key = '00'
        else:
            end_idx = min(nSpace + absN, n_payload)
            pn = payload[nSpace:end_idx]
            nSpace += absN
            
            odd_idx = i + 1
            key_chars = []
            for bit in pn:
                if bit == '1':
                    key_chars.append('11')
                    interpolasi[odd_idx] += 1
                else:
                    key_chars.append('10')
                    interpolasi[odd_idx] -= 1
            key = "".join(key_chars)
        
        truekey_parts.append(reverse_string(key))

    # Save Stego
    stego_audio_data = (interpolasi - 32768).astype(np.int16)
    scp.write(output_path, samplerate, stego_audio_data)

    # PSNR
    mse = np.mean((interpolasi.astype(np.float64) - original_interpolated.astype(np.float64))**2)
    max_val = 65535.0
    psnr_value = 100.0 if mse == 0 else 10 * np.log10((max_val ** 2) / mse)

    return {
        "psnr": psnr_value,
        "mse": mse,
        "truekey": "".join(truekey_parts),
        "payload_size": n_payload
    }

def extract(audio_path, truekey, original_payload_len):
    samplerate, faudiodata = scp.read(audio_path)
    if len(faudiodata.shape) > 1:
        faudiodata = faudiodata[:, 0]
    normstegodata_arr = faudiodata.astype(np.int32) + 32768

    oriSample = normstegodata_arr[0::2]
    num_ori = len(oriSample)
    stegoInterpolasi = np.zeros(2 * num_ori - 1, dtype=np.int32)
    stegoInterpolasi[0::2] = oriSample
    if num_ori > 1:
        stegoInterpolasi[1::2] = np.floor((oriSample[:-1] + oriSample[1:]) / 2).astype(np.int32)

    stegoDuration = len(stegoInterpolasi) / samplerate
    sC = (stegoDuration * 1000.0) / (len(stegoInterpolasi) * 2.0)

    # Pre-calculate sN
    num_stego_inter = len(stegoInterpolasi)
    even_indices = np.arange(0, num_stego_inter - 1, 2)
    diffs = stegoInterpolasi[even_indices].astype(np.float64) - stegoInterpolasi[even_indices + 1].astype(np.float64)
    sd_vals = np.sqrt(1.0 + diffs**2)
    sN_vals = np.floor(np.log2(np.maximum(1e-10, sC * sd_vals))).astype(np.int32)

    temp_truekey = truekey
    spay_parts = []
    
    for idx_in_evens, z in enumerate(even_indices):
        if len(temp_truekey) == 0:
            break
            
        sN = sN_vals[idx_in_evens]
        absSN = abs(sN)
        
        if absSN == 0:
            if temp_truekey[:2] == '00':
                temp_truekey = temp_truekey[2:]
        else:
            retpay_chars = []
            for _ in range(absSN):
                if len(temp_truekey) < 2: break
                bits = temp_truekey[:2]
                temp_truekey = temp_truekey[2:]
                if bits == '01': retpay_chars.append('0')
                elif bits == '11': retpay_chars.append('1')
            
            spay_parts.append(reverse_string("".join(retpay_chars)))

    return {"retrieved_payload": "".join(spay_parts)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No operation"}))
        sys.exit(1)

    op = sys.argv[1]
    try:
        if op == "embed":
            print(json.dumps({"success": True, "data": embed(sys.argv[2], sys.argv[3], sys.argv[4])}))
        elif op == "extract":
            print(json.dumps({"success": True, "data": extract(sys.argv[2], sys.argv[3], 0)}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
