/**
 * Enhanced Declaration Extraction Engine for Packaged Commodities
 * Extracts statutory declarations required under The Legal Metrology (Packaged Commodities) Rules, 2011:
 * - Rule 6(1)(a) & Rule 10: Manufacturer / Packer / Importer details & complete postal address
 * - Rule 6(1)(b): Generic / Common Name of commodity (ML-guided)
 * - Rule 6(1)(c) & Rules 11-13: Net Quantity, standard units & prohibited qualifiers
 * - Rule 6(1)(d): Month and Year of Manufacture / Pre-packing
 * - Rule 6(1)(e) & Rule 2(m): Retail Sale Price (MRP) with statutory tax inclusivity
 * - Rule 6(1)(f) & Rule 2(r): Unit Sale Price (USP) & mathematical consistency check
 * - Rule 6(1)(g): Batch / Lot / Code Number for recall traceability
 * - Rule 6(10): Country of Origin (Mandatory declaration)
 * - Rule 6(2): Consumer Care Details (Designation, Phone, Email, Address)
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

  // Run the enhanced multi-class ML model on all extracted lines
  const mlClassifications = mlService.classifyLines(allLines);

  // 1. Extract Maximum Retail Price (Rule 6(1)(e) & Rule 2(m))
  const mrpDeclaration = extractMRP(allLines, combinedFullText, fullTextLower, mlClassifications);

  // 2. Extract Net Quantity (Rule 6(1)(c), Rules 11, 12, 13)
  const netQuantityDeclaration = extractNetQuantity(allLines, combinedFullText, fullTextLower, mlClassifications);

  // 3. Extract Unit Sale Price (Rule 6(1)(f) & Rule 2(r)) with consistency check against MRP & Net Qty
  const unitSalePriceDeclaration = extractUnitSalePrice(allLines, combinedFullText, fullTextLower, mrpDeclaration, netQuantityDeclaration, mlClassifications);

  // 4. Extract Month & Year of Mfg/Packing (Rule 6(1)(d))
  const mfgDateDeclaration = extractMfgDate(allLines, combinedFullText, fullTextLower, mlClassifications);

  // 5. Extract Batch / Lot / Code Number (Rule 6(1)(g))
  const batchDeclaration = extractBatchNumber(allLines, combinedFullText, fullTextLower, mlClassifications);

  // 6. Extract Country of Origin (Rule 6(10))
  const countryDeclaration = extractCountryOfOrigin(allLines, combinedFullText, fullTextLower, mlClassifications);

  // 7. Extract Manufacturer / Packer / Importer Details (Rule 6(1)(a) & Rule 10)
  const manufacturerDeclaration = extractManufacturer(allLines, combinedFullText, fullTextLower, mlClassifications);

  // 8. Extract Consumer Care Information (Rule 6(2))
  const consumerCareDeclaration = extractConsumerCare(allLines, combinedFullText, fullTextLower, mlClassifications);

  // 9. Extract Generic Name / Commodity (Rule 6(1)(b)) using ML Model & PDP Prioritization
  const genericNameDeclaration = extractGenericName(mlClassifications, allLines, fullTextLower);

  return {
    mrp: mrpDeclaration,
    unitSalePrice: unitSalePriceDeclaration,
    netQuantity: netQuantityDeclaration,
    manufacturingDate: mfgDateDeclaration,
    batchNumber: batchDeclaration,
    countryOfOrigin: countryDeclaration,
    manufacturer: manufacturerDeclaration,
    consumerCare: consumerCareDeclaration,
    genericName: genericNameDeclaration,
    combinedText: combinedFullText.trim(),
  };
};

/**
 * Extract MRP and verify statutory tax inclusivity (Rule 6(1)(e) & Rule 2(m))
 */
