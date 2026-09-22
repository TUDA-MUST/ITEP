# Copilot instructions for ITEP

## Build, test, lint, and related commands

- Use **Node 24** to match CI (`.github/workflows/QC.yml`).
- Install dependencies with `pnpm install --frozen-lockfile`.
- Start the app locally with `pnpm start` (Angular dev server on **port 4202**).
- Build with `pnpm build`.
- Lint with `pnpm lint`.
- Check formatting with `pnpm format:check`.
- Run the full unit test suite with `pnpm test --watch=false`.
- Run a single unit spec with `pnpm test --watch=false --include=src/app/core/report.spec.ts`.
- Run Storybook with `pnpm storybook`; build it with `pnpm build-storybook`.
- Playwright specs live in `e2e/`. CI runs them with `pnpm exec playwright test --config=playwright-github.config.ts --project chromium` (or `firefox`).

## High-level architecture

- This is an Angular standalone application bootstrapped from `src/main.ts`. Routing is minimal: `/library` loads preset-based array configurations and `/setup` exposes editable configuration controls.
- `AppComponent` composes three top-level areas: the sidebar setup/library UI, the Babylon-based 3D viewport, and the results panel.
- Application state is centralized in `src/app/store/store.service.ts` as an NgRx `signalStore`. The root store composes feature slices such as beamforming, viewport configuration, selection, Rayleigh settings, and export state, then derives computed values like wave number `k`, transducer positions, cross-pattern data, and KPI metrics.
- Domain math lives in `src/app/core/`. Geometry generation (`array.ts`), environment/wavelength helpers (`environment.ts`), transducer models (`transducer.ts`), and PSF/report calculations (`report.ts`) are pure TypeScript utilities that the store consumes.
- `src/app/presets.ts` is the bridge between the academic/demo data and the app state: each preset bundles array geometry, environment, citation metadata, and transducer model, and those presets seed both the library view and the initial store state.
- The UI is intentionally split into `pure-components` and `smart-components` under `sidebar/` and `view3d/`. Smart components read from or write to the store; pure components stay presentation-focused.
- The Babylon scene is owned centrally by `BabylonJSViewDirective`. Renderer/buffer components under `src/app/view3d/` attach to that scene by implementing `BabylonConsumer`, so new 3D features should plug into the existing scene lifecycle instead of creating another engine or canvas.

## Key conventions

- Keep state changes inside the signal store and its feature slices. When adding new cross-cutting state, follow the existing `withState`/`withMethods`/`patchState` feature pattern instead of introducing a parallel state service.
- Preserve the `pure-components` vs `smart-components` split. Container-style components inject `StoreService`; presentation components should receive data via inputs/outputs.
- Changes to array definitions usually need to stay consistent across `ArrayConfig`, `presets.ts`, store computations, and any library/setup UI that edits those values.
- Engine selection and Babylon scene setup are centralized in `src/app/view3d/smart-components/babylon-jsview/babylon-jsview.directive.ts`. Do not duplicate engine initialization elsewhere.
- Unit tests run through Angular's Vitest builder, and `src/test-setup.ts` globally mocks `HTMLCanvasElement.getContext()` so ECharts and Babylon-related tests can run in jsdom. Reuse that setup instead of adding per-test canvas shims.
- This repository keeps Storybook stories next to many reusable components (`*.stories.ts`). When you change or add a reusable UI component with an existing Storybook pattern nearby, update or add the adjacent story as part of the same change.
- Playwright coverage is checked in CI with `playwright-github.config.ts`, and both Playwright configs are pinned manually to port **4202** to match `pnpm start`.
