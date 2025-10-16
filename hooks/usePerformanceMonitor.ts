import { useEffect, useRef, useState, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  loadTime: number;
  memoryUsage?: number;
  componentCount: number;
  lastUpdate: number;
}

interface PerformanceMonitorOptions {
  enableMemoryMonitoring?: boolean;
  sampleInterval?: number;
  maxSamples?: number;
}

export const usePerformanceMonitor = (
  componentName: string,
  options: PerformanceMonitorOptions = {}
) => {
  const {
    enableMemoryMonitoring = false,
    sampleInterval = 1000,
    maxSamples = 100
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    loadTime: 0,
    componentCount: 0,
    lastUpdate: Date.now()
  });

  const [samples, setSamples] = useState<PerformanceMetrics[]>([]);
  const renderStartTime = useRef<number>(0);
  const loadStartTime = useRef<number>(0);
  const componentCountRef = useRef<number>(0);

  // Start timing a render
  const startRender = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  // End timing a render
  const endRender = useCallback(() => {
    if (renderStartTime.current > 0) {
      const renderTime = performance.now() - renderStartTime.current;
      setMetrics(prev => ({
        ...prev,
        renderTime,
        lastUpdate: Date.now()
      }));
      renderStartTime.current = 0;
    }
  }, []);

  // Start timing a load operation
  const startLoad = useCallback(() => {
    loadStartTime.current = performance.now();
  }, []);

  // End timing a load operation
  const endLoad = useCallback(() => {
    if (loadStartTime.current > 0) {
      const loadTime = performance.now() - loadStartTime.current;
      setMetrics(prev => ({
        ...prev,
        loadTime,
        lastUpdate: Date.now()
      }));
      loadStartTime.current = 0;
    }
  }, []);

  // Update component count
  const updateComponentCount = useCallback((count: number) => {
    componentCountRef.current = count;
    setMetrics(prev => ({
      ...prev,
      componentCount: count,
      lastUpdate: Date.now()
    }));
  }, []);

  // Get memory usage (if supported)
  const getMemoryUsage = useCallback(() => {
    if (enableMemoryMonitoring && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }, [enableMemoryMonitoring]);

  // Record a sample
  const recordSample = useCallback(() => {
    const memoryUsage = getMemoryUsage();
    const sample: PerformanceMetrics = {
      ...metrics,
      memoryUsage: memoryUsage?.used,
      lastUpdate: Date.now()
    };

    setSamples(prev => {
      const newSamples = [...prev, sample];
      return newSamples.slice(-maxSamples);
    });
  }, [metrics, getMemoryUsage, maxSamples]);

  // Auto-record samples at intervals
  useEffect(() => {
    if (sampleInterval > 0) {
      const interval = setInterval(recordSample, sampleInterval);
      return () => clearInterval(interval);
    }
  }, [recordSample, sampleInterval]);

  // Calculate averages
  const getAverages = useCallback(() => {
    if (samples.length === 0) return null;

    const sum = samples.reduce(
      (acc, sample) => ({
        renderTime: acc.renderTime + sample.renderTime,
        loadTime: acc.loadTime + sample.loadTime,
        componentCount: acc.componentCount + sample.componentCount,
        memoryUsage: acc.memoryUsage + (sample.memoryUsage || 0)
      }),
      { renderTime: 0, loadTime: 0, componentCount: 0, memoryUsage: 0 }
    );

    return {
      renderTime: sum.renderTime / samples.length,
      loadTime: sum.loadTime / samples.length,
      componentCount: sum.componentCount / samples.length,
      memoryUsage: enableMemoryMonitoring ? sum.memoryUsage / samples.length : undefined
    };
  }, [samples, enableMemoryMonitoring]);

  // Get performance warnings
  const getWarnings = useCallback(() => {
    const warnings: string[] = [];
    const averages = getAverages();

    if (averages) {
      if (averages.renderTime > 16) {
        warnings.push(`Slow render: ${averages.renderTime.toFixed(2)}ms (target: <16ms)`);
      }
      if (averages.loadTime > 1000) {
        warnings.push(`Slow load: ${averages.loadTime.toFixed(2)}ms (target: <1000ms)`);
      }
      if (averages.componentCount > 1000) {
        warnings.push(`High component count: ${averages.componentCount} (consider virtualization)`);
      }
      if (enableMemoryMonitoring && averages.memoryUsage && averages.memoryUsage > 50 * 1024 * 1024) {
        warnings.push(`High memory usage: ${(averages.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
      }
    }

    return warnings;
  }, [getAverages, enableMemoryMonitoring]);

  // Log performance data
  const logPerformance = useCallback(() => {
    const averages = getAverages();
    const warnings = getWarnings();

    console.group(`Performance Monitor: ${componentName}`);
    console.log('Current metrics:', metrics);
    if (averages) {
      console.log('Averages:', averages);
    }
    if (warnings.length > 0) {
      console.warn('Warnings:', warnings);
    }
    console.log('Sample count:', samples.length);
    console.groupEnd();
  }, [componentName, metrics, getAverages, getWarnings, samples.length]);

  return {
    metrics,
    samples,
    averages: getAverages(),
    warnings: getWarnings(),
    startRender,
    endRender,
    startLoad,
    endLoad,
    updateComponentCount,
    recordSample,
    logPerformance,
    getMemoryUsage
  };
};

// Hook for measuring component render time
export const useRenderTime = (componentName: string) => {
  const renderTimeRef = useRef<number>(0);
  const [renderTime, setRenderTime] = useState<number>(0);

  useEffect(() => {
    renderTimeRef.current = performance.now();
  });

  useEffect(() => {
    const endTime = performance.now();
    const duration = endTime - renderTimeRef.current;
    setRenderTime(duration);
    
    if (duration > 16) {
      console.warn(`${componentName} render took ${duration.toFixed(2)}ms (>16ms)`);
    }
  });

  return renderTime;
};

// Hook for measuring async operations
export const useAsyncTimer = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState<number>(0);

  const timeAsync = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName?: string
  ): Promise<T> => {
    setIsLoading(true);
    const startTime = performance.now();

    try {
      const result = await operation();
      const endTime = performance.now();
      const operationDuration = endTime - startTime;
      
      setDuration(operationDuration);
      
      if (operationName) {
        console.log(`${operationName} completed in ${operationDuration.toFixed(2)}ms`);
      }
      
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    timeAsync,
    isLoading,
    duration
  };
};

// Hook for monitoring list performance
export const useListPerformance = (itemCount: number, threshold: number = 100) => {
  const [shouldVirtualize, setShouldVirtualize] = useState(false);
  const [performanceMode, setPerformanceMode] = useState<'normal' | 'optimized' | 'virtualized'>('normal');

  useEffect(() => {
    if (itemCount > threshold * 10) {
      setPerformanceMode('virtualized');
      setShouldVirtualize(true);
    } else if (itemCount > threshold) {
      setPerformanceMode('optimized');
      setShouldVirtualize(false);
    } else {
      setPerformanceMode('normal');
      setShouldVirtualize(false);
    }
  }, [itemCount, threshold]);

  return {
    shouldVirtualize,
    performanceMode,
    itemCount,
    threshold
  };
};