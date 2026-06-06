# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Requires Node 20 (see `.nvmrc`). Mocha 11 pulls in an ESM-only `yargs` that fails on Node 18 with `ERR_REQUIRE_ESM`. If your shell doesn't auto-switch on `cd`, run `fnm use` (or `nvm use`) before `npm test`.

- `npm test` — runs mocha (recursive across `test/`); `posttest` then runs lint, builds the CJS bundle, and validates the README/API examples via `texample`.
- `npm run lint` — eslint (cached) + prettier check. Run before publishing or when CI is failing.
- `npm run dist` — rollup builds `src/index.js` into `lib/main.cjs` as plain named exports (`exports: 'named'`). There is no default export; CJS consumers destructure (`const { Serializer } = require('moddle-context-serializer')`).
- `npm run cov:html` / `npm run test:lcov` — coverage variants via c8.
- Single test file: `npx mocha test/serializer-test.js`. Single test: append `--grep "<pattern>"`. Default mocha timeout is 1000ms (see `.mocharc.json`).

The `posttest` chain runs `dist` then `texample`, so the README/API code blocks are executed against the _built_ bundle. If you change the public API surface, update both `README.md` and `API.md` examples or `texample` will fail the test run.

## Architecture

The package is a single-file library (`src/index.js`, ~900 lines) that turns a `bpmn-moddle` parse result into a serializable, behaviour-mapped graph. The flow is:

```
bpmn-moddle XML parse  →  Mapper.map()  →  resolveTypes(typeResolver)  →  ContextApi
                          (raw → mapped)   (attaches Behaviour fns)      (query API + serialize)
```

Four collaborating pieces, all in `src/index.js`:

1. **`Mapper`** walks `moddleContext.rootElement` and produces the normalized shape `{ definition, processes, activities, sequenceFlows, messageFlows, associations, dataObjects, dataStores, participants, scripts, timers }`. It first builds an internal `_references` index from `moddleContext.references` (a single pass, populating Maps for `flowRefs`, `flowNodeRefs`, `processRefs` and arrays for data associations), then recurses through `flowElements` / `artifacts`. SubProcess/Transaction/AdHocSubProcess all reuse the Process mapping branch.
2. **`TypeResolver(types, extender?)`** is the default behaviour mapper. It strips the `bpmn:` prefix from `$type` and looks up `types[NonPrefixedType]`, with a few hard-coded aliases (`Definitions`→`Definition`, `Error`→`BpmnError`, `DataObjectReference`→`Dummy`). The resolver **mutates entities** by attaching a `Behaviour` property — that mutation is intentional and documented in `API.md`. The `extender` callback lets consumers add or override mappings (e.g. Camunda extensions).
3. **`ContextApi`** is a prototype-based query API (prototyped specifically to reduce per-instance memory; see CHANGELOG 2.0.0). Its `serialize()` returns JSON that round-trips back through `deserialize(json, typeResolver)` — the deserialized form skips `Mapper` entirely and goes straight into `resolveTypes` + `ContextApi`. Anything you add to the mapped shape must survive `JSON.stringify` and re-attach correctly under `resolveTypes`.
4. **`ExtendContext`** collects `scripts` and `timers` discovered during mapping (ScriptTask bodies, ConditionalEventDefinition scripts, TimerEventDefinition values, SequenceFlow conditional expressions). Both the mapper and consumers (via `extendFn`) can call `addScript` / `addTimer`. The lists are exposed on the final context via `getScripts*` / `getTimers*`.

### Conventions worth knowing before editing

- **Refs vs elements.** Properties matching `/^(?!\$).+?Ref$/` (e.g. `messageRef`, `attachedToRef`) are flattened via `spreadRef` to `{ id, type, name }`. The `$`-prefix exclusion specifically avoids touching moddle's internal `$type`/`$parent`/etc.
- **`extendFn` merge order.** In `_prepareElementBehaviour`, the consumer extension is shallow-merged _underneath_ the prepared element: `{ ...mod, ...preparedElement }`. Consumers can supply defaults but cannot override `id`, `type`, or anything the mapper already set — this is documented in `API.md` and tests rely on it.
- **DataObject vs DataStore vs DataStoreReference.** All three live on `elements.dataStores`/`elements.dataObjects` but are distinguished by `type`. `getDataStores()` filters to `bpmn:DataStore` only; `getDataStoreReferences()` returns everything in the list. Don't "simplify" by collapsing them.
- **Scripts/timers are extracted, not just referenced.** ScriptTask bodies, conditional sequence flows, ConditionalEventDefinition scripts and TimerEventDefinition values are all hoisted into the top-level `scripts`/`timers` arrays so a runtime can compile them once. The behaviour object still carries the original data.

### Tests

This project is TDD and coverage is a USP. Write a failing test first, then implement; for bug fixes, add a regression test that reproduces the bug before touching `src/`. Run `npm run cov:html` (or `npm run test:lcov`) before declaring work done — coverage is publicly tracked via Coveralls and must not regress. The README explicitly says "the tests are the documentation," so test names and assertions are the spec.

