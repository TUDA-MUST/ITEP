// Global test setup: mock HTMLCanvasElement.getContext to prevent ECharts/zrender
// from throwing in jsdom where canvas is not implemented.
const canvasMock = new Proxy(
  {},
  {
    get(_target, prop) {
      if (prop === 'measureText') {
        return () => ({ width: 0 });
      }
      return () => {};
    },
    set() {
      return true;
    },
  },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
HTMLCanvasElement.prototype.getContext = () => canvasMock as any;
