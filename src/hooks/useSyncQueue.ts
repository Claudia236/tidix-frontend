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
  const latestSyncFnRef = useRef(syncFn);
  const runningRef = useRef(false);
  const rerunPendingRef = useRef(false);

  latestInputRef.current = input;
  latestSyncFnRef.current = syncFn;

  useEffect(() => {
    if (input == null) return;

    if (runningRef.current) {
      // Un giro e' gia' in corso, avviato con la syncFn/extraDeps di un
      // render precedente (es. lingua non ancora cambiata): senza questo
      // flag, se l'unica cosa cambiata e' extraDeps (stesso riferimento di
      // input), il giro in corso finirebbe silenziosamente con la versione
      // superata di syncFn, senza alcuna correzione successiva.
      rerunPendingRef.current = true;
      return;
    }

    async function runLoop() {
      runningRef.current = true;
      try {
        let current = latestInputRef.current;
        while (current != null) {
          rerunPendingRef.current = false;
          await latestSyncFnRef.current(current);
          // Si riparte subito se durante l'attesa e' arrivato un input piu'
          // recente, oppure se extraDeps e' cambiato nel frattempo (stesso
          // input ma rerunPendingRef segnalato dall'effetto qui sopra);
          // altrimenti la coda e' esaurita.
          current = latestInputRef.current === current && !rerunPendingRef.current ? null : latestInputRef.current;
        }
      } finally {
        runningRef.current = false;
      }
    }

    // syncFn (notifiche locali) puo' rigettare per motivi fuori dal nostro
    // controllo (permesso revocato a runtime, errore nativo): senza questo
    // .catch(), un fallimento diventava una unhandled promise rejection
    // invece di essere semplicemente ignorato (i promemoria sono un
    // extra best-effort, non devono far rumore se non si riescono a
    // programmare).
    runLoop().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, ...extraDeps]);
}
