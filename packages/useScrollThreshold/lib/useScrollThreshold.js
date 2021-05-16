"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useScrollThreshold = exports.useScroll = void 0;
const react_1 = require("react");
const throttle_1 = require("@danielkrajnak/throttle");
const useScroll = (listener, throttleAmount = 300) => {
    const touchStartPosition = react_1.useRef();
    react_1.useEffect(() => {
        const throttledFunc = throttle_1.default((deltaY) => listener(deltaY), throttleAmount);
        const wheelHandler = (e) => {
            throttledFunc(e.deltaY);
        };
        const touchMoveHandler = (e) => {
            var _a;
            const thisY = (_a = e.touches.item(0)) === null || _a === void 0 ? void 0 : _a.clientY;
            if (thisY && touchStartPosition.current) {
                throttledFunc(touchStartPosition.current - thisY);
            }
        };
        const touchStartHandler = (e) => {
            var _a;
            touchStartPosition.current = (_a = e.touches.item(0)) === null || _a === void 0 ? void 0 : _a.clientY;
        };
        window.addEventListener("touchstart", touchStartHandler);
        window.addEventListener("wheel", wheelHandler);
        window.addEventListener("touchmove", touchMoveHandler);
        return () => {
            window.removeEventListener("touchstart", touchStartHandler);
            window.removeEventListener("wheel", wheelHandler);
            window.removeEventListener("touchmove", touchMoveHandler);
        };
    }, [listener, throttleAmount]);
};
exports.useScroll = useScroll;
const useScrollThreshold = (listener, threshold = 0.5, coolDown = 1000) => {
    const throttledListener = react_1.useRef(throttle_1.default((val) => listener(val), coolDown));
    const callback = react_1.useRef((val) => {
        if (val > threshold || val < -threshold) {
            throttledListener.current(val);
        }
    });
    exports.useScroll(callback.current);
};
exports.useScrollThreshold = useScrollThreshold;
exports.default = exports.useScrollThreshold;
//# sourceMappingURL=useScrollThreshold.js.map