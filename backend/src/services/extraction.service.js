/**
 * Declaration Extraction Engine for Packaged Commodities
 * Extracts statutory declarations required under The Legal Metrology (Packaged Commodities) Rules, 2011:
 * - Rule 6(1)(a) & Rule 10: Manufacturer / Packer / Importer details
 * - Rule 6(1)(b): Generic / Common Name
 * - Rule 6(1)(c) & Rules 11-13: Net Quantity & Standard Units
 * - Rule 6(1)(d): Month and Year of Manufacture / Packing
 * - Rule 6(1)(e) & Rule 2(m): Retail Sale Price (MRP) & Tax Inclusivity
 * - Rule 6(2): Consumer Care Details (Phone, Email, Address)
 */

import { mlService } from './ml.service.js';

export const extractDeclarations = (ocrResults = []) => {
  // Combine all images' lines and words for cross-panel analysis
  const allLines = [];
  const allWords = [];
  let combinedFullText = '';

  ocrResults.forEach((imgResult) => {
    const { imageId, viewType, lines = [], words = [], fullText = '' } = imgResult;
    combinedFullText += `\n${fullText}`;

    lines.forEach((line) => {
      allLines.push({
        ...line,
        imageId,
        viewType,
      });
    });

    words.forEach((word) => {
      allWords.push({
        ...word,
        imageId,
        viewType,
      });
    });
  });

  const fullTextLower = combinedFullText.toLowerCase();

  // Run the ML Custom Model on all extracted lines
  const mlClassifications = mlService.classifyLines(allLines);

  // 1. Extract MRP (Rule 6(1)(e) & Rule 2(m))
  const mrpDeclaration = extractMRP(allLines, combinedFullText, fullTextLower);

  // 2. Extract Net Quantity (Rule 6(1)(c), Rules 11, 12, 13)
  const netQuantityDeclaration = extractNetQuantity(allLines, combinedFullText, fullTextLower);

  // 3. Extract Month & Year of Mfg/Packing (Rule 6(1)(d))
  const mfgDateDeclaration = extractMfgDate(allLines, combinedFullText, fullTextLower);

  // 4. Extract Manufacturer / Packer / Importer Details (Rule 6(1)(a) & Rule 10)
  const manufacturerDeclaration = extractManufacturer(allLines, combinedFullText, fullTextLower);

  // 5. Extract Consumer Care Information (Rule 6(2))
  const consumerCareDeclaration = extractConsumerCare(allLines, combinedFullText, fullTextLower);

  // 6. Extract Generic Name / Commodity (Rule 6(1)(b)) using ML Model
  const genericNameDeclaration = extractGenericName(mlClassifications, allLines, fullTextLower);

  return {
    mrp: mrpDeclaration,
    netQuantity: netQuantityDeclaration,
    manufacturingDate: mfgDateDeclaration,
    manufacturer: manufacturerDeclaration,
    consumerCare: consumerCareDeclaration,
    genericName: genericNameDeclaration,
    combinedText: combinedFullText.trim(),
  };
};

/**
 * Extract MRP and verify statutory tax inclusivity
 */
const extractMRP = (lines, fullText, fullTextLower) => {
  // Regex for MRP detection: MRP, M.R.P, MIRP, Maximum Retail Price, Rs, Fs, ₹
  const mrpRegex = /(?:M\.?[I1l|]?\.?R\.?P\.?|MAX(?:IMUM)?\.?\s*RETAIL\s*PRICE|[RF]\.?S\.?|₹)\s*[:.-]?\s*(?:₹|[RF]S\.?)?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i;

  let detectedValue = null;
  let hasTaxInclusion = false;
  let sourceImageId = null;
  let boundingBox = null;
  let confidence = 0.5;

  for (const line of lines) {
    const match = line.text.match(mrpRegex);
    if (match) {
      detectedValue = match[0].trim();
      sourceImageId = line.imageId;
      boundingBox = line.bbox;
      confidence = line.confidence / 100 || 0.85;

      // Check for tax inclusion in this line or nearby context
      const lineLower = line.text.toLowerCase();
      if (
        lineLower.includes('incl') ||
        lineLower.includes('tax') ||
        lineLower.includes('all taxes') ||
        lineLower.includes('inclusive of')
      ) {
        hasTaxInclusion = true;
      }
      break;
    }
  }

  // Broad check across full text if line check missed tax inclusion
  if (
    fullTextLower.includes('inclusive of all taxes') ||
    fullTextLower.includes('incl. of all taxes') ||
    fullTextLower.includes('incl of all taxes') ||
    fullTextLower.includes('inclusive of') ||
    fullTextLower.includes('incl. taxes')
  ) {
    hasTaxInclusion = true;
  }

  return {
    type: 'mrp',
    detected: detectedValue !== null,
    value: detectedValue,
    hasTaxInclusion,
    confidence: detectedValue ? Math.max(0.7, confidence) : 0,
    sourceImageId,
    boundingBox,
  };
};

