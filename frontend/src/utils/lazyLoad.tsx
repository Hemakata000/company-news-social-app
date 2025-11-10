import React, { Suspense, ComponentType } from 'react';
import LoadingState from '../components/LoadingState';

// Higher-order component for lazy loading with fallback
export function withLazyLoading<T extends object>(
  Component: ComponentType<T>,
  fallback?: React.ReactNode
) {
  return React.memo((props: T) => (
    <Suspense fallback={fallback || <LoadingState size="medium" />}>
      <Component {...props} />
    </Suspense>
  ));
}

// Utility for creating lazy components with custom loading states
export function createLazyComponent<T extends object>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = React.lazy(importFn);
  return withLazyLoading(LazyComponent, fallback);
}