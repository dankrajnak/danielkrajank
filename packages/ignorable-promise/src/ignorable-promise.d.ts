declare const IgnorablePromise: <T>(promise: Promise<T>) => [Promise<T>, () => void];
export default IgnorablePromise;