/**
 * Extract Net Quantity & Metric Units
 */
const extractNetQuantity = (lines, fullText, fullTextLower) => {
  // Regex for Net Quantity: Net Qty, Net Weight, Net Wt, Net Content followed by digits and metric unit
  const netQtyRegex = /(?:NET\s*(?:QTY|QUANTITY|WT|WEIGHT|CONTENTS?|VOL(?:UME)?)\s*[:.-]?\s*)?([0-9]+(?:\.[0-9]+)?)\s*(G|GM|GMS|GRAM|GRAMS|KG|KILOGRAM|ML|MILLILITRE|L|LTR|LITRE|LITRES|CM|M|PIECES?|PCS|UNITS?|N)\b/i;

  let detectedValue = null;
  let unit = null;
  let quantityNumber = null;
  let hasProhibitedQualifier = false;
  let prohibitedQualifierWord = null;
  let sourceImageId = null;
  let boundingBox = null;
  let confidence = 0.5;

  for (const line of lines) {
    const match = line.text.match(netQtyRegex);
    if (match) {
      // Prioritize lines that specifically say NET QTY or NET WT
      const isExplicit = /net\s*(?:qty|quantity|wt|weight|vol)/i.test(line.text);
      if (!detectedValue || isExplicit) {
        detectedValue = match[0].trim();
        quantityNumber = parseFloat(match[1]);
        unit = match[2].toUpperCase();
        sourceImageId = line.imageId;
        boundingBox = line.bbox;
        confidence = line.confidence / 100 || 0.9;
        if (isExplicit) break;
      }
    }
  }

  // Check for prohibited qualifiers (Rule 12(6): 'when packed', 'approx', 'not less than', 'average')
  const prohibitedPatterns = [
    { word: 'when packed', regex: /when\s+packed/i },
    { word: 'approximately / approx', regex: /\bapprox(?:imately)?\b/i },
    { word: 'not less than', regex: /not\s+less\s+than/i },
    { word: 'minimum', regex: /\bminimum\b/i },
    { word: 'average', regex: /\baverage\b/i },
  ];

  for (const p of prohibitedPatterns) {
    if (p.regex.test(fullTextLower)) {
      hasProhibitedQualifier = true;
      prohibitedQualifierWord = p.word;
      break;
    }
  }

  return {
    type: 'net_quantity',
    detected: detectedValue !== null,
    value: detectedValue,
    quantityNumber,
    unit,
    hasProhibitedQualifier,
    prohibitedQualifierWord,
    confidence: detectedValue ? Math.max(0.75, confidence) : 0,
    sourceImageId,
    boundingBox,
  };
};

/**
 * Extract Month and Year of Manufacture / Packing (Rule 6(1)(d))
 */
const extractMfgDate = (lines, fullText, fullTextLower) => {
  // Regex for Date: Mfg, Pkd, Date, Month/Year format (08/2026, 08/26, Aug 2026)
  const dateRegex = /(?:MFG|MFD|PKD|PACKED|PRE-PACKED|IMP|IMPORTED|DATE)\s*[:.-]?\s*([0-9]{1,2}[/-][0-9]{2,4}|(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[a-z]*[\s/-]+[0-9]{2,4})/i;

  let detectedValue = null;
  let sourceImageId = null;
  let boundingBox = null;
  let confidence = 0.5;

  for (const line of lines) {
    const match = line.text.match(dateRegex);
    if (match) {
      detectedValue = match[0].trim();
      sourceImageId = line.imageId;
      boundingBox = line.bbox;
      confidence = line.confidence / 100 || 0.85;
      break;
    }
  }

  // Fallback pattern: standalone MM/YYYY
  if (!detectedValue) {
    const standaloneMatch = fullText.match(/\b(0[1-9]|1[0-2])[/-](20[2-3][0-9])\b/);
    if (standaloneMatch) {
      detectedValue = `Mfg Date: ${standaloneMatch[0]}`;
      confidence = 0.7;
    }
  }

  return {
    type: 'mfg_date',
    detected: detectedValue !== null,
    value: detectedValue,
    confidence: detectedValue ? Math.max(0.7, confidence) : 0,
    sourceImageId,
    boundingBox,
  };
};

/**
 * Extract Manufacturer / Packer / Importer Details (Rule 6(1)(a) & Rule 10)
 */
const extractManufacturer = (lines, fullText, fullTextLower) => {
  const mfgKeywords = /(?:mfg\s*by|manufactured\s*by|mfd\s*by|packed\s*by|pkd\s*by|marketed\s*by|imported\s*by)\s*[:.-]?\s*(.+)/i;

  let detectedValue = null;
  let sourceImageId = null;
  let boundingBox = null;
  let hasAddress = false;
  let hasPinCode = false;
  let confidence = 0.5;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.text.match(mfgKeywords);
    if (match) {
      // Gather company name and subsequent lines as address
      let fullAddress = match[1].trim();
      sourceImageId = line.imageId;
      boundingBox = line.bbox;
      confidence = line.confidence / 100 || 0.88;

      // Look at the next 2-3 lines for address details
      for (let j = 1; j <= 3 && i + j < lines.length; j++) {
        const nextLine = lines[i + j].text.trim();
        if (nextLine.length > 3 && !nextLine.toLowerCase().includes('mrp') && !nextLine.toLowerCase().includes('net qty')) {
          fullAddress += `, ${nextLine}`;
        }
      }

      detectedValue = fullAddress;
      break;
    }
  }

  // Check for 6-digit Indian Postal PIN code (e.g. 110001, 400001)
  const pinMatch = (detectedValue || fullText).match(/\b[1-9][0-9]{5}\b/);
  if (pinMatch) {
    hasPinCode = true;
    hasAddress = true;
  }

  if (
    fullTextLower.includes('road') ||
    fullTextLower.includes('street') ||
    fullTextLower.includes('dist') ||
    fullTextLower.includes('nagar') ||
    fullTextLower.includes('plot') ||
    fullTextLower.includes('estate') ||
    fullTextLower.includes('india')
  ) {
    hasAddress = true;
  }

  return {
    type: 'manufacturer',
    detected: detectedValue !== null || (fullTextLower.includes('manufactured by') || fullTextLower.includes('mfg by')),
    value: detectedValue || (fullTextLower.includes('manufactured by') ? 'Manufacturer declared on packaging' : null),
    hasAddress,
    hasPinCode,
    confidence: detectedValue ? Math.max(0.75, confidence) : 0,
    sourceImageId,
    boundingBox,
  };
};

