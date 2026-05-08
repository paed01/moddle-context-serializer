// Test-only ambient declarations. Module-mode (note the trailing `export {}`) so
// the bpmn-moddle augmentation merges with the upstream types instead of replacing them.

declare global {
  // chai/register-expect.js installs `expect` as a global at process startup
  const expect: Chai.ExpectStatic;
}

// @types/bpmn-moddle@10 doesn't declare moddle's runtime get/set methods on BaseElement,
// even though they exist at runtime (inherited from moddle's Base class). Tests use them
// to mutate elements created via moddle.create().
declare module 'bpmn-moddle' {
  interface BaseElement {
    get(name: string): any;
    set(name: string, value: any): void;
  }
}

export {};
