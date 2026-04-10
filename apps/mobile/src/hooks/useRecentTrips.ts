import { useState, useEffect, useCallback } from 'react';
import { loadTripHistory, addTripRecord, clearTripHistory, TripRecord } from '../storage';

export type { TripRecord };

export function useRecentTrips() {
  const [trips, setTrips] = useState<TripRecord[]>([]);

  const refresh = useCallback(async () => {
    const loaded = await loadTripHistory();
    setTrips(loaded);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addTrip = useCallback(async (record: TripRecord) => {
    const updated = await addTripRecord(record);
    setTrips(updated);
  }, []);

  const clearTrips = useCallback(async () => {
    await clearTripHistory();
    setTrips([]);
  }, []);

  return { trips, addTrip, clearTrips, refresh };
}
