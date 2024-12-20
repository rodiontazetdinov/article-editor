interface MathJax {
  typesetPromise: () => Promise<any>;
}

declare global {
  interface Window {
    MathJax?: MathJax;
  }
}

export {}; 