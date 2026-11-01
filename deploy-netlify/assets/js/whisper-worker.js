/* ==========================================================================
   NuVerter — Whisper speech recognition worker
   Runs model download + inference off the main thread so the UI stays
   responsive (video keeps playing, progress bar keeps updating).
   ========================================================================== */
'use strict';

const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';
const SAMPLE_RATE = 16000;

const LANG_NAMES = {
  en: 'english',
  es: 'spanish',
  fr: 'french',
  de: 'german',
  it: 'italian',
  pt: 'portuguese',
  ru: 'russian',
  ja: 'japanese',
  ko: 'korean',
  zh: 'chinese'
};

let loadPromise = null;
let loadedModel = '';
let transcriber = null;

function send(type, payload) {
  self.postMessage(Object.assign({ type }, payload || {}));
}

function report(info) {
  if (!info) return;
  if (info.status === 'progress' && typeof info.progress === 'number') {
    send('model-progress', { progress: info.progress, file: info.file || '' });
  } else if (info.status === 'initiate') {
    send('model-initiate', { file: info.file || '' });
  } else if (info.status === 'done') {
    send('model-file-done', { file: info.file || '' });
  }
}

async function loadPipeline(model, modelsPath) {
  if (transcriber && loadedModel === model) return transcriber;
  if (!loadPromise) {
    loadPromise = (async () => {
      const mod = await import(TRANSFORMERS_URL);
      const { pipeline, env } = mod;
      env.useBrowserCache = true;
      if (modelsPath) {
        env.allowLocalModels = true;
        env.localModelPath = String(message.modelsPath).replace(/\\/g, '/') + '/';
        env.allowRemoteModels = true;
      } else {
        env.allowLocalModels = false;
      }
      try {
        if (env.backends?.onnx?.wasm) {
          env.backends.onnx.wasm.numThreads = Math.max(1, Math.min(4, (self.navigator?.hardwareConcurrency || 2)));
          env.backends.onnx.wasm.simd = true;
        }
      } catch {}
      const preferredDevice = self.navigator?.gpu ? 'webgpu' : 'wasm';
      let pipe;
      try {
        pipe = await pipeline('automatic-speech-recognition', model, {
          quantized: true,
          device: preferredDevice,
          progress_callback: report
        });
      } catch (e) {
        pipe = await pipeline('automatic-speech-recognition', model, {
          quantized: true,
          device: 'wasm',
          progress_callback: report
        });
      }
      transcriber = pipe;
      loadedModel = model;
      return pipe;
    })();
  }
  try {
    return await loadPromise;
  } catch (err) {
    loadPromise = null;
    throw err;
  }
}

async function transcribe(message) {
  const audio = message.audio;
  const model = message.model;
  if (!audio || !audio.length) throw new Error('No audio to transcribe.');

  send('stage', { stage: 'model' });
  const pipe = await loadPipeline(model, message.modelsPath);
  send('stage', { stage: 'transcribing' });

  const chunkSeconds = Number(message.chunkSeconds) || 30;
  const chunkSize = Math.max(SAMPLE_RATE, Math.floor(chunkSeconds * SAMPLE_RATE));
  const totalChunks = Math.max(1, Math.ceil(audio.length / chunkSize));
  const language = LANG_NAMES[message.language] || undefined;
  const allCues = [];
  let lastText = '';

  for (let index = 0; index < totalChunks; index += 1) {
    const from = index * chunkSize;
    const to = Math.min(audio.length, from + chunkSize);
    const slice = audio.subarray(from, to);
    const offset = from / SAMPLE_RATE;
    const options = { return_timestamps: true };
    if (language) {
      options.language = language;
      options.task = 'transcribe';
    }

    const output = await pipe(slice, options);
    const chunks = (output && output.chunks) || [];
    if (chunks.length) {
      for (const chunk of chunks) {
        const start = (chunk.timestamp && chunk.timestamp[0]) || 0;
        const end = (chunk.timestamp && chunk.timestamp[1]) || start + 2;
        const text = String(chunk.text || '').trim();
        if (text && end > start) {
          allCues.push({ start: offset + start, end: offset + end, text });
          lastText = text;
        }
      }
    } else {
      const text = String((output && output.text) || '').trim();
      if (text) {
        allCues.push({ start: offset, end: offset + chunkSeconds, text });
        lastText = text;
      }
    }

    send('chunk', {
      done: index + 1,
      total: totalChunks,
      text: lastText.slice(0, 140)
    });
  }

  send('done', { cues: allCues, text: lastText });
}

self.onmessage = (event) => {
  const message = event.data || {};
  if (message.type !== 'transcribe') return;
  transcribe(message).catch((err) => {
    send('error', { message: (err && err.message) || String(err) });
  });
};
