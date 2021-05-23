"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IgnorablePromise = (promise) => {
    let resolve = null;
    let reject = null;
    const wrappedPromise = new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
    });
    promise.then((val) => {
        if (resolve) {
            resolve(val);
        }
    }, (error) => {
        if (reject) {
            reject(error);
        }
    });
    return [
        wrappedPromise,
        () => {
            resolve = null;
            reject = null;
        },
    ];
};
exports.default = IgnorablePromise;
//# sourceMappingURL=ignorable-promise.js.map