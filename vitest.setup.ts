/**
 * happy-dom 環境補丁 — 為無頭功能測試模擬瀏覽器能力
 * （Audio / Canvas / ObjectURL / ResizeObserver / 捲動）
 */

/* ---------- 移除 MessageChannel ----------
 * React 19 的排程器會用「真實的」MessageChannel 做異步 flush；
 * 搭配 fake timers 時 flush 時機不確定（會吃掉 click、漂移計時器）。
 * 移除後 scheduler 回退到 setTimeout 排程 → 完全受 fake timers 控制、確定性執行。
 * 必須在 React 模組載入前（setupFiles 先於測試模組）執行。
 */
if (typeof (window as unknown as { MessageChannel?: unknown }).MessageChannel !== 'undefined') {
  delete (window as unknown as { MessageChannel?: unknown }).MessageChannel
}

/* ---------- AudioContext（Web Audio 無聲模擬） ---------- */
class MockAudioParam {
  value = 0
  setValueAtTime() {}
  exponentialRampToValueAtTime() {}
  linearRampToValueAtTime() {}
}
class MockOscillatorNode {
  type = 'sine'
  frequency = new MockAudioParam()
  connect() { return this }
  start() {}
  stop() {}
  disconnect() {}
}
class MockGainNode {
  gain = new MockAudioParam()
  connect() { return this }
  disconnect() {}
}
class MockAudioContext {
  state = 'running'
  currentTime = 0
  destination = {}
  sampleRate = 44100
  createOscillator() { return new MockOscillatorNode() }
  createGain() { return new MockGainNode() }
  createBuffer() { return { getChannelData: () => new Float32Array(8) } }
  resume() { return Promise.resolve() }
  close() { return Promise.resolve() }
}
if (typeof (window as unknown as { AudioContext?: unknown }).AudioContext === 'undefined') {
  ;(window as unknown as { AudioContext: unknown }).AudioContext = MockAudioContext
}

/* ---------- Canvas 2D 上下文（全部 no-op，讀值回中性結果） ---------- */
function makeCtxStub(): Record<string, unknown> {
  return new Proxy(
    {
      canvas: null,
      fillStyle: '#000',
      strokeStyle: '#000',
      lineWidth: 1,
      font: '16px sans-serif',
      textAlign: 'center',
      textBaseline: 'middle',
      imageSmoothingEnabled: true,
      globalAlpha: 1,
      measureText: () => ({ width: 10, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2 }),
      getImageData: (x: number, y: number, w: number, h: number) => ({
        data: new Uint8ClampedArray(Math.max(1, w * h) * 4),
        width: w,
        height: h,
      }),
      createImageData: (w: number, h: number) => ({
        data: new Uint8ClampedArray(Math.max(1, w * h) * 4),
        width: w,
        height: h,
      }),
      createPattern: () => null,
      createLinearGradient: () => ({ addColorStop() {} }),
      getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    },
    {
      get(target, prop) {
        if (prop in target) return target[prop]
        // 任何未列明的方法一律 no-op
        return () => undefined
      },
      set(target, prop, value) {
        target[prop] = value
        return true
      },
    },
  )
}

const ctxStub = makeCtxStub()
const originalGetContext = HTMLCanvasElement.prototype.getContext
HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string) {
  if (type === '2d') return ctxStub as unknown as CanvasRenderingContext2D
  return (originalGetContext?.call(this, type) ?? null) as CanvasRenderingContext2D
}

// toBlob → 回傳一個小假 PNG
HTMLCanvasElement.prototype.toBlob = function (
  this: HTMLCanvasElement,
  cb: BlobCallback | null,
  type?: string,
) {
  queueMicrotask(() => cb?.(new Blob([new Uint8Array([137, 80, 78, 71])], { type: type ?? 'image/png' })))
}
const originalToDataURL = HTMLCanvasElement.prototype.toDataURL
if (!originalToDataURL) {
  HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,iVBORw0KGgo='
}

/* ---------- Object URL ---------- */
let objectUrlSeq = 0
if (typeof URL.createObjectURL !== 'function') {
  Object.defineProperty(URL, 'createObjectURL', {
    value: () => `blob:http://mock.local/fake-${++objectUrlSeq}`,
    writable: true,
    configurable: true,
  })
  Object.defineProperty(URL, 'revokeObjectURL', {
    value: () => undefined,
    writable: true,
    configurable: true,
  })
}

/* ---------- 其它 DOM 缺口 ---------- */
if (typeof window.ResizeObserver === 'undefined') {
  class RO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  ;(window as unknown as { ResizeObserver: unknown }).ResizeObserver = RO
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => undefined
}
if (typeof window.matchMedia !== 'function') {
  ;(window as unknown as { matchMedia: unknown }).matchMedia = (q: string) => ({
    matches: false,
    media: q,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return false },
  })
}
