"use client";

// React 19 compatibility patch for sub-roots (e.g., @react-three/drei's <Html> component).
// In React 19, synchronously unmounting a sub-root during a parent render/commit phase
// triggers the console warning:
// "Attempted to synchronously unmount a root while React was already rendering."
// Deferring root.unmount via setTimeout(..., 0) allows React 19 to finish its active commit cycle.

if (typeof window !== "undefined") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ReactDOMClient = require("react-dom/client");
    if (ReactDOMClient && ReactDOMClient.createRoot && !(ReactDOMClient.createRoot as any).__patched_for_react19) {
      const origCreateRoot = ReactDOMClient.createRoot;
      const patchedCreateRoot = function (this: unknown, ...args: any[]) {
        const root = origCreateRoot.apply(this, args);
        if (root && typeof root.unmount === "function") {
          const origUnmount = root.unmount;
          root.unmount = function () {
            setTimeout(() => {
              try {
                origUnmount.call(root);
              } catch {
                // Ignore if already unmounted or DOM detached
              }
            }, 0);
          };
        }
        return root;
      };
      (patchedCreateRoot as any).__patched_for_react19 = true;
      ReactDOMClient.createRoot = patchedCreateRoot;
    }
  } catch {
    // Graceful fallback for non-standard environments
  }
}

export {};
