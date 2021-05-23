type ResolveCallback<T> = (value: T | Promise<T>) => void;
type RejectCallback = (reason?: any) => void;

/**
 * Creates a promise which can be 'ignored', meaning if the ignore is called, this promise will no longer resolve or reject;
 *
 * @param {Promise<T>} promise - a promise
 * @returns {[Promise<T>, () => void ]} - the ignorable promise, and a function to call to ignore the promise
 */
const IgnorablePromise = <T>(promise: Promise<T>): [Promise<T>, () => void] => {
  let resolve: ResolveCallback<T> | null = null;
  let reject: RejectCallback | null = null;

  const wrappedPromise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  promise.then(
    (val) => {
      if (resolve) {
        resolve(val);
      }
    },
    (error) => {
      if (reject) {
        reject(error);
      }
    }
  );

  return [
    wrappedPromise,
    () => {
      resolve = null;
      reject = null;
    },
  ];
};

export default IgnorablePromise;