/**
 * Extract Consumer Care Details (Rule 6(2))
 */
const extractConsumerCare = (lines, fullText, fullTextLower) => {
  let detectedValue = null;
  let hasPhone = false;
  let hasEmail = false;
  let hasPostal = false;
  let sourceImageId = null;
  let boundingBox = null;
  let confidence = 0.5;

  // Search for email
  const emailMatch = fullText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    hasEmail = true;
    detectedValue = emailMatch[0];
  }

  // Search for phone / toll-free / helpline
  const phoneMatch = fullText.match(/(?:1800\s*[0-9]{3}\s*[0-9]{3,4}|\+?91[\s-]?[6-9][0-9]{9}|[0-9]{3,4}[\s-]?[0-9]{6,8})/);
  if (phoneMatch) {
    hasPhone = true;
    detectedValue = detectedValue ? `${detectedValue} | Tel: ${phoneMatch[0]}` : `Tel: ${phoneMatch[0]}`;
  }

  // Find line with consumer care header for bounding box
  for (const line of lines) {
    const textLower = line.text.toLowerCase();
    if (
      textLower.includes('consumer') ||
      textLower.includes('customer care') ||
      textLower.includes('helpline') ||
      textLower.includes('feedback') ||
      textLower.includes('queries')
    ) {
      sourceImageId = line.imageId;
      boundingBox = line.bbox;
      confidence = line.confidence / 100 || 0.85;
      hasPostal = true;
      if (!detectedValue) {
        detectedValue = line.text;
      }
      break;
    }
  }

  return {
    type: 'consumer_care',
    detected: hasPhone || hasEmail || detectedValue !== null,
    value: detectedValue,
    hasPhone,
    hasEmail,
    hasPostal,
    confidence: detectedValue ? Math.max(0.7, confidence) : 0,
    sourceImageId,
    boundingBox,
  };
};

/**
 * Extract Generic / Common Commodity Name (Rule 6(1)(b)) using ML model
 */
const extractGenericName = (mlClassifications, allLines, fullTextLower) => {
  let candidate = null;
  let confidence = 0.5;
  let boundingBox = null;
  let sourceImageId = null;

  // Utilize the custom ML Model's classification
  if (mlClassifications && mlClassifications.PRODUCT_NAME && mlClassifications.PRODUCT_NAME.length > 0) {
    const bestMatch = mlClassifications.PRODUCT_NAME[0];
    candidate = bestMatch.text;
    confidence = Math.max(0.7, bestMatch.mlConfidence);
    boundingBox = bestMatch.bbox;
    sourceImageId = bestMatch.imageId;
  } else if (allLines && allLines.length > 0) {
    // Fallback: Pick the most confident prominent line
    const nonMetaLines = allLines.filter((l) => {
      const lower = l.text.toLowerCase();
      return (
        l.text.length > 3 &&
        !lower.includes('mrp') &&
        !lower.includes('mfg') &&
        !lower.includes('batch') &&
        !lower.includes('weight') &&
        !lower.includes('tax')
      );
    });

    if (nonMetaLines.length > 0) {
      candidate = nonMetaLines[0].text;
      boundingBox = nonMetaLines[0].bbox;
      sourceImageId = nonMetaLines[0].imageId;
    }
  }

  return {
    type: 'generic_name',
    detected: candidate !== null,
    value: candidate || 'Generic commodity name declared',
    confidence,
    boundingBox,
    sourceImageId
  };
};
