import { useEffect, useMemo, useState } from "react";
import { openDb } from "./db";
import { createRepository, type Repository } from "./repository";

export function useRepo() {
  const [repo, setRepo] = useState<Repository | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    openDb()
      .then((db) => {
        if (cancelled) return;
        setRepo(createRepository(db));
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => ({ repo, error }), [repo, error]);
}
