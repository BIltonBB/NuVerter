# NuVerter — Feature Roadmap & Architecture Ideas

## Instructions
Review the existing NuVerter codebase before making changes. These are potential features and improvements, not permission to implement everything immediately.

- Fix existing bugs and stabilize current functionality first.
- Inspect the current architecture, dependencies, UI conventions, and implemented features.
- Reuse existing components and libraries where possible.
- Keep processing local and offline wherever practical. Do not introduce cloud processing or paid APIs.
- Prioritize performance, low memory usage, privacy, and responsive UI.
- Avoid duplicating existing features. Identify what's already implemented.
- Do not break existing functionality or redesign unrelated parts of the application.
- For large features, propose a phased implementation plan with dependencies, technical limitations, and estimated complexity before coding.
- Verify changes with appropriate tests and builds.

## 1. Video & Image Editor

### Non-destructive editing
- Layer stack for text, watermarks, filters, and color adjustments.
- Live previews without permanently modifying the original file.
- Undo/redo history with named actions and the ability to return to earlier editing states.
- Export only applies the selected edits to the output file.
- Video timeline with multiple tracks if feasible; otherwise, begin with a simpler single-file editor.

### Local AI image editing
- Smart brush for selecting unwanted objects and filling the selected region using a local inpainting model.
- Optional local AI model support through ONNX Runtime Web or another suitable browser-compatible runtime.
- Clearly communicate model download sizes, hardware requirements, and processing limitations.

### Automatic video reframing
- Convert landscape videos into portrait or square formats.
- Optional local face/object tracking to keep the subject in frame.
- Smooth crop-window movement with manual correction when tracking fails.

### Image vectorization
- Convert raster images such as PNG logos into SVG paths using a local vectorization library.
- Include preview, threshold/detail controls, and SVG export.
- Explain that vectorization approximates the original image and does not guarantee perfect reconstruction.

### Crop and export tools
- Aspect-ratio guides for common social-media formats.
- Developer-oriented image presets, including Open Graph covers, app screenshots, and icons.
- Export format, resolution, quality, and estimated output-size controls.

## 2. Conversion Engine & Performance

### Eco and Turbo modes
- Eco mode prioritizes system responsiveness and lower resource consumption.
- Turbo mode maximizes throughput using available CPU threads and supported hardware acceleration.
- Do not promise single-core CPU restrictions or full-core utilization unless the underlying engine actually supports them.
- Automatically select suitable processing backends when possible and allow manual overrides.

### Batch processing
- Batch rename files using templates such as `{original_name}_NuVerter_{resolution}`.
- Preserve file extensions and prevent filename collisions.
- Provide per-file progress, cancellation, error reporting, and retry options.

### Output-size estimation
- Estimate output size while users adjust image or video compression settings.
- Label estimates as approximate and update them using actual encoding statistics or representative samples when practical.
- Avoid expensive full-file processing just to update the estimate.

### Hardware acceleration
- Investigate WebCodecs, WebGPU, Canvas, Web Workers, and WASM for appropriate workloads.
- Keep fallbacks for unsupported browsers and devices.
- Avoid assuming WebGPU accelerates every operation; benchmark actual performance.

## 3. Developer Utilities

### JSON mock-data generator
- Generate configurable arrays of realistic but entirely synthetic JSON records.
- Allow field selection, record count, data types, and custom schemas.
- Support names, emails, UUIDs, timestamps, and other common development fields.
- Keep generation local and include one-click copy/download.

### Color palette extractor
- Extract the dominant colors from a loaded image.
- Display HEX, RGB, and other useful color values.
- Include one-click copying and optional palette export.
- Use efficient local canvas-based color quantization.

### Favicon bundle generator
- Convert a source logo into common favicon and app-icon sizes.
- Generate supported PNG/ICO assets and a web manifest where appropriate.
- Provide a downloadable bundle and copy-ready HTML references.
- Preserve transparency and offer configurable padding/cropping.

