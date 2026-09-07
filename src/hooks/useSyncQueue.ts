import { useEffect, useRef } from 'react';

// Esegue syncFn con l'input piu' recente disponibile, garantendo che l'ultima
// sincronizzazione "a vincere" sia sempre quella con i dati piu' aggiornati.
// Senza questo, due resync consecutivi (es. due modifiche rapide alla stessa
// attivita', ciascuna delle quali invalida la query e fa scattare l'effetto)
// potevano partire uno via l'altro e completarsi fuori ordine: se quello
// avviato con i dati piu' vecchi finiva DOPO quello con i dati piu' nuovi, il
// promemoria schedulato tornava silenziosamente a uno stato superato, senza
// alcuna correzione successiva.
export function useSyncQueue<T>(
  syncFn: (input: T) => Promise<void>,
  input: T | null | undefined,
  extraDeps: unknown[] = []
) {
  const latestInputRef = useRef<T | null | undefined>(input);
  const runningRef = useRef(false);

  latestInputRef.current = input;

  useEffect(() => {
    if (input == null || runningRef.current) return;

    async function runLoop() {
      runningRef.current = true;
      try {
        let current = latestInputRef.current;
        while (current != null) {
          await syncFn(current);
          // Se durante l'attesa e' arrivato un input piu' recente, si
          // riparte subito con quello; altrimenti la coda e' esaurita.
          current = latestInputRef.current === current ? null : latestInputRef.current;
        }
      } finally {
        runningRef.current = false;
      }
    }

    runLoop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, ...extraDeps]);
}
