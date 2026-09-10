import { createWorker } from 'tesseract.js';
import path from 'path';
import fs from 'fs';

let tesseractWorker = null;

/**
 * Initialize or get reusable Tesseract Worker
 */
const getWorker = async () => {
  if (!tesseractWorker) {
    tesseractWorker = await createWorker('eng');
  }
  return tesseractWorker;
};

export const performOCR = async (imagePath) => {
  const resolvedPath = path.resolve(imagePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Image file not found: ${resolvedPath}`);
  }

  try {
    const worker = await createWorker('eng');
    const result = await worker.recognize(resolvedPath);
    await worker.terminate();

    const fullText = result.data.text || '';
    const confidence = Math.round(result.data.confidence || 0);

    // Extract word-level bounding boxes for evidence highlighting
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

    // Extract line-level information
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

    // Fallback: If structured lines empty, split fullText
    if (lines.length === 0 && fullText.trim().length > 0) {
      lines = fullText.split('\n').map((t) => t.trim()).filter((t) => t.length > 0).map((t) => ({
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
  } catch (error) {
    console.error(`[OCR Service Error on ${imagePath}]:`, error.message);
    // Return empty result rather than failing whole inspection
    return {
      fullText: '',
      confidence: 0,
      lines: [],
      words: [],
      error: error.message,
    };
  }
};