### Reverse spritesheet slicer
- Split spritesheets into individual image frames.
- Support configurable grid dimensions, frame size, spacing, and margins.
- Investigate automatic detection for irregular layouts, but retain manual controls.
- Export transparent PNG frames in a ZIP archive.

### File hash verification
- Calculate file hashes locally using supported cryptographic APIs.
- Let users paste an expected hash and compare it with the calculated result.
- Display a clear match/mismatch status.
- Support appropriate algorithms such as SHA-256 and explain that a matching hash verifies integrity against the supplied hash, not the source's trustworthiness.

## 4. Privacy & Document Security

### Metadata removal
- Add an optional metadata-stripping setting to supported image and video exports.
- Remove supported EXIF, GPS, camera, and other metadata fields.
- Preserve essential encoding information and warn when metadata cannot be removed.
- Verify the exported file rather than assuming the operation succeeded.

### PII detection and redaction
- Detect possible personal information in supported documents and images.
- Highlight suspected information for user review.
- Allow users to apply permanent redactions to the exported file.
- Ensure redacted content is removed from the output rather than merely covered visually.
- For PDFs, account for hidden text layers, annotations, and other recoverable content.
- Preserve the original file unless the user explicitly chooses to overwrite it.

### Local document OCR and search
- Extract text from scanned documents using local OCR.
- Allow users to search across a temporary collection of processed documents.
- Optionally integrate a locally installed language model for questions about extracted text.
- Keep document indexes temporary or user-controlled, with clear deletion controls.
- Do not require cloud AI or remote document uploads.

### Privacy reset
- Provide a clearly labeled action to clear the active queue, editor state, temporary caches, and temporary indexes.
- Release application-owned model resources when supported.
- Explain that browser APIs cannot guarantee deletion of operating-system clipboard history, disk remnants, browser-managed caches, or every copy held by the OS.
- Ask for confirmation before destructive actions and do not silently delete user files.

## 5. Audio & Video Workflow Enhancements

### Audio waveform editor
- Display an interactive waveform for supported audio files and extracted video audio.
- Allow users to select start and end positions visually.
- Preview the selection and export only the chosen segment.
- Handle long files without decoding the entire file into memory unnecessarily.

### Smart crop preview
- Show common aspect-ratio overlays while cropping video.
- Dim the regions outside the selected crop.
- Preview the final framing before export.

### Smart-drop routing
- Detect file types when users drag files into the application.
- Suggest relevant actions based on the file type.
- For video, offer conversion/compression, audio extraction, and subtitle generation where supported.
- Keep manual tool selection available and never automatically upload files.

## 6. UI & Productivity

### Action history
- Provide meaningful undo/redo history for supported editing operations.
- Allow users to jump to earlier states when the underlying operation can be safely reversed.
- Avoid storing full copies of large files for every action; use command history, state snapshots, and memory-efficient strategies.

### Command palette
- Add a global shortcut such as Ctrl+K to search for tools and actions.
- Support keyboard navigation and direct access to common workflows.
- Follow existing accessibility and shortcut conventions.

### Contextual workflow builder
- Consider a future node-based interface for connecting operations, such as audio extraction → transcription → translation.
- Start with a simple sequential workflow system if a visual node editor would add excessive complexity.
- Show dependencies, intermediate outputs, errors, and progress.

### System-native appearance
- Investigate optional native window effects only if the application uses a compatible desktop wrapper.
- Preserve existing theme presets and provide graceful fallbacks.

### Audio-reactive themes
- Optional visual effect that responds subtly to audio playback.
- Keep it lightweight, disabled by default if costly, and independent of core processing.

## 7. Local AI Model Manager

- Display installed local models, their names, formats, disk sizes, and supported tasks.
- Provide model installation, removal, and selection where technically supported.
- Show estimated memory requirements and warn before loading models likely to exceed available resources.
- Distinguish system RAM from dedicated GPU VRAM and shared GPU memory.
- Detect actual runtime and hardware capabilities where possible.
- Support offline operation after required models and dependencies have been installed.
- Never claim that a model is loaded, hardware-accelerated, or fully offline unless verified.

