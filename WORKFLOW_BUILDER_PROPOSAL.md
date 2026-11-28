# NuVerter — Node-Based Workflow Builder: Architecture Proposal

## Goal
Let users build custom processing pipelines by connecting NuVerter tools (e.g. Video Input → Extract Audio → Transcribe → Translate → Export Subtitles), running them locally, and inspecting intermediate outputs.

## Non-goals (initially)
- No visual drag-and-drop canvas in Phase 1.
- No cycles or arbitrary branching in Phase 1.
- No cloud/remote execution.

## 1. Graph model
- `Workflow` = `{ id, name, nodes: Node[], edges: Edge[] }`.
- `Node` = `{ id, type: ToolType, config: object, position: {x,y}, status: 'idle'|'running'|'done'|'error', result?: NodeResult }`.
- `Edge` = `{ from: nodeId, to: nodeId, fromPort, toPort }`.
- Ports are typed: `media:video`, `media:audio`, `media:image`, `text`, `json`, `subtitle`, `number`.
- A node declares `inputs: Port[]` and `outputs: Port[]`. Edges must match types (or a compatible coercion).

## 2. Node interface (adapter pattern)
Each NuVerter tool exposes a thin adapter:
```
interface ToolNode {
  type: string;               // 'extract-audio', 'compress', ...
  label: string;
  inputs: PortSpec[];
  outputs: PortSpec[];
  configSchema: JSONSchema;    // drives settings panel
  run(input: NodeInput, config, ctx): Promise<NodeOutput>;
}
```
Adapters live in `web/assets/js/workflow/adapters/*.js` and reuse existing functions (`Engine.run`, `convertImageBlob`, `startAutoTranscribe`, etc.) instead of duplicating logic.

## 3. Execution engine
- Topological sort of the DAG. Detect cycles before run (error if found).
- Run nodes in topological order with bounded concurrency (default 1 for Engine-dependent nodes; images/text may run in parallel up to `navigator.hardwareConcurrency`).
- Each node receives outputs of its predecessors mapped by port.
- Intermediate results stored in a `RunContext` map (nodeId -> output). Large blobs kept as `Blob`/`File` references; UI shows previews via object URLs.
- Progress events per node; cancellation propagates to in-flight Engine.run.
- On failure, mark node + downstream as `blocked`; allow retry of a single node.

## 4. UI (phased)
- Phase 1: Sequential runner panel (list of steps, add/remove/reorder, Run, per-step status, final download). No canvas.
- Phase 2: Visual canvas (pan/zoom, draggable nodes, port connections) using SVG/Canvas.
- Phase 3: Save/load workflows (IndexedDB), export/import JSON, templates.

## 5. State & persistence
- `state.workflows: Workflow[]`, `state.activeWorkflowId`.
- Persist to IndexedDB (reuse existing history DB pattern) under a new object store `workflows`.
- Privacy reset clears workflows too.

## 6. Integration points
- Reuse `Engine`, `registerOutput`, `toast`, modal system.
- Add a nav item "Workflows" (index 18) and `workflowView()` in renderView chain.
- Add `case 'wf-*'` actions in handleExtraAction.

## 7. Phases & estimates
- P1 Sequential runner: ~2-3 days, medium risk.
- P2 Visual canvas: ~1 week, high risk (interaction/perf).
- P3 Persistence + templates: ~2-3 days.
- P4 Node adapters for all tools: incremental, ~1 day per tool.

## 8. Open questions
- Should workflows be able to branch/merge (multiple inputs)? Phase 2.
- Memory limits for intermediate blobs: propose spilling to IndexedDB if > N MB.
- How to expose progress for long-running nodes (Whisper): reuse existing progress callbacks.

## Recommendation
Start with Phase 1 (sequential runner) using 3-4 adapters (compress, extract audio, trim, OCR) to validate the engine, then expand.
