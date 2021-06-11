import { useEffect, useRef } from "react";
import useThrottle from "@danielkrajnak/use-throttle";

export const useScroll = (
  listener: (x0: number) => any,
  throttleAmount = 300
): void => {
  const touchStartPosition = useRef<number>();
  const throttledFunc = useThrottle(
    (deltaY: number) => listener(deltaY),
    throttleAmount
  );
  useEffect(() => {
    const wheelHandler = (e: WheelEvent) => {
      throttledFunc(e.deltaY);
    };

    const touchMoveHandler = (e: TouchEvent) => {
      const thisY = e.touches.item(0)?.clientY;
      if (thisY && touchStartPosition.current) {
        throttledFunc(touchStartPosition.current - thisY);
      }
    };

    const touchStartHandler = (e: TouchEvent) => {
      touchStartPosition.current = e.touches.item(0)?.clientY;
    };

    window.addEventListener("touchstart", touchStartHandler);
    window.addEventListener("wheel", wheelHandler);
    window.addEventListener("touchmove", touchMoveHandler);

    return () => {
      window.removeEventListener("touchstart", touchStartHandler);
      window.removeEventListener("wheel", wheelHandler);
      window.removeEventListener("touchmove", touchMoveHandler);
    };
  }, [throttledFunc, throttleAmount]);
};

export const useScrollThreshold = (
  listener: (x0: number) => any,
  threshold = 0.5,
  coolDown = 1000
): void => {
  useScroll((val: number) => {
    if (val > threshold || val < -threshold) {
      listener(val);
    }
  }, coolDown);
};

export default useScrollThreshold;
