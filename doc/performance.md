# Bundle size and performance comparison

This document compares the compiled production builds of:

- **Angular 17 (n-1)** — `gh-pages` commit `0c0a66f` (2026-06-18), built from `@angular/core` 17.3.2.
- **Angular 22 (n)** — `gh-pages` commit `aa351b0` (2026-11-14), built from `@angular/core` 22.2.4.
- **React 19 port** — current `dist/` build of this repository (Vite 8, React 19, MUI 9).

All builds were served from the same path (`/svg-path-editor/`) by static HTTP servers on
`localhost`, using Playwright Chromium 159, viewport 1440×900 at DPR 1.

## Bundle size

Production initial payload. Raw and gzip sizes are measured per file; "shell" is the
first-party HTML + JS + CSS needed to boot the editor. Angular 17/22 inline a large critical
CSS block in `index.html` and also load the external stylesheet, so both are included.
Fonts are listed separately: Angular loads them from Google Fonts (third party), React
self-hosts them.

| Build      |  JS raw | JS gzip | CSS raw | CSS gzip | HTML raw | HTML gzip |   Shell raw |  Shell gzip |         Fonts (woff2) |
| ---------- | ------: | ------: | ------: | -------: | -------: | --------: | ----------: | ----------: | --------------------: |
| Angular 17 | 890,564 | 218,965 |  46,164 |    6,323 |   40,820 |     5,720 | **977,548** | **231,008** |    172,088 (external) |
| Angular 22 | 821,485 | 205,901 |  46,754 |    5,262 |   46,793 |     6,175 | **915,032** | **217,338** |    172,088 (external) |
| React 19   | 559,297 | 170,640 |  14,912 |    3,700 |    1,472 |       737 | **575,681** | **175,077** | 173,336 (self-hosted) |

Notes:

- Angular 17 JS includes `runtime`, `polyfills` and `main`; Angular 22 bundles everything into `main`.
- Angular's HTML column includes 39–45 KB of inlined critical CSS and font-face rules; the external
  stylesheet is still fetched.
- React's JS includes the MUI/Emotion runtime and component code. React's CSS is smaller because
  MUI styles are generated at runtime.
- React's self-hosted fonts are 3 woff2 files actually fetched (Roboto 400/500 and Material Icons);
  the Roboto 300 file is emitted but not used by the editor UI. Angular downloads the equivalent
  Roboto/Material Icons files from `fonts.gstatic.com` (~172 KB, not part of its build).

### Differences

| Comparison          |  Shell raw | Shell gzip | JS raw | JS gzip | Shell + fonts raw | Shell + fonts gzip* |
| ------------------- | ---------: | ---------: | -----: | ------: | ----------------: | ------------------: |
| React vs Angular 22 | **−37.1%** | **−19.4%** | −31.9% |  −17.1% |        **−31.1%** |          **−10.5%** |
| React vs Angular 17 | **−41.1%** | **−24.2%** | −37.2% |  −22.1% |        **−34.8%** |          **−13.6%** |

\* woff2 is already compressed; the "gzip" total adds the raw font bytes to the gzipped shell.

## Runtime performance

### Method

- **Runtime harness**: Playwright + Chrome DevTools Protocol.
- **CPU**: 4× throttling (`Emulation.setCPUThrottlingRate`).
- **Network**:
  - _Fast_ scenario: no network throttle.
  - _Mobile_ scenario: Slow 4G emulation (1.6 Mbps down, 750 Kbps up, 150 ms RTT).
- **Cold cache**: `Network.setCacheDisabled(true)` and a new browser/context per run.
- **Service workers disabled** for all apps to isolate application startup.
- **Third-party requests blocked** (Google Analytics and font files) so all three apps are
  measured on first-party app work; fonts are accounted for separately in the bundle table.
- **Ready** is the time at which the command list and path textarea are rendered.
- **TBT** is the sum of long-task time over 50 ms after FCP.
- **Interaction benchmark**: after load, a target point is dragged with 60 mousemove events,
  one per animation frame. The reported values are medians of five runs.
- Runs are interleaved across builds (rotating order) to reduce host-load drift.

### Load results (medians of 5 runs)

**Fast network, CPU 4×**

| Metric                    | Angular 17 | Angular 22 |   React 19 |
| ------------------------- | ---------: | ---------: | ---------: |
| FCP                       |     3.81 s |     2.95 s | **2.90 s** |
| Ready (commands rendered) |     3.84 s |     2.91 s | **2.86 s** |
| Load event                |     5.65 s |     4.64 s | **4.52 s** |
| TBT                       |   1,031 ms |   1,156 ms | **608 ms** |
| First-party transfer      |     919 KB |     852 KB | **562 KB** |
| DOM nodes                 |        876 |        890 |    **547** |
| JS heap                   |      14 MB |      13 MB |      13 MB |

**Slow 4G, CPU 4×**

| Metric                    | Angular 17 | Angular 22 |   React 19 |
| ------------------------- | ---------: | ---------: | ---------: |
| FCP                       |     9.32 s |     8.49 s | **6.91 s** |
| Ready (commands rendered) |     9.25 s |     8.44 s | **7.21 s** |
| Load event                |     9.88 s |     8.99 s | **7.27 s** |
| TBT                       |       5 ms |     123 ms |     151 ms |
| First-party transfer      |     919 KB |     852 KB | **562 KB** |

### Interaction results (CPU 4×, medians of 5 runs)

| Metric                |   Angular 17 |  Angular 22 | React 19 |
| --------------------- | -----------: | ----------: | -------: |
| 60-step drag total    | **1,241 ms** |    1,298 ms | 1,503 ms |
| Average frame         |  **19.6 ms** |     20.4 ms |  23.4 ms |
| p95 frame             |      56.6 ms | **48.8 ms** |  56.2 ms |
| Average event handler |      12.2 ms |  **4.0 ms** |   3.3 ms |

On an unthrottled CPU the React drag benchmark sustains roughly 60 fps (≈16–17 ms average
frame), like the Angular builds.

## Observations

- The React build is **31–37% smaller raw** and **17–19% smaller gzipped** than the Angular
  builds for the app shell, and reaches the interactive editor earlier in both network
  scenarios.
- Once the shared Roboto/Material Icons fonts are included, React still transfers
  **~31% fewer raw bytes** and **~10% fewer compressed bytes** than Angular 22.
- React renders significantly fewer DOM nodes (547 vs ~890) and uses a comparable amount of
  JS heap.
- Angular 22 is measurably faster than Angular 17 in startup, TBT and transfer size.
- Interaction cost is close: the React drag is ~15–20% slower per frame than Angular 22 under
  an artificial 4× CPU slowdown, but both are smooth on an unthrottled machine.
- During this comparison the React implementation was improved with coalesced store
  notifications, memoized command rows/static panel sections/the grid, and a cached path
  string for rendering. Without those changes the throttled drag was substantially slower.
