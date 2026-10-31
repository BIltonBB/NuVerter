/* ==========================================================================
   NuVerter — local AI text-to-image
   Stable Diffusion Turbo (ONNX Runtime Web + WebGPU).

   Nothing is uploaded. The model files are read from a folder you pick, so
   you can keep them on an external drive and delete them whenever you want.
   ========================================================================== */

const ORT_VERSION = '1.20.1';
const ORT_BASE = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;

export const LOCAL_MODEL_SPEC = {
  id: 'sd-turbo',
  label: 'SD-Turbo',
  download: '2.5 GB',
  ram: '4–6 GB',
  size: 512,
  repo: 'https://huggingface.co/schmuell/sd-turbo-ort-web/tree/main',
  files: [
    'unet/model.onnx',
    'text_encoder/model.onnx',
    'vae_decoder/model.onnx',
    'tokenizer/vocab.json',
    'tokenizer/merges.txt'
  ]
};

export const ONLINE_MODELS = [
  {
    id: 'flux',
    label: 'FLUX',
    note: 'Online · balanced quality',
    download: '0 GB',
    ram: '0 GB'
  },
  {
    id: 'gptimage',
    label: 'GPT Image',
    note: 'Online · prompt following',
    download: '0 GB',
    ram: '0 GB'
  }
];

let ortPromise = null;

export function getOrt() {
  if (!ortPromise) {
    ortPromise = (async () => {
      const ort = await import(/* @vite-ignore */ ORT_BASE + 'ort.webgpu.min.mjs');
      ort.env.wasm.wasmPaths = ORT_BASE;
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.simd = true;
      return ort;
    })();
  }
  return ortPromise;
}

