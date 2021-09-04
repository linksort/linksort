export function suppressMutationErrors(fn) {
  return async (...args) => {
    try {
      await fn(...args);
    } catch (e) {
      // `mutation` catches any errors and then rethrows them.
    }
  };
}
