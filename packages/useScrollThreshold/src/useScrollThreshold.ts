import { useEffect, useRef } from "react";
import throttle from "@danielkrajnak/throttle";

export const useScroll = (
  listener: (x0: number) => any,
  throttleAmount = 300
): void => {
  const touchStartPosition = useRef<number>();
  useEffect(() => {
    const throttledFunc = throttle(
      (deltaY: number) => listener(deltaY),
      throttleAmount
    );
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
  }, [listener, throttleAmount]);
};

export const useScrollThreshold = (
  listener: (x0: number) => any,
  threshold = 0.5,
  coolDown = 1000
): void => {
  const throttledListener = useRef<(val: number) => void>(
    throttle((val: number) => listener(val), coolDown)
  );
  const callback = useRef((val: number) => {
    if (val > threshold || val < -threshold) {
      throttledListener.current(val);
    }
  });

  useScroll(callback.current);
};

export default useScrollThreshold;