export function hasWebGpu() {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

export async function hasShaderF16() {
  try {
    if (!hasWebGpu()) return false;
    const adapter = await navigator.gpu.requestAdapter();
    return !!adapter && adapter.features.has('shader-f16');
  } catch {
    return false;
  }
}

/* ---------- CLIP byte-level BPE tokenizer ---------- */

const CLIP_PATTERN = /<\|startoftext\|>|<\|endoftext\|>|'s|'t|'re|'ve|'m|'ll|'d|[\p{L}]+|[\p{N}]|[^\s\p{L}\p{N}]+/gu;

function bytesToUnicode() {
  const bytes = [];
  const chars = [];
  for (let i = 33; i <= 126; i++) { bytes.push(i); chars.push(i); }
  for (let i = 161; i <= 172; i++) { bytes.push(i); chars.push(i); }
  for (let i = 174; i <= 255; i++) { bytes.push(i); chars.push(i); }
  let extra = 0;
  for (let i = 0; i < 256; i++) {
    if (!bytes.includes(i)) {
      bytes.push(i);
      chars.push(256 + extra);
      extra += 1;
    }
  }
  const map = new Map();
  for (let i = 0; i < bytes.length; i++) map.set(bytes[i], String.fromCharCode(chars[i]));
  return map;
}

function getPairs(word) {
  const pairs = new Set();
  for (let i = 1; i < word.length; i++) pairs.add(word[i - 1] + '\u0000' + word[i]);
  return pairs;
}

export class ClipTokenizer {
  constructor(vocab, mergesText) {
    this.encoder = new Map(Object.entries(vocab));
    this.byteEncoder = bytesToUnicode();
    this.ranks = new Map();
    this.cache = new Map();
    const lines = String(mergesText).split(/\r?\n/);
    let rank = 0;
    for (const line of lines) {
      if (!line || line.startsWith('#')) continue;
      const parts = line.trim().split(/\s+/);
      if (parts.length !== 2) continue;
      this.ranks.set(parts[0] + '\u0000' + parts[1], rank++);
    }
  }

  bpe(token) {
    const cached = this.cache.get(token);
    if (cached !== undefined) return cached;

    let word = Array.from(token);
    if (!word.length) return token;
    word[word.length - 1] += '</w>';

    let pairs = getPairs(word);
    while (pairs.size) {
      let best = null;
      let bestRank = Infinity;
      for (const pair of pairs) {
        const rank = this.ranks.get(pair);
        if (rank !== undefined && rank < bestRank) {
          best = pair;
          bestRank = rank;
        }
      }
      if (!best) break;

      const [first, second] = best.split('\u0000');
      const next = [];
      for (let i = 0; i < word.length;) {
        if (word[i] === first && i < word.length - 1 && word[i + 1] === second) {
          next.push(first + second);
          i += 2;
        } else {
          next.push(word[i]);
          i += 1;
        }
      }
      word = next;
      if (word.length === 1) break;
      pairs = getPairs(word);
    }

    const result = word.join(' ');
    this.cache.set(token, result);
    return result;
  }

  encode(text, maxLength = 77) {
    const ids = [];
    const normalized = String(text || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const matches = normalized.match(CLIP_PATTERN) || [];
    const utf8 = new TextEncoder();

    for (const match of matches) {
      if (match === '<|startoftext|>' || match === '<|endoftext|>') continue;
      let mapped = '';
      for (const byte of utf8.encode(match)) mapped += this.byteEncoder.get(byte);
      for (const piece of this.bpe(mapped).split(' ')) {
        const id = this.encoder.get(piece);
        if (id !== undefined) ids.push(id);
      }
    }

    const body = ids.slice(0, Math.max(0, maxLength - 2));
    const out = new Int32Array(maxLength);
    out[0] = 49406;
    out.set(body, 1);
    out[1 + body.length] = 49407;
    for (let i = 2 + body.length; i < maxLength; i++) out[i] = 49407;
    return out;
  }
}

/* ---------- file handling ---------- */

export async function readAllFiles(dirHandle) {
  const entries = [];
  async function walk(handle, prefix) {
    for await (const entry of handle.values()) {
      const path = prefix ? prefix + '/' + entry.name : entry.name;
      if (entry.kind === 'file') {
        entries.push({ path, file: await entry.getFile() });
      } else if (entry.kind === 'directory') {
        await walk(entry, path);
      }
    }
  }
  await walk(dirHandle, '');
  return entries;
}

export function fileEntriesFromInput(fileList) {
  return Array.from(fileList || []).map((file) => ({
    path: (file.webkitRelativePath || file.name).replace(/\\/g, '/'),
    file
  }));
}

export function resolveModelFiles(entries) {
  const find = (test) => entries.find((entry) => test(entry.path.toLowerCase(), entry.file));
  const byModel = (folder) => find((path, file) =>
    path.includes(folder + '/') && path.endsWith('model.onnx') && file.size > 1024
  );

  const unet = byModel('unet');
  const textEncoder = byModel('text_encoder');
  const vae = byModel('vae_decoder');
  const vocab = find((path) => path.endsWith('vocab.json'));
  const merges = find((path) => path.endsWith('merges.txt'));

  const missing = [];
  if (!unet) missing.push('unet/model.onnx');
  if (!textEncoder) missing.push('text_encoder/model.onnx');
  if (!vae) missing.push('vae_decoder/model.onnx');
  if (!vocab) missing.push('tokenizer/vocab.json');
  if (!merges) missing.push('tokenizer/merges.txt');

  return { unet, textEncoder, vae, vocab, merges, missing };
}

/* ---------- directory handle persistence ---------- */

const DB_NAME = 'nuverter-ai';
const STORE = 'handles';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveFolderHandle(handle) {
  try { await idbSet('sd-turbo-folder', handle); } catch {}
}

export async function getSavedFolderHandle() {
  try { return await idbGet('sd-turbo-folder'); } catch { return null; }
}

export async function forgetFolderHandle() {
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete('sd-turbo-folder');
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}

export async function ensureFolderPermission(handle, request = false) {
  if (!handle || typeof handle.queryPermission !== 'function') return false;
  const opts = { mode: 'read' };
  try {
    if ((await handle.queryPermission(opts)) === 'granted') return true;
    if (!request) return false;
    return (await handle.requestPermission(opts)) === 'granted';
  } catch {
    return false;
  }
}

/* ---------- pipeline ---------- */

function randn(size) {
  const out = new Float32Array(size);
  for (let i = 0; i < size; i += 2) {
    let u = 0;
    while (u === 0) u = Math.random();
    const v = Math.random();
    const mag = Math.sqrt(-2 * Math.log(u));
    out[i] = mag * Math.cos(2 * Math.PI * v);
    if (i + 1 < size) out[i + 1] = mag * Math.sin(2 * Math.PI * v);
  }
  return out;
}

function tensorToImageData(tensor) {
  const dims = tensor.dims;
  const data = tensor.data;
  const [, c, h, w] = dims.length === 4 ? dims : [1, 3, 512, 512];
  if (c < 3) throw new Error('Unexpected VAE output shape: ' + dims.join('×'));
  const image = new ImageData(w, h);
  const plane = h * w;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const src = y * w + x;
      const dst = (y * w + x) * 4;
      for (let ch = 0; ch < 3; ch++) {
        let value = data[ch * plane + src] / 2 + 0.5;
        if (value < 0) value = 0;
        else if (value > 1) value = 1;
        image.data[dst + ch] = Math.round(value * 255);
      }
      image.data[dst + 3] = 255;
    }
  }
  return image;
}

const SIGMA = 14.6146;
const VAE_SCALE = 0.18215;
const LATENT_SIDE = 64;

export class SdTurboEngine {
  constructor(ort) {
    this.ort = ort;
    this.sessions = null;
    this.tokenizer = null;
    this.ready = false;
  }

