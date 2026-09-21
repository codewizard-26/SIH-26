import { Worker } from 'worker_threads';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

class WorkerPool {
  constructor(numWorkers) {
    // Limit to 2 workers max on free tiers to avoid memory issues, or os.cpus()
    this.numWorkers = numWorkers || Math.min(2, Math.max(1, os.cpus().length - 1));
    this.workers = new Array(this.numWorkers).fill(null);
    this.workerCallbacks = new Map(); // Maps messageId -> callback
  }

  init() {
    // No-op for lazy initialization. Workers will be created on demand.
    console.log(`[Worker Pool] Configured for up to ${this.numWorkers} lazy-loaded workers`);
  }

  _getOrCreateWorker(index) {
    if (this.workers[index]) {
      return this.workers[index];
    }

    const workerScript = path.resolve('src/services/analysis.worker.js');
    const worker = new Worker(workerScript);
    
    worker.on('message', (msg) => {
      const { messageId, error, result } = msg;
      if (this.workerCallbacks.has(messageId)) {
        const { resolve, reject } = this.workerCallbacks.get(messageId);
        this.workerCallbacks.delete(messageId);
        
        if (error) {
          reject(new Error(error));
        } else {
          resolve(result);
        }
      }
    });
    
    worker.on('error', (err) => {
      console.error(`[Worker ${index}] Error:`, err);
    });
    
    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`[Worker ${index}] Stopped with exit code ${code}`);
      }
      this.workers[index] = null; // Clear the dead worker
    });

    this.workers[index] = worker;
    console.log(`[Worker Pool] Started Worker Node ${index} (PID: ${worker.threadId}) ON-DEMAND`);
    
    return worker;
  }

  // Consistent hashing to assign a product (inspectionId) to a specific worker
  _getWorkerIndex(inspectionId) {
    const hash = crypto.createHash('md5').update(inspectionId).digest('hex');
    const hashInt = parseInt(hash.substring(0, 8), 16);
    return hashInt % this.numWorkers;
  }

  analyzeInspection(inspectionId, inspection) {
    return new Promise((resolve, reject) => {
      const messageId = crypto.randomUUID();
      this.workerCallbacks.set(messageId, { resolve, reject });
      
      const workerIndex = this._getWorkerIndex(inspectionId);
      const worker = this._getOrCreateWorker(workerIndex);
      
      console.log(`[Worker Pool] Routing Product Inspection ${inspectionId} to Worker Node ${workerIndex}`);
      
      worker.postMessage({
        type: 'ANALYZE',
        messageId,
        inspectionId,
        inspection
      });
    });
  }

  shutdown() {
    for (const worker of this.workers) {
      if (worker) worker.terminate();
    }
    this.workers.fill(null);
  }
}

export const workerPool = new WorkerPool();
