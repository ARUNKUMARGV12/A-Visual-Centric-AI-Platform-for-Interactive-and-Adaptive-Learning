import { useCallback, useEffect, useRef, useState } from "react";

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const toastTimeouts = useRef(new Map());

  const addToast = useCallback(
    ({ title, description, variant = "default", duration = 5000 }) => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((currentToasts) => [
        ...currentToasts,
        { id, title, description, variant },
      ]);

      if (duration > 0) {
        const timeout = setTimeout(() => {
          setToasts((currentToasts) =>
            currentToasts.filter((toast) => toast.id !== id)
          );
          toastTimeouts.current.delete(id);
        }, duration);

        toastTimeouts.current.set(id, timeout);
      }

      return id;
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id)
    );

    if (toastTimeouts.current.has(id)) {
      clearTimeout(toastTimeouts.current.get(id));
      toastTimeouts.current.delete(id);
    }
  }, []);

  useEffect(() => {
    return () => {
      toastTimeouts.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, []);

  return {
    toasts,
    toast: addToast,
    removeToast,
  };
}
