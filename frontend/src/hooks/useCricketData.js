import { useState, useEffect } from 'react';
import { fetchTeams } from '../services/api';

export function useTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await fetchTeams();
        if (isMounted) {
          setTeams(data || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load teams');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => { isMounted = false; };
  }, []);

  return { teams, loading, error };
}

export function useHealth() {
  const [healthy, setHealthy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function check() {
      try {
        const res = await fetch('/api/v1/health').then(r => r.json());
        if (isMounted) {
          setHealthy(res.status === 'healthy');
        }
      } catch {
        if (isMounted) {
          setHealthy(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    check();
    return () => { isMounted = false; };
  }, []);

  return { healthy, loading };
}

export function useVenues() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await fetch('/api/v1/analytics/venues').then(r => r.json());
        if (isMounted) {
          setVenues(res || []);
        }
      } catch {
        if (isMounted) {
          setVenues([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => { isMounted = false; };
  }, []);

  return { venues, loading };
}