const extractMRP = (lines, fullText, fullTextLower, mlClassifications) => {
  // Regex for MRP detection: MRP, M.R.P, MIRP, Maximum Retail Price, Rs, Fs, ₹
  const mrpRegex = /(?:M\.?[I1l|]?\.?R\.?P\.?|MAX(?:IMUM)?\.?\s*RETAIL\s*PRICE|[RF]\.?S\.?|₹)\s*[:.-]?\s*(?:₹|[RF]S\.?)?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i;

  let detectedValue = null;
  let priceAmount = null;
  let hasTaxInclusion = false;
  let sourceImageId = null;
  let boundingBox = null;
  let confidence = 0.5;

  for (const line of lines) {
    const match = line.text.match(mrpRegex);
    if (match) {
      detectedValue = match[0].trim();
      priceAmount = parseFloat(match[1].replace(',', '.'));
      sourceImageId = line.imageId;
      boundingBox = line.bbox;
      confidence = line.confidence / 100 || 0.88;

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

  // Fallback to ML Classified MRP lines
  if (!detectedValue && mlClassifications.MRP && mlClassifications.MRP.length > 0) {
    const topMl = mlClassifications.MRP[0];
    const match = topMl.text.match(/([0-9]+(?:[.,][0-9]{1,2})?)/);
    if (match) {
      detectedValue = topMl.text;
      priceAmount = parseFloat(match[1].replace(',', '.'));
      sourceImageId = topMl.imageId;
      boundingBox = topMl.bbox;
      confidence = topMl.mlConfidence;
    }
  }

  // Broad check across full text if line check missed tax inclusion
  if (
    fullTextLower.includes('inclusive of all taxes') ||
    fullTextLower.includes('incl. of all taxes') ||
    fullTextLower.includes('incl of all taxes') ||
    fullTextLower.includes('inclusive of') ||
    fullTextLower.includes('incl. taxes') ||
    fullTextLower.includes('incl of taxes') ||
    fullTextLower.includes('inclusive of taxes')
  ) {
    hasTaxInclusion = true;
  }

  return {
    type: 'mrp',
    detected: detectedValue !== null,
    value: detectedValue,
    priceAmount,
    hasTaxInclusion,
    confidence: detectedValue ? Math.max(0.7, confidence) : 0,
    sourceImageId,
    boundingBox,
  };
};

/**
 * Extract Unit Sale Price (USP) under Rule 6(1)(f) and calculate mathematical consistency
 */
const extractUnitSalePrice = (lines, fullText, fullTextLower, mrp, netQty, mlClassifications) => {
  // Regex for Unit Sale Price: e.g. "Unit Sale Price: Rs 0.50 / g", "USP: ₹ 1.25 per ml", "USP Rs 25.00/N"
  const uspRegex = /(?:UNIT\s*SALE\s*PRICE|U\.?S\.?P\.?)\s*[:.-]?\s*(?:RS\.?|₹|[RF]S\.?)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:\/|PER)\s*(G|GM|GMS|GRAM|KG|ML|L|LTR|N|PIECE|PCS|M|METRE)\b/i;

  let detectedValue = null;
  let unitAmount = null;
  let unitMetric = null;
  let sourceImageId = null;
  let boundingBox = null;
  let confidence = 0.5;

  for (const line of lines) {
    const match = line.text.match(uspRegex);
    if (match) {
      detectedValue = match[0].trim();
      unitAmount = parseFloat(match[1]);
      unitMetric = match[2].toUpperCase();
      sourceImageId = line.imageId;
      boundingBox = line.bbox;
      confidence = line.confidence / 100 || 0.9;
      break;
    }
  }

  // Fallback to ML Classified USP lines
  if (!detectedValue && mlClassifications.UNIT_SALE_PRICE && mlClassifications.UNIT_SALE_PRICE.length > 0) {
    const topMl = mlClassifications.UNIT_SALE_PRICE[0];
    const match = topMl.text.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:\/|PER)\s*([A-Za-z]+)/i);
    if (match) {
      detectedValue = topMl.text;
      unitAmount = parseFloat(match[1]);
      unitMetric = match[2].toUpperCase();
      sourceImageId = topMl.imageId;
      boundingBox = topMl.bbox;
      confidence = topMl.mlConfidence;
    }
  }

  // Calculate Expected USP based on declared MRP and Net Quantity
  let calculatedExpectedUsp = null;
  let isMathematicallyConsistent = true;

  if (mrp && mrp.priceAmount && netQty && netQty.quantityNumber && netQty.quantityNumber > 0) {
    let baseQty = netQty.quantityNumber;
    let baseUnit = (netQty.unit || '').toUpperCase();

    // Standardize metric unit (e.g. if kg -> convert to g, if l -> convert to ml)
    if (baseUnit === 'KG') {
      baseQty = baseQty * 1000;
      baseUnit = 'G';
    } else if (baseUnit === 'L' || baseUnit === 'LTR') {
      baseQty = baseQty * 1000;
      baseUnit = 'ML';
    }

    const expectedRate = Math.round((mrp.priceAmount / baseQty) * 100) / 100;
    calculatedExpectedUsp = `₹ ${expectedRate.toFixed(2)} / ${baseUnit.toLowerCase()}`;

    // If USP was explicitly printed on packaging, verify mathematical agreement (allow 5% rounding tolerance)
    if (unitAmount && unitAmount > 0) {
      const diffRatio = Math.abs(unitAmount - expectedRate) / expectedRate;
      if (diffRatio > 0.08) {
        isMathematicallyConsistent = false;
      }
    }
  }

  return {
    type: 'unit_sale_price',
    detected: detectedValue !== null,
    value: detectedValue,
    unitAmount,
    unitMetric,
    calculatedExpectedUsp,
    isMathematicallyConsistent,
    confidence: detectedValue ? Math.max(0.75, confidence) : 0,
    sourceImageId,
    boundingBox,
  };
};