- `test/helpers/testHelpers.js` exposes `moddleContext(xml)` which wraps `BpmnModdle.fromXML`. Most tests parse inline XML or files from `test/resources/*.bpmn`.
- `test/helpers/types.js` is a stub type registry — every entry is an empty function. Tests assert _that_ mapping happens (correct `Behaviour` attached), not behaviour execution.
- `test/backwardCompatibility-test.js` runs the same flow against `bpmn-moddle@6` (callback API), `@7`, and current `@9`. The package declares `bpmn-moddle >=6` as a peer dep, so don't break the v6 callback-context handling in `Mapper.map()` (`moddleContext.rootHandler.element` fallback).
- `test/edge-case-test.js` and `test/performance-test.js` are the canaries for refactors of `_prepareReferences` / `_prepareElements` — the Map-based ref index in 4.3.0 was a perf change; keep an eye on those if touching that path.

## Types

- `src/index.js` is JSDoc-typed under `// @ts-check` (tsconfig has `checkJs: true`). Validate the source with `npx tsc --noEmit`. Validate source + tests together with `npm run typecheck` (uses `tsconfig.check.json`, which extends the base config, includes `test/**/*`, relaxes `noImplicitAny`/`noUnused*` for tests, and excludes `backwardCompatibility-test.js` because the npm-aliased `bpmn-moddle-6/7/9` packages don't ship type defs). `npm test`'s posttest runs typecheck.
- Test-only ambient declarations live in `test/helpers/test-globals.d.ts` (module-mode so it can augment `bpmn-moddle.BaseElement` with the runtime `get`/`set` methods that `@types/bpmn-moddle@10` doesn't declare; also declares the global `expect` chai injects via `chai/register-expect.js`).
- Shared interfaces live in `types/interfaces.d.ts` and are addressed via the tsconfig path alias `"types"`. In JSDoc: `@type {import('types').Parent}` etc.
- `types/index.d.ts` is **auto-generated** by `npm run build:types` (dts-buddy bundles `src/index.js` JSDoc + `interfaces.d.ts` into a single `declare module 'moddle-context-serializer' { ... }` block). It's prettier-ignored and regenerated by `posttest` and `prepack`. Don't hand-edit it.
- **Always reuse named types from `interfaces.d.ts`.** If you need a relaxed version, compose with `Partial<T>` / `Pick` / `Omit` — don't inline a structurally-similar object type when an interface already declares it.
- **Keep `interfaces.d.ts` clean — no doc comments on types/fields.** Field names should be self-documenting. Implementation-detail explanations belong in `AGENTS.md`, JSDoc on the source functions, or commit messages, not the interface file.
- `BPMNModel` (the moddle parse-result shape with `rootElement`, `references`, `elementsById`) is re-exported from `@types/bpmn-moddle@^10`. The v10 typing is imprecise at a couple of spots (references are typed `BaseElement[]` but actually `{property, element, id}`; `BaseElement` lacks `.name`); these are handled with a narrow `/** @type {any} */` cast or `@ts-expect-error`, not a wholesale `any` widening.

## Build & publishing

- `type: module` in `package.json`; ESM is `src/index.js`, CJS is `lib/main.cjs` (rollup), types are `types/index.d.ts` (dts-buddy).
- `prepack` runs `build:types` then `dist`, so `npm publish` always ships fresh artifacts. Both `lib/main.cjs` and `types/index.d.ts` are tracked in git — regenerate (`npm test` does both) and commit alongside source changes that affect the public API.
- Tests import from `'moddle-context-serializer'` (Node package self-reference via `package.json` `exports` field), not `'../src/index.js'`. This means tests exercise the same module-resolution path consumers use.

## Dependency notes

**bpmn-moddle 9 → 10 was a repackaging release**, not a data-shape change. `dist/index.js` is byte-identical between the two versions except for the export line; `dist/index.cjs` is fully identical. What actually changed:

- Default → named export: `import BpmnModdle from 'bpmn-moddle'` (v9) → `import { BpmnModdle } from 'bpmn-moddle'` (v10). Test helpers already use the v10 form.
- `exports` map drops the CJS path (file still ships, just not surfaced via Node resolution). ESM-only.
- Engines: Node ≥ 18 → ≥ 20.12.

The `BPMNModel` runtime shape (`{ rootElement, elementsById, references, warnings }`) is unchanged across v6/v7/v9/v10 — that's why `peerDependencies: "bpmn-moddle": ">=6"` holds and `test/backwardCompatibility-test.js` passes against all four. The `Mapper.map()` `rootElement ?? rootHandler.element` fallback is only relevant for v6's callback-context API.

## Downstream consumers

Two downstream packages exercise this serializer in different ways:

- **[bpmn-engine](https://www.npmjs.com/package/bpmn-engine)** is the package that actually calls `.serialize()` / `deserialize()` — it persists running process state via `SerializableContext.serialize()` and resumes from the JSON via `deserialize()`. The whole point of the round-trip in this repo (the dual `Serializer` / `deserialize` entry points, the requirement that mapped context survive `JSON.stringify`) exists to serve bpmn-engine's persistence model.
- **[bpmn-elements](https://www.npmjs.com/package/bpmn-elements)** supplies the behaviour function registry passed to `TypeResolver` — `Process`, `Task`, `*EventDefinition`, etc. It's a devDependency here, used in tests and README examples.

All three packages (this serializer, bpmn-engine, bpmn-elements) share a single maintainer, so breaking changes can be coordinated across them rather than treated as external API breaks. That said, the serialized JSON format is bpmn-engine's persistence wire format — changes to it (field renames, removing fields from the spread `behaviour`, restructuring `references`) break running engine deployments at upgrade time, not just compile time. Coordinate accordingly.
