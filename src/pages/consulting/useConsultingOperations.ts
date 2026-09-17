import { useCallback, useEffect, useState } from "react";

import { getConsultingSnapshot } from "../../services/consulting";
import type { ConsultingSnapshot } from "../../types/consulting";

const emptySnapshot: ConsultingSnapshot = {
  clients: [],
  contracts: [],
  invoices: [],
  stripeConfigured: false,
};

export function useConsultingOperations() {
  const [data, setData] = useState<ConsultingSnapshot>(emptySnapshot);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setData(await getConsultingSnapshot());
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to load consulting operations.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const run = useCallback(
    async (task: () => Promise<unknown>, success: string) => {
      setWorking(true);
      setError("");
      setMessage("");

      try {
        await task();
        setMessage(success);
        await load();
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "The operation failed.",
        );
      } finally {
        setWorking(false);
      }
    },
    [load],
  );

  return {
    data,
    loading,
    working,
    error,
    message,
    load,
    run,
    setError,
    setMessage,
  };
}
