import sys
import os
import json
import math
import numpy as np
import scipy.io.wavfile as scp

def reverse_string(input_string):
    return input_string[::-1]

def embed(audio_path, payload, output_path):
    # Step 1 - Read audio and sample to 16-bit and normalize audio sample
    samplerate, audiodata = scp.read(audio_path)
    
    # Check if stereo, convert to mono for simplicity or handle first channel
    if len(audiodata.shape) > 1:
        audiodata = audiodata[:, 0]
        
    normaudiodata = [int(x) + 32768 for x in audiodata]

    ## Step 2 - Make interpolation sample between each original sample
    interpolasi = np.resize(normaudiodata, ((len(normaudiodata)*2)-1))
    x = 0
    for i in range(len(interpolasi)):
        # Even Sample (Original Sample)
        if i % 2 == 0:
            interpolasi[i] = normaudiodata[int(i/2)]
        # Odd Sample (Interpolation)
        else:
            interpolasi[i] = math.floor((normaudiodata[int((i-1)/2)]+normaudiodata[i-x])/2)
            x+=1

    # Inter Audio (before embedding) - save for PSNR
    inter_audio_vals = [int(x) - 32768 for x in interpolasi]
    inter_audio_data = np.array(inter_audio_vals, dtype=np.int16)

    ## Step 3 - Find variable C
    duration = len(interpolasi) / samplerate
    C = (duration * 1000)/((len(interpolasi))*2)

    ## Steps 4 and 5 - Embedding Process
    payload = payload.replace('\t', '')
    nSpace = 0
    interpolasi = [int(x) + 32768 for x in inter_audio_vals]
    truekey = ''
    
    # Initialize pn and N for the first use
    pn = ""
    N = 0

    for i in range(len(interpolasi)-1):
        # Step 5 - Odd number (Interpolation)
        if i % 2 != 0:
            key = ''
            if abs(N) == 0:
                key += '00'
            for x_idx in range(abs(N)):
                if len(pn) < abs(N) and x_idx == len(pn):
                    break
                r = interpolasi[i] % 2 
                if int(pn[x_idx]) > 0:
                    key += '11'
                    interpolasi[i] += 1
                elif int(pn[x_idx]) == 0:
                    key += '10'
                    interpolasi[i] -= 1
            reversed_key = reverse_string(key)
            truekey += reversed_key
            if nSpace >= len(payload):
                break
        # Step 4 - Even number except last (Original)
        elif i < len(interpolasi):
            d = math.sqrt((i+1-(i+2))**2+(interpolasi[i]-interpolasi[i+1])**2)
            N = math.floor(math.log2(C * d))
            if N == 0:
                pn = "0" # dummy if N=0 to avoid len error
                nSpace+=abs(N)
            elif nSpace < len(payload):
                end_idx = min(nSpace + abs(N), len(payload))
                pn = payload[nSpace:end_idx]
                nSpace+=abs(N)

    ## Step 6 - Denormalize and save Stego Audio sample
    stego_audio_vals = [int(x) - 32768 for x in interpolasi]
    stego_audio_data = np.array(stego_audio_vals, dtype=np.int16)
    scp.write(output_path, samplerate, stego_audio_data)

    ## Find PSNR value
    min_length = min(len(inter_audio_data), len(stego_audio_data))
    original_audio = inter_audio_data[:min_length].astype(np.float64)
    reconstructed_audio = stego_audio_data[:min_length].astype(np.float64)

    tes = (original_audio - reconstructed_audio)
    mse = np.mean(tes ** 2)
    max_possible_value = 2 ** 16
    
    if mse == 0:
        psnr_value = 100.0 # Perfect fidelity
    else:
        psnr_value = 10 * np.log10((max_possible_value ** 2) / mse)

    return {
        "psnr": psnr_value,
        "mse": mse,
        "truekey": truekey,
        "payload_size": len(payload)
    }

def extract(audio_path, truekey, original_payload_len):
    samplerate, faudiodata = scp.read(audio_path)
    normstegodata = [int(x) + 32768 for x in faudiodata]

    ## Step 2-1 - Divide sample between odd (changed) and even (non-changed) samples
    oriSample = np.resize(normstegodata, (int((len(normstegodata)+1)/2)))
    paySample = np.resize(normstegodata, (int(len(normstegodata)-((len(normstegodata)+1)/2))))
    for i in range(len(normstegodata)):
        if i % 2 == 0:
            oriSample[int(i/2)] = normstegodata[i]
        else:
            paySample[int((i-1)/2)] = normstegodata[i]

    ## Step 2-2 - Interpolation from the divided even sample
    stegoInterpolasi = np.resize(oriSample, ((len(oriSample)*2)-1))
    x_off = 0
    for i in range(len(stegoInterpolasi)):
        if i % 2 == 0:
            stegoInterpolasi[i] = oriSample[int(i/2)]
        else:
            stegoInterpolasi[i] = math.floor((oriSample[int((i-1)/2)]+oriSample[i-x_off])/2)
            x_off+=1

    stegoDuration = len(stegoInterpolasi) / samplerate
    sC = (stegoDuration * 1000)/((len(stegoInterpolasi))*2)

    ## Steps 3-2 and 4 - Extraction Process
    temp_truekey = truekey
    spay = ''
    y = 1
    sN = 0
    for z in range(len(stegoInterpolasi)-1):
        if z % 2 != 0:
            # Odd sample
            retpay = ''
            if abs(sN) == 0 and temp_truekey[:2] == '00':
                temp_truekey = temp_truekey[2:]
            for x_idx in range(abs(sN)):
                if len(temp_truekey) == 0:
                    break
                elif temp_truekey[:2] == '01':
                    retpay += '0'
                    temp_truekey = temp_truekey[2:]
                elif temp_truekey[:2] == '11':
                    retpay += '1'
                    temp_truekey = temp_truekey[2:]
            reversed_pay = reverse_string(retpay)
            spay += reversed_pay
            if len(temp_truekey) == 0:
                break
        elif z % 2 == 0:
            sd = math.sqrt((z+1-(z+2))**2+(stegoInterpolasi[z]-stegoInterpolasi[z+1])**2)
            sN = math.floor(math.log2(sC * sd))

    return {
        "retrieved_payload": spay
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No operation specified"}))
        sys.exit(1)

    operation = sys.argv[1]
    
    try:
        if operation == "embed":
            audio_file = sys.argv[2]
            payload = sys.argv[3]
            output_file = sys.argv[4]
            result = embed(audio_file, payload, output_file)
            print(json.dumps({"success": True, "data": result}))
        elif operation == "extract":
            audio_file = sys.argv[2]
            truekey = sys.argv[3]
            # payload_len = int(sys.argv[4])
            result = extract(audio_file, truekey, 0)
            print(json.dumps({"success": True, "data": result}))
        else:
            print(json.dumps({"success": False, "error": "Unknown operation"}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
