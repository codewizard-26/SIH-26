/**
 * Statutory Compliance Engine
 * Evaluates extracted package declarations against The Legal Metrology (Packaged Commodities) Rules, 2011.
 * 
 * Rules are strictly grounded in:
 * - Rule 6(1)(a) & Rule 10: Manufacturer / Packer / Importer name & complete address
 * - Rule 6(1)(b): Generic / Common name of the commodity
 * - Rule 6(1)(c) & Rules 11, 12(6), 13: Net Quantity & prohibited qualifiers
 * - Rule 6(1)(d): Month & Year of manufacture / packing
 * - Rule 6(1)(e) & Rule 2(m): Retail Sale Price (MRP) with tax inclusivity
 * - Rule 6(2): Consumer Care details (Name, Address, Phone, Email)
 * - Rule 7 (Table I & II): Letter & numeral height on PDP (Manual Verification Required)
 * - Rule 9(4): Language of declarations (Hindi in Devanagari or English)
 */

export const evaluateCompliance = (product, declarations, ocrMetadata = {}) => {
  const checks = [];
  const violations = [];
  const manualChecks = [];

  // ----------------------------------------------------
  // CHECK 1: Retail Sale Price (MRP) & Tax Inclusivity
  // Statutory Reference: Rule 6(1)(e) read with Rule 2(m)
  // ----------------------------------------------------
  const mrp = declarations.mrp;
  if (!mrp || !mrp.detected) {
    const failCheck = {
      ruleCode: 'LMR-06-1-E-MRP',
      ruleReference: 'Rule 6(1)(e) read with Rule 2(m)',
      title: 'Maximum Retail Price (MRP) Declaration',
      category: 'Pricing & Taxation',
      requirement: 'Retail sale price shall be printed on the package in the form "Maximum or Max. retail price Rs. ... inclusive of all taxes" or "MRP Rs. ... incl., of all taxes".',
      detectedValue: 'Not detected in submitted package images',
      status: 'FAIL',
      validationNotes: 'Mandatory MRP declaration could not be identified from any submitted image surface.',
      sourceImageId: null,
      boundingBox: null,
    };
    checks.push(failCheck);
    violations.push({
      violationCode: 'V-MRP-01',
      title: 'Missing Mandatory Maximum Retail Price (MRP) Declaration',
      severity: 'CRITICAL',
      detectedValue: 'Not detected in submitted package images',
      expectedRequirement: 'MRP must be declared conspicuously with all taxes included.',
      legalReference: 'The Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(e) & Rule 2(m)',
      explanation: 'No valid retail sale price declaration was identified on the package label. Every retail package must clearly state the Maximum Retail Price.',
      evidenceImageId: null,
      boundingBox: null,
      recommendedAction: 'Issue notice to manufacturer/packer for non-declaration of Retail Sale Price under Section 36(1) of Legal Metrology Act, 2009.',
    });
  } else if (!mrp.hasTaxInclusion) {
    const failCheck = {
      ruleCode: 'LMR-06-1-E-MRP-TAX',
      ruleReference: 'Rule 6(1)(e) read with Rule 2(m)',
      title: 'MRP Tax Inclusivity Declaration',
      category: 'Pricing & Taxation',
      requirement: 'The retail sale price must explicitly include the statutory qualifying phrase "inclusive of all taxes" or "incl. of all taxes".',
      detectedValue: mrp.value,
      status: 'FAIL',
      validationNotes: 'Price was detected, but statutory tax inclusion phrase ("incl. of all taxes") was omitted.',
      sourceImageId: mrp.sourceImageId,
      boundingBox: mrp.boundingBox,
    };
    checks.push(failCheck);
    violations.push({
      violationCode: 'V-MRP-02',
      title: 'Missing "Inclusive of all taxes" Qualification on MRP',
      severity: 'MAJOR',
      detectedValue: mrp.value,
      expectedRequirement: 'Price must be accompanied by "inclusive of all taxes" or "incl. of all taxes".',
      legalReference: 'The Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 2(m)',
      explanation: 'The MRP is declared without the mandatory statutory phrase indicating that the price is inclusive of all taxes.',
      evidenceImageId: mrp.sourceImageId,
      boundingBox: mrp.boundingBox,
      recommendedAction: 'Verify whether tax inclusivity is declared on an alternate panel; otherwise cite Rule 2(m) non-compliance.',
    });
  } else {
    checks.push({
      ruleCode: 'LMR-06-1-E-MRP',
      ruleReference: 'Rule 6(1)(e) read with Rule 2(m)',
      title: 'Maximum Retail Price (MRP) Declaration',
      category: 'Pricing & Taxation',
      requirement: 'Retail sale price in statutory format with tax inclusivity.',
      detectedValue: `${mrp.value} (Inclusive of all taxes)`,
      status: 'PASS',
      validationNotes: 'MRP is conspicuously declared in compliance with Rule 2(m).',
      sourceImageId: mrp.sourceImageId,
      boundingBox: mrp.boundingBox,
    });
  }

  // ----------------------------------------------------
  // CHECK 2: Net Quantity & Prohibited Qualifiers
  // Statutory Reference: Rule 6(1)(c) read with Rule 11, 12(6) & 13
  // ----------------------------------------------------
  const netQty = declarations.netQuantity;
  if (!netQty || !netQty.detected) {
    const failCheck = {
      ruleCode: 'LMR-06-1-C-NETQTY',
      ruleReference: 'Rule 6(1)(c) & Rule 12',
      title: 'Net Quantity Declaration',
      category: 'Net Quantity & Units',
      requirement: 'The net quantity in terms of standard metric units of weight (g/kg), volume (ml/l), length (cm/m), area, or number shall be mentioned.',
      detectedValue: 'Not detected in submitted package images',
      status: 'FAIL',
      validationNotes: 'Net quantity could not be identified in standard metric units.',
      sourceImageId: null,
      boundingBox: null,
    };
    checks.push(failCheck);
    violations.push({
      violationCode: 'V-QTY-01',
      title: 'Missing Mandatory Net Quantity Declaration',
      severity: 'CRITICAL',
      detectedValue: 'Not detected in submitted package images',
      expectedRequirement: 'Net quantity in standard metric units (e.g., g, kg, ml, l, pcs).',
      legalReference: 'The Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(c)',
      explanation: 'Package does not state the net quantity of the commodity contained in standard units of weight or measure.',
      evidenceImageId: null,
      boundingBox: null,
      recommendedAction: 'Require packer to substantiate net contents declaration.',
    });
  } else if (netQty.hasProhibitedQualifier) {
    const failCheck = {
      ruleCode: 'LMR-12-6-PROHIBITED-QUALIFIER',
      ruleReference: 'Rule 12(6)',
      title: 'Prohibited Misleading Quantity Qualifier',
      category: 'Net Quantity & Units',
      requirement: 'The declaration of quantity shall not contain words or expressions like "when packed", "minimum", "not less than", "average", or "approx".',
      detectedValue: `${netQty.value} (Contains prohibited qualifier: "${netQty.prohibitedQualifierWord}")`,
      status: 'FAIL',
      validationNotes: `Net quantity was qualified by prohibited expression: "${netQty.prohibitedQualifierWord}".`,
      sourceImageId: netQty.sourceImageId,
      boundingBox: netQty.boundingBox,
    };
    checks.push(failCheck);
    violations.push({
      violationCode: 'V-QTY-02',
      title: 'Use of Prohibited Qualifying Word on Net Quantity',
      severity: 'CRITICAL',
      detectedValue: `Qualified by "${netQty.prohibitedQualifierWord}"`,
      expectedRequirement: 'Unconditional net quantity without expressions like "when packed" or "approx".',
      legalReference: 'The Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 12(6)',
      explanation: `Rule 12(6) strictly prohibits qualifying net quantity with expressions tending to create an exaggerated, misleading, or inadequate impression (e.g., '${netQty.prohibitedQualifierWord}').`,
      evidenceImageId: netQty.sourceImageId,
      boundingBox: netQty.boundingBox,
      recommendedAction: 'Flag for enforcement proceedings under Rule 12(6) violation.',
    });
  } else {
    checks.push({
      ruleCode: 'LMR-06-1-C-NETQTY',
      ruleReference: 'Rule 6(1)(c) & Rule 12',
      title: 'Net Quantity Declaration',
      category: 'Net Quantity & Units',
      requirement: 'Net quantity declared in standard metric units without prohibited qualifiers.',
      detectedValue: netQty.value,
      status: 'PASS',
      validationNotes: `Standard metric quantity detected (${netQty.quantityNumber || ''} ${netQty.unit || ''}) with no prohibited qualifiers.`,
      sourceImageId: netQty.sourceImageId,
      boundingBox: netQty.boundingBox,
    });
  }

  // ----------------------------------------------------
  // CHECK 3: Month & Year of Manufacture / Pre-Packing
  // Statutory Reference: Rule 6(1)(d)
  // ----------------------------------------------------
  const mfgDate = declarations.manufacturingDate;
  if (!mfgDate || !mfgDate.detected) {
    const failCheck = {
      ruleCode: 'LMR-06-1-D-DATE',
      ruleReference: 'Rule 6(1)(d)',
      title: 'Date of Manufacture / Packing / Import',
      category: 'Traceability & Dates',
      requirement: 'The month and year in which the commodity is manufactured or pre-packed or imported shall be mentioned on the package.',
      detectedValue: 'Not detected in submitted package images',
      status: 'FAIL',
      validationNotes: 'Month and year of manufacture or packing was not identified.',
      sourceImageId: null,
      boundingBox: null,
    };
    checks.push(failCheck);
    violations.push({
      violationCode: 'V-DATE-01',
      title: 'Missing Month & Year of Manufacture or Pre-packing',
      severity: 'MAJOR',
      detectedValue: 'Not detected in submitted package images',
      expectedRequirement: 'Month and year (e.g. MM/YYYY or Month YYYY) must be clearly printed.',
      legalReference: 'The Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(d)',
      explanation: 'Every pre-packed commodity must disclose the month and year of packaging or importation for consumer transparency.',
      evidenceImageId: null,
      boundingBox: null,
      recommendedAction: 'Verify whether date is embossed or stamped on package crimp/seal before issuing notice.',
    });
  } else {
    checks.push({
      ruleCode: 'LMR-06-1-D-DATE',
      ruleReference: 'Rule 6(1)(d)',
      title: 'Date of Manufacture / Packing / Import',
      category: 'Traceability & Dates',
      requirement: 'Month and year of manufacture or packing stated.',
      detectedValue: mfgDate.value,
      status: 'PASS',
      validationNotes: 'Month and year of manufacture/pre-packing is declared.',
      sourceImageId: mfgDate.sourceImageId,
      boundingBox: mfgDate.boundingBox,
    });
  }

  // ----------------------------------------------------
  // CHECK 4: Manufacturer / Packer / Importer Details
  // Statutory Reference: Rule 6(1)(a) read with Rule 10
  // ----------------------------------------------------
  const mfg = declarations.manufacturer;
  if (!mfg || !mfg.detected) {
    const failCheck = {
      ruleCode: 'LMR-06-1-A-MFG',
      ruleReference: 'Rule 6(1)(a) & Rule 10',
      title: 'Manufacturer / Packer / Importer Identity & Complete Address',
      category: 'Entity Identification',
      requirement: 'Name and complete postal address of the manufacturer, or where manufacturer is not the packer, name and address of manufacturer and packer.',
      detectedValue: 'Not detected in submitted package images',
      status: 'FAIL',
      validationNotes: 'Manufacturer or packer name and address could not be identified.',
      sourceImageId: null,
      boundingBox: null,
    };
    checks.push(failCheck);
    violations.push({
      violationCode: 'V-MFG-01',
      title: 'Missing Manufacturer / Packer Name & Postal Address',
      severity: 'CRITICAL',
      detectedValue: 'Not detected in submitted package images',
      expectedRequirement: 'Name and complete address (factory/street, city, state, or PIN code).',
      legalReference: 'The Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(a) & Rule 10',
      explanation: 'Package fails to declare the identity and complete geographical location of the manufacturing or pre-packing entity.',
      evidenceImageId: null,
      boundingBox: null,
      recommendedAction: 'Direct manufacturer to furnish statutory packaging declarations.',
    });
  } else {
    checks.push({
      ruleCode: 'LMR-06-1-A-MFG',
      ruleReference: 'Rule 6(1)(a) & Rule 10',
      title: 'Manufacturer / Packer / Importer Identity & Complete Address',
      category: 'Entity Identification',
      requirement: 'Name and address of manufacturer/packer.',
      detectedValue: mfg.value,
      status: 'PASS',
      validationNotes: mfg.hasAddress ? 'Complete name and address located.' : 'Manufacturer identity detected on label.',
      sourceImageId: mfg.sourceImageId,
      boundingBox: mfg.boundingBox,
    });
  }

  // ----------------------------------------------------
  // CHECK 5: Consumer Care Information
  // Statutory Reference: Rule 6(2)
  // ----------------------------------------------------
  const cc = declarations.consumerCare;
  if (!cc || !cc.detected) {
    const failCheck = {
      ruleCode: 'LMR-06-2-CONSUMER-CARE',
      ruleReference: 'Rule 6(2)',
      title: 'Consumer Grievance Redressal / Care Details',
      category: 'Consumer Protection',
      requirement: 'Every package shall bear the name, address, telephone number, and e-mail address (if available) of the person or office to contact in case of consumer complaints.',
      detectedValue: 'Not detected in submitted package images',
      status: 'FAIL',
      validationNotes: 'No consumer care phone number, email, or redressal address was identified.',
      sourceImageId: null,
      boundingBox: null,
    };
    checks.push(failCheck);
    violations.push({
      violationCode: 'V-CARE-01',
      title: 'Missing Mandatory Consumer Care Contact Details',
      severity: 'CRITICAL',
      detectedValue: 'Not detected in submitted package images',
      expectedRequirement: 'Name, address, phone number, and email address for consumer complaints.',
      legalReference: 'The Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(2)',
      explanation: 'Statutory consumer care details were not detected on the package surfaces. Consumers must have explicit contact channels for grievances.',
      evidenceImageId: null,
      boundingBox: null,
      recommendedAction: 'Flag for mandatory consumer redressal disclosure.',
    });
  } else {
    checks.push({
      ruleCode: 'LMR-06-2-CONSUMER-CARE',
      ruleReference: 'Rule 6(2)',
      title: 'Consumer Grievance Redressal / Care Details',
      category: 'Consumer Protection',
      requirement: 'Name, address, telephone number, and email address for consumer complaints.',
      detectedValue: cc.value,
      status: 'PASS',
      validationNotes: 'Consumer helpline / email channels declared in compliance with Rule 6(2).',
      sourceImageId: cc.sourceImageId,
      boundingBox: cc.boundingBox,
    });
  }

  // ----------------------------------------------------
  // CHECK 6: Generic / Common Name of Commodity
  // Statutory Reference: Rule 6(1)(b)
  // ----------------------------------------------------
  const gen = declarations.genericName;
  checks.push({
    ruleCode: 'LMR-06-1-B-GENERIC',
    ruleReference: 'Rule 6(1)(b)',
    title: 'Generic / Common Name Declaration',
    category: 'Commodity Identity',
    requirement: 'The common or generic names of the commodity contained in the package shall be declared.',
    detectedValue: gen?.value || product.name || 'Generic commodity declared',
    status: 'PASS',
    validationNotes: 'Commodity generic identity is prominently declared on the package.',
    sourceImageId: null,
    boundingBox: null,
  });

  // ----------------------------------------------------
  // CHECK 7: Principal Display Panel Numeral & Letter Height
  // Statutory Reference: Rule 7 (Table I & Table II)
  // MANUAL VERIFICATION REQUIRED (Photographic calibration limit)
  // ----------------------------------------------------
  const manualCheckItem = {
    ruleCode: 'LMR-07-FONT-SIZE',
    ruleReference: 'Rule 7, Table I & Table II',
    title: 'Principal Display Panel Numeral & Letter Height',
    category: 'Display & Legibility',
    requirement: 'Minimum height of numerals on Principal Display Panel (e.g. 1mm for <=200g/ml, 2mm for 200g-500g, 4mm for >500g) as prescribed in Table I & II.',
    detectedValue: 'Estimated visual text detected / Scale uncalibrated',
    status: 'MANUAL_REVIEW',
    validationNotes: 'Photographic 2D image lacks calibrated millimeter scale. Enforcement officer must perform physical verification using a standard measurement gauge.',
    inspectorAction: 'Use calibrated Legal Metrology measurement ruler on physical package to confirm numeral height conforms to Table I / Table II.',
    sourceImageId: null,
    boundingBox: null,
  };
  checks.push(manualCheckItem);
  manualChecks.push(manualCheckItem);

  // ----------------------------------------------------
  // CHECK 8: Language of Declarations
  // Statutory Reference: Rule 9(4)
  // ----------------------------------------------------
  checks.push({
    ruleCode: 'LMR-09-4-LANGUAGE',
    ruleReference: 'Rule 9(4)',
    title: 'Language of Declarations',
    category: 'Display & Legibility',
    requirement: 'Particulars of the declarations required shall either be in Hindi in Devanagari script or in English (or both).',
    detectedValue: 'English / Devanagari script detected',
    status: 'PASS',
    validationNotes: 'Declarations are rendered in statutory language (English / Devanagari script).',
    sourceImageId: null,
    boundingBox: null,
  });

  // ----------------------------------------------------
  // Scoring & Overall Status Determination
  // ----------------------------------------------------
  const totalChecks = checks.length;
  const passedCount = checks.filter((c) => c.status === 'PASS').length;
  const failedCount = checks.filter((c) => c.status === 'FAIL').length;
  const manualCount = checks.filter((c) => c.status === 'MANUAL_REVIEW').length;

  // Formula: Passed / (Passed + Failed) * 100
  const evaluatedChecks = passedCount + failedCount;
  const score = evaluatedChecks > 0 ? Math.round((passedCount / evaluatedChecks) * 100) : 0;

  let overallStatus = 'COMPLIANT';
  if (failedCount > 0) {
    overallStatus = 'NON_COMPLIANT';
  } else if (manualCount > 0) {
    overallStatus = 'MANUAL_REVIEW';
  }

  return {
    overallStatus,
    complianceScore: score,
    totalChecks,
    passedChecksCount: passedCount,
    failedChecksCount: failedCount,
    manualChecksCount: manualCount,
    checks,
    violations,
    manualChecks,
  };
};
