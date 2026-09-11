import { createWorker } from 'tesseract.js';
import path from 'path';
import fs from 'fs';

/**
 * Format OCR recognize result into structured lines and words
 */
const formatResult = (result) => {
  const fullText = result.data.text || '';
  const confidence = Math.round(result.data.confidence || 0);

  const words = (result.data.words || []).map((w) => ({
    text: w.text,
    confidence: Math.round(w.confidence),
    bbox: {
      x0: w.bbox.x0,
      y0: w.bbox.y0,
      x1: w.bbox.x1,
      y1: w.bbox.y1,
      width: w.bbox.x1 - w.bbox.x0,
      height: w.bbox.y1 - w.bbox.y0,
    },
  }));

  let lines = (result.data.lines || []).map((l) => ({
    text: l.text.trim(),
    confidence: Math.round(l.confidence),
    bbox: {
      x0: l.bbox.x0,
      y0: l.bbox.y0,
      x1: l.bbox.x1,
      y1: l.bbox.y1,
      width: l.bbox.x1 - l.bbox.x0,
      height: l.bbox.y1 - l.bbox.y0,
    },
  })).filter((l) => l.text.length > 0);

  if (lines.length === 0 && fullText.trim().length > 0) {
    lines = fullText
      .split('\n')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t) => ({
        text: t,
        confidence: confidence || 80,
        bbox: { x0: 0, y0: 0, x1: 100, y1: 20, width: 100, height: 20 },
      }));
  }

  return {
    fullText,
    confidence,
    lines,
    words,
  };
};

/**
 * Perform batch OCR reusing a single Tesseract worker instance.
 * Speeds up multi-image inspections by 3-4x on cloud instances (Render).
 */
export const performBatchOCR = async (imageItems = []) => {
  if (!imageItems || imageItems.length === 0) return [];

  let worker = null;
  const results = [];

  try {
    worker = await createWorker('eng');

    for (const item of imageItems) {
      const filePath = item.filePath || item;
      const resolvedPath = path.resolve(filePath);

      if (!fs.existsSync(resolvedPath)) {
        results.push({
          fullText: '',
          confidence: 0,
          lines: [],
          words: [],
          error: `Image file not found: ${resolvedPath}`,
        });
        continue;
      }

      try {
        const rawResult = await worker.recognize(resolvedPath);
        results.push(formatResult(rawResult));
      } catch (err) {
        console.error(`[Batch OCR image error on ${resolvedPath}]:`, err.message);
        results.push({
          fullText: '',
          confidence: 0,
          lines: [],
          words: [],
          error: err.message,
        });
      }
    }
  } catch (error) {
    console.error('[Batch OCR worker error]:', error.message);
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {}
    }
  }

  return results;
};

/**
 * Single image OCR fallback
 */
export const performOCR = async (imagePath) => {
  const batch = await performBatchOCR([{ filePath: imagePath }]);
  return batch[0] || { fullText: '', confidence: 0, lines: [], words: [] };
};
