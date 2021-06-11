import { useCallback, useRef } from "react";

const useThrottle = <T extends unknown[]>(
  func: (...args: T) => any,
  time: number
): ((...args: T) => void) => {
  const currentFunc = useRef(func);
  currentFunc.current = func;

  const cooledDown = useRef(true);
  return useCallback(
    (...args) => {
      if (cooledDown.current) {
        currentFunc.current(...args);
        cooledDown.current = false;
        setTimeout(() => (cooledDown.current = true), time);
      }
    },
    [time]
  );
};

export default useThrottle;
