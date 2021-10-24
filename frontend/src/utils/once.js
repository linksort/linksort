export default function once(fn) {
  let isCalled = false;

  return function (...args) {
    if (isCalled) return;

    isCalled = true;
    fn(...args);
  };
}
