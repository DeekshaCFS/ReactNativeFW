// src/tour/TourContext.tsx
//
// Minimal engine behind the spotlight coach-mark tour (src/tour/SpotlightOverlay.tsx).
// Mirrors Android's TapTargetSequence: a tour is a list of steps, each naming
// a registered target by key; the overlay measures that target on screen and
// shows a circular spotlight + title/description over it, advancing to the
// next step on tap.
//
// Targets (src/tour/TourTarget.tsx) register a measure function rather than a
// static position, because some targets (e.g. the Home screen's profile
// card) aren't mounted yet when a tour starts from another screen -- the
// engine polls until the target appears and reports a real size.

import {createContext, useCallback, useContext, useRef, useState} from 'react';

export type TourMeasurement = {x: number; y: number; width: number; height: number};
export type TourMeasurer = () => Promise<TourMeasurement | null>;

export type TourStep = {
  key: string;
  titleKey: string;
  descriptionKey: string;
};

type TourContextValue = {
  registerMeasurer: (key: string, measurer: TourMeasurer) => void;
  unregisterMeasurer: (key: string) => void;
  activeStep: TourStep | null;
  activeMeasurement: TourMeasurement | null;
  startTour: (steps: TourStep[]) => void;
  advance: () => void;
};

const TourContext = createContext<TourContextValue | null>(null);

const MAX_RETRIES = 20;
const RETRY_DELAY_MS = 100;

export function TourProvider({children}: {children: React.ReactNode}) {
  const measurers = useRef<Map<string, TourMeasurer>>(new Map());
  const steps = useRef<TourStep[]>([]);
  const stepIndex = useRef(0);
  // Guards against a stale retry loop (from an abandoned/superseded tour)
  // resolving after a newer one has already started.
  const tourToken = useRef(0);

  const [activeStep, setActiveStep] = useState<TourStep | null>(null);
  const [activeMeasurement, setActiveMeasurement] = useState<TourMeasurement | null>(null);

  const registerMeasurer = useCallback((key: string, measurer: TourMeasurer) => {
    measurers.current.set(key, measurer);
  }, []);
  const unregisterMeasurer = useCallback((key: string) => {
    measurers.current.delete(key);
  }, []);

  const resolveStep = useCallback((token: number, index: number, attemptsLeft: number) => {
    const step = steps.current[index];
    if (!step) return;
    const measurer = measurers.current.get(step.key);
    const measurementPromise = measurer ? measurer() : Promise.resolve(null);

    measurementPromise.then(measurement => {
      if (token !== tourToken.current) return; // superseded
      if (measurement) {
        stepIndex.current = index;
        setActiveStep(step);
        setActiveMeasurement(measurement);
      } else if (attemptsLeft > 0) {
        setTimeout(() => resolveStep(token, index, attemptsLeft - 1), RETRY_DELAY_MS);
      } else {
        // Target never appeared; abandon rather than show a broken spotlight.
        setActiveStep(null);
        setActiveMeasurement(null);
      }
    });
  }, []);

  const startTour = useCallback((newSteps: TourStep[]) => {
    tourToken.current += 1;
    steps.current = newSteps;
    resolveStep(tourToken.current, 0, MAX_RETRIES);
  }, [resolveStep]);

  const advance = useCallback(() => {
    const next = stepIndex.current + 1;
    if (next >= steps.current.length) {
      setActiveStep(null);
      setActiveMeasurement(null);
      return;
    }
    resolveStep(tourToken.current, next, MAX_RETRIES);
  }, [resolveStep]);

  return (
    <TourContext.Provider
      value={{registerMeasurer, unregisterMeasurer, activeStep, activeMeasurement, startTour, advance}}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within a TourProvider');
  return ctx;
}