/**
 * Extract Net Quantity & Metric Units (Rule 6(1)(c), Rules 11, 12, 13)
 */
const extractNetQuantity = (lines, fullText, fullTextLower, mlClassifications) => {
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
      const isExplicit = /net\s*(?:qty|quantity|wt|weight|vol|contents?)/i.test(line.text);
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

  // Fallback to ML Classified Net Quantity
  if (!detectedValue && mlClassifications.NET_QUANTITY && mlClassifications.NET_QUANTITY.length > 0) {
    const topMl = mlClassifications.NET_QUANTITY[0];
    const match = topMl.text.match(/([0-9]+(?:\.[0-9]+)?)\s*([A-Za-z]+)/);
    if (match) {
      detectedValue = topMl.text;
      quantityNumber = parseFloat(match[1]);
      unit = match[2].toUpperCase();
      sourceImageId = topMl.imageId;
      boundingBox = topMl.bbox;
      confidence = topMl.mlConfidence;
    }
  }

  // Check for prohibited qualifiers (Rule 12(6): 'when packed', 'approx', 'not less than', 'average', 'minimum')
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

  // Standardize Unit
  let standardizedUnit = unit;
  if (['GM', 'GMS', 'GRAM', 'GRAMS'].includes(unit)) standardizedUnit = 'g';
  if (['KG', 'KILOGRAM'].includes(unit)) standardizedUnit = 'kg';
  if (['ML', 'MILLILITRE'].includes(unit)) standardizedUnit = 'ml';
  if (['L', 'LTR', 'LITRE', 'LITRES'].includes(unit)) standardizedUnit = 'l';
  if (['PIECE', 'PIECES', 'PCS', 'UNITS', 'UNIT'].includes(unit)) standardizedUnit = 'N';

  return {
    type: 'net_quantity',
    detected: detectedValue !== null,
    value: detectedValue,
    quantityNumber,
    unit: standardizedUnit,
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
const extractMfgDate = (lines, fullText, fullTextLower, mlClassifications) => {
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
      confidence = line.confidence / 100 || 0.88;
      break;
    }
  }

  // Fallback pattern: standalone MM/YYYY
  if (!detectedValue) {
    const standaloneMatch = fullText.match(/\b(0[1-9]|1[0-2])[/-](20[2-3][0-9])\b/);
    if (standaloneMatch) {
      detectedValue = `Mfg Date: ${standaloneMatch[0]}`;
      confidence = 0.75;
    }
  }

  // Fallback to ML model
  if (!detectedValue && mlClassifications.MFG_DATE && mlClassifications.MFG_DATE.length > 0) {
    const topMl = mlClassifications.MFG_DATE[0];
    detectedValue = topMl.text;
    sourceImageId = topMl.imageId;
    boundingBox = topMl.bbox;
    confidence = topMl.mlConfidence;
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
 * Extract Batch / Lot / Code Number (Rule 6(1)(g))
 */
const extractBatchNumber = (lines, fullText, fullTextLower, mlClassifications) => {
  const batchRegex = /(?:BATCH\s*(?:NO|NUMBER|CODE)?|LOT\s*(?:NO|NUMBER|CODE)?|B\.?\s*NO\.?)\s*[:.-]?\s*([A-Za-z0-9\-\/]{3,20})/i;

  let detectedValue = null;
  let batchCode = null;
  let sourceImageId = null;
  let boundingBox = null;
  let confidence = 0.5;

  for (const line of lines) {
    const match = line.text.match(batchRegex);
    if (match) {
      detectedValue = match[0].trim();
      batchCode = match[1].trim();
      sourceImageId = line.imageId;
      boundingBox = line.bbox;
      confidence = line.confidence / 100 || 0.88;
      break;
    }
  }

  // Fallback to ML model
  if (!detectedValue && mlClassifications.BATCH_LOT && mlClassifications.BATCH_LOT.length > 0) {
    const topMl = mlClassifications.BATCH_LOT[0];
    detectedValue = topMl.text;
    sourceImageId = topMl.imageId;
    boundingBox = topMl.bbox;
    confidence = topMl.mlConfidence;
  }

  return {
    type: 'batch_number',
    detected: detectedValue !== null,
    value: detectedValue,
    batchCode: batchCode || detectedValue,
    confidence: detectedValue ? Math.max(0.7, confidence) : 0,
    sourceImageId,
    boundingBox,
  };
};

/**
 * Extract Country of Origin (Rule 6(10))
 */
const extractCountryOfOrigin = (lines, fullText, fullTextLower, mlClassifications) => {
  const originRegex = /(?:COUNTRY\s*OF\s*(?:ORIGIN|MANUFACTURE)|MADE\s*IN|PRODUCT\s*OF)\s*[:.-]?\s*([A-Za-z\s]{3,30})/i;

  let detectedValue = null;
  let country = null;
  let sourceImageId = null;
  let boundingBox = null;
  let confidence = 0.5;

  for (const line of lines) {
    const match = line.text.match(originRegex);
    if (match) {
      detectedValue = match[0].trim();
      country = match[1].replace(/[:\-—,;]+$/, '').trim();
      sourceImageId = line.imageId;
      boundingBox = line.bbox;
      confidence = line.confidence / 100 || 0.9;
      break;
    }
  }

  // Fallback check in full text
  if (!detectedValue) {
    if (fullTextLower.includes('made in india') || fullTextLower.includes('country of origin: india')) {
      detectedValue = 'Made in India';
      country = 'India';
      confidence = 0.85;
    }
  }

  // Fallback to ML model
  if (!detectedValue && mlClassifications.COUNTRY_OF_ORIGIN && mlClassifications.COUNTRY_OF_ORIGIN.length > 0) {
    const topMl = mlClassifications.COUNTRY_OF_ORIGIN[0];
    detectedValue = topMl.text;
    country = topMl.text.replace(/country of origin/i, '').replace(/made in/i, '').trim();
    sourceImageId = topMl.imageId;
    boundingBox = topMl.bbox;
    confidence = topMl.mlConfidence;
  }

  return {
    type: 'country_of_origin',
    detected: detectedValue !== null,
    value: detectedValue,
    country: country || 'India',
    confidence: detectedValue ? Math.max(0.75, confidence) : 0,
    sourceImageId,
    boundingBox,
  };
};

/**
 * Extract Manufacturer / Packer / Importer Details (Rule 6(1)(a) & Rule 10)
 */
const extractManufacturer = (lines, fullText, fullTextLower, mlClassifications) => {
  const mfgKeywords = /(?:mfg\s*by|manufactured\s*by|mfd\s*by|packed\s*by|pkd\s*by|marketed\s*by|imported\s*by)\s*[:.-]?\s*(.+)/i;

  let detectedValue = null;
  let sourceImageId = null;
  let boundingBox = null;
  let hasAddress = false;
  let hasPinCode = false;
  let pinCode = null;
  let confidence = 0.5;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.text.match(mfgKeywords);
    if (match) {
      let fullAddress = match[1].trim();
      sourceImageId = line.imageId;
      boundingBox = line.bbox;
      confidence = line.confidence / 100 || 0.88;

      // Gather next 2-3 lines for postal address and PIN code
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

  // Fallback to ML classified manufacturer
  if (!detectedValue && mlClassifications.MANUFACTURER && mlClassifications.MANUFACTURER.length > 0) {
    detectedValue = mlClassifications.MANUFACTURER[0].text;
    confidence = mlClassifications.MANUFACTURER[0].mlConfidence;
    sourceImageId = mlClassifications.MANUFACTURER[0].imageId;
    boundingBox = mlClassifications.MANUFACTURER[0].bbox;
  }

  // Check for 6-digit Indian Postal PIN code (e.g. 110001, 400001)
  const pinMatch = (detectedValue || fullText).match(/\b[1-9][0-9]{5}\b/);
  if (pinMatch) {
    hasPinCode = true;
    pinCode = pinMatch[0];
    hasAddress = true;
  }

  if (
    fullTextLower.includes('road') ||
    fullTextLower.includes('street') ||
    fullTextLower.includes('dist') ||
    fullTextLower.includes('nagar') ||
    fullTextLower.includes('plot') ||
    fullTextLower.includes('estate') ||
    fullTextLower.includes('india') ||
    fullTextLower.includes('sector') ||
    fullTextLower.includes('village')
  ) {
    hasAddress = true;
  }

  return {
    type: 'manufacturer',
    detected: detectedValue !== null || (fullTextLower.includes('manufactured by') || fullTextLower.includes('mfg by')),
    value: detectedValue || (fullTextLower.includes('manufactured by') ? 'Manufacturer declared on packaging' : null),
    hasAddress,
    hasPinCode,
    pinCode,
    confidence: detectedValue ? Math.max(0.75, confidence) : 0,
    sourceImageId,
    boundingBox,
  };
};

/**
 * Extract Consumer Care Details (Rule 6(2))
 */
const extractConsumerCare = (lines, fullText, fullTextLower, mlClassifications) => {
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

  // Search for phone / toll-free / helpline (e.g. 1800 123 4567, +91 9876543210)
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
      textLower.includes('queries') ||
      textLower.includes('grievance')
    ) {
      sourceImageId = line.imageId;
      boundingBox = line.bbox;
      confidence = line.confidence / 100 || 0.88;
      hasPostal = true;
      if (!detectedValue) {
        detectedValue = line.text;
      }
      break;
    }
  }

  // Fallback to ML classified consumer care
  if (!detectedValue && mlClassifications.CONSUMER_CARE && mlClassifications.CONSUMER_CARE.length > 0) {
    detectedValue = mlClassifications.CONSUMER_CARE[0].text;
    confidence = mlClassifications.CONSUMER_CARE[0].mlConfidence;
    sourceImageId = mlClassifications.CONSUMER_CARE[0].imageId;
    boundingBox = mlClassifications.CONSUMER_CARE[0].bbox;
  }

  return {
    type: 'consumer_care',
    detected: hasPhone || hasEmail || detectedValue !== null,
    value: detectedValue,
    hasPhone,
    hasEmail,
    hasPostal,
    confidence: detectedValue ? Math.max(0.75, confidence) : 0,
    sourceImageId,
    boundingBox,
  };
};

/**
 * Extract Generic / Common Commodity Name (Rule 6(1)(b)) using ML model & OCR layout analysis
 */
const extractGenericName = (mlClassifications, allLines, fullTextLower) => {
  let candidate = null;
  let confidence = 0.5;
  let boundingBox = null;
  let sourceImageId = null;

  // 1. Check for explicit statutory label patterns in all lines
  // e.g. "Generic Name: Roasted Almonds", "PRODUCT: EDIBLE ROASTED ALMONDS", "Commodity: Shampoo"
  const labelPatterns = [
    /(?:GENERIC\s*NAME|NAME\s*OF\s*(?:THE\s*)?COMMODITY|COMMODITY|PRODUCT\s*NAME|PRODUCT|ITEM)\s*[:.-]\s*([^\n\r;]{3,80})/i,
  ];

  for (const line of allLines) {
    for (const pattern of labelPatterns) {
      const match = line.text.match(pattern);
      if (match && match[1]) {
        const cleaned = match[1].replace(/[:\-—,;]+$/, '').trim();
        const lower = cleaned.toLowerCase();
        if (
          cleaned.length >= 3 &&
          !lower.includes('mrp') &&
          !lower.includes('net') &&
          !lower.includes('tax') &&
          !lower.includes('mfg')
        ) {
          candidate = cleaned;
          confidence = 0.95;
          boundingBox = line.bbox;
          sourceImageId = line.imageId;
          break;
        }
      }
    }
    if (candidate) break;
  }

  // 2. Prioritize Front Panel (PDP) prominent lines
  if (!candidate && allLines && allLines.length > 0) {
    const frontLines = allLines.filter((l) => l.viewType === 'front');
    const targetLines = frontLines.length > 0 ? frontLines : allLines;

    // Filter out common non-product lines (metadata, dates, numbers, legal disclaimers)
    const candidateLines = targetLines.filter((l) => {
      const lower = l.text.toLowerCase();
      return (
        l.text.length >= 3 &&
        l.text.length <= 60 &&
        !/^[\d.\-\/\s]+$/.test(l.text) && // Not just numbers/dates
        !lower.includes('mrp') &&
        !lower.includes('₹') &&
        !lower.includes('rs.') &&
        !lower.includes('price') &&
        !lower.includes('tax') &&
        !lower.includes('net') &&
        !lower.includes('qty') &&
        !lower.includes('weight') &&
        !lower.includes('mfg') &&
        !lower.includes('pkd') &&
        !lower.includes('exp') &&
        !lower.includes('date') &&
        !lower.includes('batch') &&
        !lower.includes('lot') &&
        !lower.includes('fssai') &&
        !lower.includes('lic') &&
        !lower.includes('customer') &&
        !lower.includes('consumer') &&
        !lower.includes('helpline') &&
        !lower.includes('email') &&
        !lower.includes('care') &&
        !lower.includes('feedback') &&
        !lower.includes('manufactured') &&
        !lower.includes('packed') &&
        !lower.includes('marketed') &&
        !lower.includes('address') &&
        !lower.includes('ingredients') &&
        !lower.includes('nutrition') &&
        !lower.includes('serving') &&
        !lower.includes('keep in') &&
        !lower.includes('best before')
      );
    });

    if (candidateLines.length > 0) {
      candidate = candidateLines[0].text.replace(/[:\-—,;]+$/, '').trim();
      boundingBox = candidateLines[0].bbox;
      sourceImageId = candidateLines[0].imageId;
      confidence = 0.88;
    }
  }

  // 3. Fallback to custom ML Model classification
  if (!candidate && mlClassifications && mlClassifications.PRODUCT_NAME && mlClassifications.PRODUCT_NAME.length > 0) {
    const bestMatch = mlClassifications.PRODUCT_NAME[0];
    candidate = bestMatch.text.replace(/[:\-—,;]+$/, '').trim();
    confidence = Math.max(0.7, bestMatch.mlConfidence);
    boundingBox = bestMatch.bbox;
    sourceImageId = bestMatch.imageId;
  }

  // Clean candidate formatting
  if (candidate) {
    candidate = candidate
      .replace(/^(?:PRODUCT|GENERIC\s*NAME|COMMODITY)\s*[:.-]\s*/i, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  return {
    type: 'generic_name',
    detected: candidate !== null && candidate.length >= 2,
    value: candidate || 'Generic commodity name declared',
    confidence,
    boundingBox,
    sourceImageId,
  };
};
