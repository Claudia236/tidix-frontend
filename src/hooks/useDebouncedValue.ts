import { useEffect, useState } from 'react';

// Ritarda la propagazione di un valore che cambia rapidamente (es. testo
// digitato in una ricerca) di `delayMs`: utile per non scatenare una
// richiesta di rete ad ogni singolo carattere digitato, aspettando invece
// una breve pausa nella digitazione.
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