## 8. Clipboard Assistance

- Consider an optional clipboard helper for development utilities.
- Prefer an explicit user-triggered paste or clipboard inspection action.
- If background clipboard monitoring is not supported safely by the current browser or desktop environment, do not simulate it.
- Never transmit clipboard contents remotely.
- Avoid collecting or storing clipboard contents unnecessarily.

## 9. Usage Statistics

- Track actual bytes processed and completed operations locally.
- Optionally display total files processed and other useful statistics.
- If estimating cloud bandwidth or time saved, clearly label it as an estimate and disclose the assumptions.
- Do not claim measured savings when the application has not actually measured them.

## Suggested Implementation Order

**Phase 0 — Stability**
- Fix existing bugs.
- Verify current conversion tools, queue behavior, themes, and routing.
- Establish regression tests and performance baselines.

**Phase 1 — Low-complexity improvements**
- Batch renaming.
- Hash comparison.
- Color palette extraction.
- Favicon bundle generation.
- JSON mock-data generator.
- Command palette.
- Basic export presets and size estimates.

**Phase 2 — Media workflow**
- Image editor with non-destructive adjustments and history.
- Video crop preview and audio waveform selection.
- Smart-drop routing.
- Batch processing improvements.

**Phase 3 — Advanced media capabilities**
- Vectorization and spritesheet slicing.
- WebCodecs/WASM acceleration where beneficial.
- Local AI model manager.
- Optional object removal and automatic video reframing.

**Phase 4 — Documents and workflows**
- Metadata stripping.
- OCR and temporary local document search.
- Secure permanent redaction.
- Workflow builder and advanced privacy controls.

This ordering is provisional. Adjust it after inspecting the existing implementation, dependencies, and actual complexity.

## First Task

Do not start implementing this entire roadmap at once.

1. Inspect the repository and identify the current architecture and existing functionality.
2. Identify and prioritize current bugs.
3. Check which proposed features already exist or are partially implemented.
4. Produce a concise report containing the recommended next features, implementation difficulty, dependencies, expected performance impact, and risks.
5. Recommend the smallest useful next implementation that fits the existing codebase.

Wait for approval before beginning a large feature or architectural rewrite.

### Visual Node-Based Workflow Editor

Build a visual, node-based workflow editor where users can create custom processing pipelines by connecting individual tools together.

- **Draggable nodes:** Each operation is represented by a movable node on an infinite or pannable canvas.
- **Connectable ports:** Nodes have typed input and output ports. Users connect them visually to define the processing order.
- **Data flow:** Support pipelines such as Video Input → Extract Audio → Transcribe → Translate → Export Subtitles.
- **Automatic execution:** Validate the graph, determine execution order, and run compatible operations when the user clicks Run.
- **Live status:** Show waiting, running, completed, and failed states on individual nodes.
- **Intermediate outputs:** Allow users to inspect previews and reuse intermediate results without rerunning unaffected operations when possible.
- **Node configuration:** Selecting a node opens its settings, including format, quality, language, and other operation-specific options.
- **Workflow management:** Allow saving, loading, duplicating, and exporting workflow definitions.
- **Error handling:** Detect missing connections, incompatible input/output types, dependency failures, and cycles before execution.
- **Performance:** Use existing NuVerter tools and processing engines rather than duplicating their implementations. Keep large media data out of unnecessary UI state and avoid loading entire files into memory without need.
- **Local-first execution:** Process files locally wherever supported. Clearly indicate when an operation requires an external service or additional model.
- **Integration:** Reuse existing NuVerter conversion tools as nodes. Design the architecture so additional tools can become nodes without rewriting the workflow engine.

Treat this as a substantial feature. First inspect the existing architecture, then propose the graph model, node interface, execution engine, and implementation phases before coding. Do not replace the existing interface or start a major rewrite without approval.