"""Narração dos guias com Piper (voz pt_BR faber). Lê JSON {"items":[{"text","out"}]} no stdin e grava cada WAV."""
import json, os, sys, wave
import piper
from piper import PiperVoice

model = os.path.abspath(sys.argv[1])
items = json.load(sys.stdin)["items"]
# O espeak não aceita caminho longo: entra na pasta do pacote e passa o caminho relativo.
os.chdir(os.path.dirname(os.path.dirname(piper.__file__)))
voice = PiperVoice.load(model, espeak_data_dir="piper/espeak-ng-data")
for it in items:
    with wave.open(it["out"], "wb") as w:
        voice.synthesize_wav(it["text"], w)
