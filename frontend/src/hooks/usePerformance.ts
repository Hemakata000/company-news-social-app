import { useEffect } from 'react';
import { performanceMonitor } from '../utils/performance';

// Hook for measuring component render time
export function useMeasureRender(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      performanceMonitor.recordMetric(`render-${componentName}`, endTime - startTime);
    };
  });
}

// Hook for measuring component mount time
export function useMeasureMount(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    const endTime = performance.now();
    performanceMonitor.recordMetric(`mount-${componentName}`, endTime - startTime);
  }, [componentName]);
}