  async load(files, onProgress = () => {}) {
    if (!this.ort) throw new Error('ONNX Runtime is not available.');
    const { unet, textEncoder, vae, vocab, merges } = files;

    onProgress({ stage: 'tokenizer', label: 'Reading tokenizer', progress: 0.01 });
    const [vocabText, mergesText] = await Promise.all([vocab.file.text(), merges.file.text()]);
    this.tokenizer = new ClipTokenizer(JSON.parse(vocabText), mergesText);

    const baseOptions = {
      executionProviders: ['webgpu'],
      enableMemPattern: false,
      enableCpuMemArena: false,
      preferredOutputLocation: { last_hidden_state: 'gpu-buffer' },
      extra: {
        session: {
          disable_prepacking: '1',
          use_device_allocator_for_initializers: '1',
          use_ort_model_bytes_directly: '1',
          use_ort_model_bytes_for_initializers: '1'
        }
      }
    };

    const create = async (entry, options, label, at) => {
      onProgress({ stage: 'read', label: 'Reading ' + label, progress: at });
      const bytes = new Uint8Array(await entry.file.arrayBuffer());
      onProgress({ stage: 'compile', label: 'Compiling ' + label, progress: at + 0.08 });
      try {
        return await this.ort.InferenceSession.create(bytes, { ...baseOptions, ...options });
      } catch (error) {
        throw new Error('Could not compile ' + label + '. ' + (error?.message || error));
      }
    };

    try {
      const text = await create(textEncoder, {
        // Leave the sequence length dynamic; forcing 77 produces a bad image
        // with the reference SD-Turbo export.
        freeDimensionOverrides: { batch_size: 1 }
      }, 'text encoder', 0.05);

      const diffusion = await create(unet, {
        freeDimensionOverrides: {
          batch_size: 1,
          num_channels: 4,
          height: LATENT_SIDE,
          width: LATENT_SIDE,
          sequence_length: 77
        }
      }, 'UNet', 0.3);

      const decoder = await create(vae, {
        freeDimensionOverrides: {
          batch_size: 1,
          num_channels_latent: 4,
          height_latent: LATENT_SIDE,
          width_latent: LATENT_SIDE
        }
      }, 'VAE', 0.8);

      this.sessions = { text, diffusion, decoder };
      this.ready = true;
      onProgress({ stage: 'ready', label: 'Model ready', progress: 1 });
      return this;
    } catch (error) {
      this.dispose();
      throw error;
    }
  }

  async generate(prompt, { onStage = () => {} } = {}) {
    if (!this.ready || !this.sessions) throw new Error('Load the local model first.');
    const { text, diffusion, decoder } = this.sessions;
    const ort = this.ort;

    onStage('Encoding prompt');
    const ids = this.tokenizer.encode(prompt, 77);
    const inputIds = new ort.Tensor('int32', ids, [1, 77]);
    let hidden;
    try {
      const encoded = await text.run({ input_ids: inputIds });
      hidden = encoded.last_hidden_state;
    } finally {
      inputIds.dispose?.();
    }

    onStage('Diffusing latents');
    const latentShape = [1, 4, LATENT_SIDE, LATENT_SIDE];
    const count = latentShape.reduce((a, b) => a * b, 1);
    const noise = randn(count);
    const sample = new ort.Tensor('float32', noise, latentShape);
    const scaled = new ort.Tensor('float32', Float32Array.from(noise, (v) => v / Math.sqrt(SIGMA * SIGMA + 1)), latentShape);

    let outSample;
    try {
      const run = await diffusion.run({
        sample: scaled,
        timestep: new ort.Tensor('int64', BigInt64Array.from([999n]), [1]),
        encoder_hidden_states: hidden
      });
      outSample = run.out_sample;
    } finally {
      scaled.dispose?.();
      sample.dispose?.();
      hidden?.dispose?.();
    }

    onStage('Decoding image');
    const finalLatents = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const predicted = noise[i] - SIGMA * outSample.data[i];
      finalLatents[i] = predicted / VAE_SCALE;
    }
    outSample.dispose?.();

    const latentTensor = new ort.Tensor('float32', finalLatents, latentShape);
    let decoded;
    try {
      const run = await decoder.run({ latent_sample: latentTensor });
      decoded = run.sample;
      return tensorToImageData(decoded);
    } finally {
      latentTensor.dispose?.();
      decoded?.dispose?.();
    }
  }

  dispose() {
    try {
      this.sessions?.text?.release?.();
      this.sessions?.diffusion?.release?.();
      this.sessions?.decoder?.release?.();
      this.sessions?.text?.dispose?.();
      this.sessions?.diffusion?.dispose?.();
      this.sessions?.decoder?.dispose?.();
    } catch {}
    this.sessions = null;
    this.ready = false;
  }
}

export async function createEngine(files, onProgress) {
  if (!hasWebGpu()) {
    throw new Error('WebGPU is not available. Open NuVerter in Chrome or Edge 113+ with hardware acceleration enabled.');
  }
  let adapter = null;
  try { adapter = await navigator.gpu.requestAdapter(); } catch {}
  if (!adapter) throw new Error('No WebGPU adapter was found. Enable hardware acceleration and try again.');
  if (!adapter.features.has('shader-f16')) {
    throw new Error('This GPU does not expose shader-f16, which SD-Turbo needs. Try a newer GPU or the online models.');
  }
  const ort = await getOrt();
  const engine = new SdTurboEngine(ort);
  await engine.load(files, onProgress);
  return engine;
}
