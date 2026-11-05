import { useEffect, useState } from 'react';

/** Estado persistido no navegador. Falhas de storage (modo privado etc.) caem para memória. */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage indisponível: mantém apenas em memória
    }
  }, [key, value]);

  return [value, setValue] as const;
}
