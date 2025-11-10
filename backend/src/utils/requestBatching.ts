// Request batching utility for optimizing API performance

interface BatchRequest<T, R> {
  id: string;
  data: T;
  resolve: (result: R) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

interface BatchProcessorOptions {
  maxBatchSize: number;
  maxWaitTime: number; // milliseconds
  maxConcurrency: number;
}

export class BatchProcessor<T, R> {
  private queue: BatchRequest<T, R>[] = [];
  private processing = false;
  private options: BatchProcessorOptions;
  private processingCount = 0;

  constructor(
    private processor: (items: T[]) => Promise<R[]>,
    options: Partial<BatchProcessorOptions> = {}
  ) {
    this.options = {
      maxBatchSize: options.maxBatchSize || 10,
      maxWaitTime: options.maxWaitTime || 100,
      maxConcurrency: options.maxConcurrency || 3
    };
  }

  async add(data: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      const request: BatchRequest<T, R> = {
        id: Math.random().toString(36).substr(2, 9),
        data,
        resolve,
        reject,
        timestamp: Date.now()
      };

      this.queue.push(request);
      this.scheduleProcessing();
    });
  }

  private scheduleProcessing() {
    if (this.processing || this.processingCount >= this.options.maxConcurrency) {
      return;
    }

    // Process immediately if batch is full
    if (this.queue.length >= this.options.maxBatchSize) {
      this.processBatch();
      return;
    }

    // Schedule processing after wait time
    if (this.queue.length > 0) {
      setTimeout(() => {
        if (this.queue.length > 0 && !this.processing) {
          this.processBatch();
        }
      }, this.options.maxWaitTime);
    }
  }

  private async processBatch() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    this.processingCount++;

    const batchSize = Math.min(this.queue.length, this.options.maxBatchSize);
    const batch = this.queue.splice(0, batchSize);

    try {
      const items = batch.map(req => req.data);
      const results = await this.processor(items);

      // Resolve all requests in the batch
      batch.forEach((request, index) => {
        if (results[index] !== undefined) {
          request.resolve(results[index]);
        } else {
          request.reject(new Error('No result for batch item'));
        }
      });
    } catch (error) {
      // Reject all requests in the batch
      batch.forEach(request => {
        request.reject(error instanceof Error ? error : new Error('Batch processing failed'));
      });
    } finally {
      this.processing = false;
      this.processingCount--;

      // Process next batch if queue is not empty
      if (this.queue.length > 0) {
        setImmediate(() => this.scheduleProcessing());
      }
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getProcessingCount(): number {
    return this.processingCount;
  }
}

// Specialized batch processor for news content generation
export class ContentGenerationBatcher {
  private highlightsBatcher: BatchProcessor<{ highlights: string[]; companyName: string }, any>;
  private articlesBatcher: BatchProcessor<{ article: any; companyName: string }, any>;

  constructor() {
    this.highlightsBatcher = new BatchProcessor(
      async (items) => {
        // Process highlights in batch
        return Promise.all(items.map(async (item) => {
          // Simulate content generation - replace with actual implementation
          return {
            highlights: item.highlights,
            socialContent: []
          };
        }));
      },
      { maxBatchSize: 5, maxWaitTime: 200, maxConcurrency: 2 }
    );

    this.articlesBatcher = new BatchProcessor(
      async (items) => {
        // Process articles in batch
        return Promise.all(items.map(async (item) => {
          // Simulate article processing - replace with actual implementation
          return {
            article: item.article,
            processed: true
          };
        }));
      },
      { maxBatchSize: 3, maxWaitTime: 500, maxConcurrency: 2 }
    );
  }

  async generateContentFromHighlights(highlights: string[], companyName: string): Promise<any> {
    return this.highlightsBatcher.add({ highlights, companyName });
  }

  async processArticle(article: any, companyName: string): Promise<any> {
    return this.articlesBatcher.add({ article, companyName });
  }

  getStats() {
    return {
      highlightsQueue: this.highlightsBatcher.getQueueSize(),
      articlesQueue: this.articlesBatcher.getQueueSize(),
      highlightsProcessing: this.highlightsBatcher.getProcessingCount(),
      articlesProcessing: this.articlesBatcher.getProcessingCount()
    };
  }
}

// Database query batching utility
export class DatabaseBatcher {
  private insertBatcher: BatchProcessor<any, any>;
  private queryBatcher: BatchProcessor<{ query: string; params: any[] }, any>;

  constructor() {
    this.insertBatcher = new BatchProcessor(
      async (items) => {
        // Batch insert operations
        const results = [];
        for (const item of items) {
          try {
            // Simulate database insert - replace with actual implementation
            results.push({ success: true, id: Math.random() });
          } catch (error) {
            results.push({ success: false, error });
          }
        }
        return results;
      },
      { maxBatchSize: 20, maxWaitTime: 50, maxConcurrency: 3 }
    );

    this.queryBatcher = new BatchProcessor(
      async (items) => {
        // Batch query operations
        return Promise.all(items.map(async (item) => {
          // Simulate database query - replace with actual implementation
          return { data: [], query: item.query };
        }));
      },
      { maxBatchSize: 10, maxWaitTime: 100, maxConcurrency: 5 }
    );
  }

  async batchInsert(data: any): Promise<any> {
    return this.insertBatcher.add(data);
  }

  async batchQuery(query: string, params: any[] = []): Promise<any> {
    return this.queryBatcher.add({ query, params });
  }
}

// Singleton instances for global use
export const contentGenerationBatcher = new ContentGenerationBatcher();
export const databaseBatcher = new DatabaseBatcher();