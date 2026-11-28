# AI Chat Upgrade — Master Prompt (for next session)

You are upgrading the NuVerter AI Chat (shared by `web/` and `deploy-netlify/`, wrapped by Tauri desktop). Follow this spec precisely. Do not break existing chat, conversion, or tool functionality. Test with `node --check` on all JS and `cargo check` on Rust.

## 1. Model catalog (two big categories)
- **Normal** (existing): keep all current models/groups exactly as-is.
- **Tool Calling** (new big category): mirror every group from Normal (General, Coding, Vision & Media, Large, Uncensored, etc.). Each group must contain tool-capable variants (Hermes/Qwen/Llama family) with tiny/balanced/big (+ micro for General). At least 3 vision models in Vision & Media and 3 large models in Large.
- Only models with verified function-calling support get `tools: true`; others `false`. Never set `tools: true` on a model that errors.

## 2. Universal file support
- Every model must accept images, video frames, PDF text, audio transcripts, and plain text without crashing.
- If a model lacks native multimodal support, gracefully fall back to text extraction (PDF text, image caption placeholder) instead of failing.

## 3. Chat input UX
- Drag & drop files (png/jpg/webp/pdf/txt/mp4/webm) into the chat area; show preview chips/thumbnails.
- Click-to-attach button with file picker.
- Display attached file count and allow removing individual attachments before send.

## 4. Tool calling / agent capabilities (Tauri-first, web fallback)
- AI can: read workspace files, list/glob paths, search (regex), run shell commands, edit files, think (reasoning block), and web search.
- Expose these as OpenAI-style tools with strict JSON schemas.
- Render tool calls/results in chat (collapsible blocks).
- Add rich output: markdown, code blocks with copy, tables, lists, images.

## 5. Persistence
- Save conversations as tabs on desktop (Tauri) using app data dir; restore on launch.
- Web version keeps localStorage persistence.

## 6. Backend
- Tauri: optional local Ollama proxy command for tool-capable coding models; fall back to WebLLM in browser.
- Web: WebLLM only; disable tools for non-capable models.

## 7. Quality
- No console errors; all nav/views load.
- Keep auto-update, installer, and download button working.
- Version strings consistent across tauri.conf.json, Cargo.toml, and web UI.

## Acceptance
- `node --check` passes on web + deploy-netlify app.js.
- `cargo check` passes.
- Manual smoke test: open each nav view, send a message with an attachment, trigger a tool call, persist a chat.
