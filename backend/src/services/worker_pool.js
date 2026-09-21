import { Worker } from 'worker_threads';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

class WorkerPool {
  constructor(numWorkers) {
    this.workers = [];
    this.workerCallbacks = new Map(); // Maps messageId -> callback
    this.numWorkers = numWorkers || Math.max(1, os.cpus().length - 1);
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    
    // Path to the worker script
    const workerScript = path.resolve('src/services/analysis.worker.js');
    
    for (let i = 0; i < this.numWorkers; i++) {
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
        console.error(`[Worker ${i}] Error:`, err);
      });
      
      worker.on('exit', (code) => {
        if (code !== 0) {
          console.error(`[Worker ${i}] Stopped with exit code ${code}`);
        }
      });

      this.workers.push(worker);
      console.log(`[Worker Pool] Started Worker Node ${i} (PID: ${worker.threadId})`);
    }
    
    this.isInitialized = true;
    console.log(`[Worker Pool] Initialized with ${this.numWorkers} distributed small servers`);
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
      const worker = this.workers[workerIndex];
      
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
      worker.terminate();
    }
    this.isInitialized = false;
  }
}

export const workerPool = new WorkerPool();
