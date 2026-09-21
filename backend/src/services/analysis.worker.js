import { parentPort } from 'worker_threads';
import { performBatchOCR } from './ocr.service.js';
import { extractDeclarations } from './extraction.service.js';
import { evaluateCompliance } from './compliance.service.js';

// Auto-correction logic for viewType
const correctViewType = (ocrText, originalViewType) => {
  const lower = (ocrText || '').toLowerCase();
  let newViewType = originalViewType;

  const hasMrpKeywords = 
    lower.includes('mrp') || 
    lower.includes('rs.') || 
    lower.includes('₹') || 
    lower.includes('batch') || 
    lower.includes('mfg') || 
    lower.includes('consumer care') ||
    lower.includes('net qty');

  if (hasMrpKeywords && originalViewType === 'front') {
    newViewType = 'mrp';
  } else if (!hasMrpKeywords && originalViewType === 'mrp' && lower.length < 200) {
    // If it's tagged MRP but lacks keywords and has very little text, might be front
    newViewType = 'front';
  }

  return newViewType;
};

// Listen for messages from the Master thread
parentPort.on('message', async (msg) => {
  if (msg.type === 'ANALYZE') {
    const { messageId, inspection } = msg;
    
    try {
      // 1. Prepare image inputs
      const imageInputs = inspection.images.map((img) => ({
        filePath: img.filePath,
        id: img.id,
        viewType: img.viewType,
      }));

      // 2. Run Parallel OCR in this worker
      // performBatchOCR already uses Promise.all if we updated it, or we'll update it next
      const ocrOutputs = await performBatchOCR(imageInputs);

      const ocrResults = [];
      const updatedImages = [];

      inspection.images.forEach((img, idx) => {
        const ocr = ocrOutputs[idx] || { fullText: '', confidence: 0, lines: [], words: [] };
        
        // Auto-correct Panel View Type for robustness
        const correctedViewType = correctViewType(ocr.fullText, img.viewType);

        ocrResults.push({
          imageId: img.id,
          viewType: correctedViewType,
          fullText: ocr.fullText,
          lines: ocr.lines,
          words: ocr.words,
          confidence: ocr.confidence,
        });

        updatedImages.push({
          id: img.id,
          viewType: correctedViewType,
          ocrRawData: ocr,
          extractedText: ocr.fullText,
        });
      });

      // 3. Extract Declarations
      const declarations = extractDeclarations(ocrResults);
      
      let productName = inspection.productName;
      if (declarations.genericName && declarations.genericName.detected && declarations.genericName.value) {
        productName = declarations.genericName.value;
      }

      const productInfo = {
        name: productName,
        category: inspection.category,
        brand: inspection.brand,
      };

      // 4. Evaluate Compliance
      const complianceResult = evaluateCompliance(productInfo, declarations);

      // Return processed payload to Master thread
      parentPort.postMessage({
        messageId,
        result: {
          ocrResults,
          updatedImages,
          declarations,
          productName,
          complianceResult
        }
      });

    } catch (error) {
      parentPort.postMessage({
        messageId,
        error: error.message
      });
    }
  }
});
