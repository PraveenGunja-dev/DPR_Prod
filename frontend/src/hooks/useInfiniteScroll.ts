import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  batchSize?: number;
  scrollThreshold?: number;
}

export const useInfiniteScroll = (
  data: any[],
  options: UseInfiniteScrollOptions = {}
) => {
  const {
    batchSize = 50,
    scrollThreshold = 100
  } = options;

  const [visibleData, setVisibleData] = useState<any[]>([]);
  const [loadedCount, setLoadedCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize with first batch
  useEffect(() => {
    if (data && data.length > 0) {
      const initialBatch = data.slice(0, Math.min(batchSize, data.length));
      setVisibleData(initialBatch);
      setLoadedCount(initialBatch.length);
      setHasMore(data.length > batchSize);
    } else {
      setVisibleData([]);
      setLoadedCount(0);
      setHasMore(false);
    }
  }, [data, batchSize]);

  // Load more data
  const loadMore = useCallback(() => {
    if (!hasMore || data.length <= loadedCount) return;

    const nextBatchEnd = Math.min(loadedCount + batchSize, data.length);
    const nextBatch = data.slice(loadedCount, nextBatchEnd);

    setVisibleData(prev => [...prev, ...nextBatch]);
    setLoadedCount(nextBatchEnd);
    setHasMore(nextBatchEnd < data.length);
  }, [data, loadedCount, hasMore, batchSize]);

  // Handle scroll event
  const handleScroll = useCallback(() => {
    if (!containerRef.current || !hasMore || data.length <= loadedCount) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    
    // Check if we're near the bottom
    if (scrollHeight - scrollTop - clientHeight < scrollThreshold) {
      loadMore();
    }
  }, [hasMore, loadedCount, data, scrollThreshold, loadMore]);

  // Attach scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Reset when data changes
  useEffect(() => {
    if (data && data.length > 0) {
      const initialBatch = data.slice(0, Math.min(batchSize, data.length));
      setVisibleData(initialBatch);
      setLoadedCount(initialBatch.length);
      setHasMore(data.length > batchSize);
    } else {
      setVisibleData([]);
      setLoadedCount(0);
      setHasMore(false);
    }
  }, [data, batchSize]);

  const reset = useCallback(() => {
    if (data && data.length > 0) {
      const initialBatch = data.slice(0, Math.min(batchSize, data.length));
      setVisibleData(initialBatch);
      setLoadedCount(initialBatch.length);
      setHasMore(data.length > batchSize);
    }
  }, [data, batchSize]);

  return {
    visibleData,
    loadedCount,
    totalCount: data?.length || 0,
    hasMore,
    loadMore,
    containerRef,
    reset
  };
};