// src/hooks/useTour.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import api from '../utils/api';

// Global ref for mobile sidebar control across tour steps
export const sidebarRef = { current: null };

/**
 * Controls whether the onboarding tour is running.
 * Reads tour_completed from the auth user object.
 * Calls /api/auth/tour/complete when the user finishes or skips.
 */
export const useTour = () => {
  const { user, updateUser } = useAuth();
  const [run, setRun] = useState(false);

  // Start the tour on first load ONLY if user is logged in AND tour_completed is strictly false
  useEffect(() => {
    if (user && (user.tour_completed === false || user.tour_completed === 0 || user.tour_completed === 'false')) {
      const timer = setTimeout(() => setRun(true), 600);
      return () => clearTimeout(timer);
    } else {
      setRun(false);
    }
  }, [user]);

  const handleTourEnd = useCallback(async (data) => {
    const { status, type } = data;
    const finished = ['finished', 'skipped'].includes(status) || type === 'tour:end';

    if (finished) {
      setRun(false);
      try {
        await api.post('/auth/tour/complete');
        if (updateUser) {
          updateUser({ tour_completed: true });
        }
      } catch {
        // Non-blocking tour completion API call
      }
    }
  }, [updateUser]);

  const restartTour = useCallback(async () => {
    try {
      await api.post('/auth/tour/reset');
      if (updateUser) {
        updateUser({ tour_completed: false });
      }
      setRun(false);
      setTimeout(() => setRun(true), 300);
    } catch {
      /* silent catch */
    }
  }, [updateUser]);

  return { run, setRun, handleTourEnd, restartTour };
};
