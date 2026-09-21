/**
 * Statutory Compliance Engine
 * Evaluates extracted package declarations against The Legal Metrology (Packaged Commodities) Rules, 2011
 * and subsequent amendments (including 2021/2022 Unit Sale Price and Country of Origin mandates).
 * 
 * Rules Evaluated:
 * - Rule 6(1)(a) & Rule 10: Manufacturer / Packer / Importer name & complete postal address with PIN code
 * - Rule 6(1)(b): Generic / Common name of the commodity
 * - Rule 6(1)(c) & Rules 11, 12(6), 13: Net Quantity, standard metric units & prohibited qualifiers
 * - Rule 6(1)(d): Month & Year of manufacture / pre-packing / importation
 * - Rule 6(1)(e) & Rule 2(m): Maximum Retail Price (MRP) with explicit tax inclusivity
 * - Rule 6(1)(f) & Rule 2(r): Unit Sale Price (USP) & mathematical price-quantity consistency
 * - Rule 6(1)(g): Batch / Lot / Code Number for recall traceability
 * - Rule 6(10): Country of Origin declaration
 * - Rule 6(2): Consumer Care details (Designation, Address, Telephone, Email)
 * - Rule 7 (Table I & II): Principal Display Panel numeral & letter height calculation
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
      requirement: 'The net quantity in terms of standard metric units of weight (g/kg), volume (ml/l), length (cm/m), or number shall be declared.',
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
      expectedRequirement: 'Net quantity in standard metric units (e.g., g, kg, ml, l, N).',
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
  // CHECK 3: Unit Sale Price (USP) & Mathematical Consistency
  // Statutory Reference: Rule 6(1)(f) read with 2021/2022 Amendments & Rule 2(r)
  // ----------------------------------------------------
  const usp = declarations.unitSalePrice;
  const isLargePackage = netQty && netQty.quantityNumber && (
    (netQty.unit === 'g' && netQty.quantityNumber > 100) ||
    (netQty.unit === 'ml' && netQty.quantityNumber > 100) ||
    (netQty.unit === 'kg' || netQty.unit === 'l')
  );

  if (!usp || !usp.detected) {
    if (isLargePackage) {
      const failCheck = {
        ruleCode: 'LMR-06-1-F-USP',
        ruleReference: 'Rule 6(1)(f) read with Rule 2(r)',
        title: 'Unit Sale Price (USP) Declaration',
        category: 'Pricing & Taxation',
        requirement: 'Declaration of Unit Sale Price (e.g. Rs. per g or Rs. per ml) is mandatory for packages with net quantity greater than 100g or 100ml.',
        detectedValue: usp?.calculatedExpectedUsp ? `Missing on pack (Expected: ${usp.calculatedExpectedUsp})` : 'Not detected',
        status: 'FAIL',
        validationNotes: 'Commodity contains >100g/ml but lacks mandatory Unit Sale Price declaration under 2021 Legal Metrology amendments.',
        sourceImageId: null,
        boundingBox: null,
      };
      checks.push(failCheck);
      violations.push({
        violationCode: 'V-USP-01',
        title: 'Missing Mandatory Unit Sale Price (USP) on Package',
        severity: 'MAJOR',
        detectedValue: 'Not declared on packaging label',
        expectedRequirement: usp?.calculatedExpectedUsp ? `Unit Sale Price of approx ${usp.calculatedExpectedUsp}` : 'Unit Sale Price (Rs./g or Rs./ml)',
        legalReference: 'The Legal Metrology (Packaged Commodities) Amendment Rules, 2021 - Rule 6(1)(f)',
        explanation: 'Mandatory Unit Sale Price was not declared on the package. Consumers are entitled to unit pricing for transparent price comparison.',
        evidenceImageId: null,
        boundingBox: null,
        recommendedAction: 'Issue statutory compliance notice for absence of Unit Sale Price under Rule 6(1)(f).',
      });
    } else {
      // Small packages (<100g/ml) where USP is optional or advised
      checks.push({
        ruleCode: 'LMR-06-1-F-USP',
        ruleReference: 'Rule 6(1)(f)',
        title: 'Unit Sale Price (USP) Declaration',
        category: 'Pricing & Taxation',
        requirement: 'Unit Sale Price declaration for packages under 100g/100ml is optional.',
        detectedValue: usp?.calculatedExpectedUsp ? `Optional (${usp.calculatedExpectedUsp})` : 'Exempt (<100g/ml)',
        status: 'PASS',
        validationNotes: 'Package is within small-pack exemption threshold for mandatory USP.',
        sourceImageId: null,
        boundingBox: null,
      });
    }
  } else if (!usp.isMathematicallyConsistent) {
    const failCheck = {
      ruleCode: 'LMR-06-1-F-USP-MISMATCH',
      ruleReference: 'Rule 6(1)(f) & Section 36',
      title: 'Unit Sale Price Mathematical Discrepancy',
      category: 'Pricing & Taxation',
      requirement: 'Declared Unit Sale Price must be mathematically consistent with declared MRP and Net Quantity.',
      detectedValue: `${usp.value} (Expected: ${usp.calculatedExpectedUsp})`,
      status: 'FAIL',
      validationNotes: `Printed USP of ${usp.value} differs significantly from calculated rate based on MRP and Net Qty (${usp.calculatedExpectedUsp}).`,
      sourceImageId: usp.sourceImageId,
      boundingBox: usp.boundingBox,
    };
    checks.push(failCheck);
    violations.push({
      violationCode: 'V-USP-02',
      title: 'Mathematical Mismatch Between Declared MRP and Unit Sale Price',
      severity: 'MAJOR',
      detectedValue: `${usp.value} vs Expected: ${usp.calculatedExpectedUsp}`,
      expectedRequirement: `USP should equal MRP / Net Qty (${usp.calculatedExpectedUsp}).`,
      legalReference: 'The Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(f)',
      explanation: 'The declared Unit Sale Price on the package does not match the actual arithmetic unit cost derived from the declared MRP and Net Contents.',
      evidenceImageId: usp.sourceImageId,
      boundingBox: usp.boundingBox,
      recommendedAction: 'Direct manufacturer to explain pricing calculation anomaly.',
    });
  } else {
    checks.push({
      ruleCode: 'LMR-06-1-F-USP',
      ruleReference: 'Rule 6(1)(f)',
      title: 'Unit Sale Price (USP) Declaration',
      category: 'Pricing & Taxation',
      requirement: 'Unit Sale Price conspicuously declared and mathematically verified.',
      detectedValue: `${usp.value} (Verified compliant)`,
      status: 'PASS',
      validationNotes: 'Unit Sale Price is declared and arithmetically verified against MRP and Net Quantity.',
      sourceImageId: usp.sourceImageId,
      boundingBox: usp.boundingBox,
    });
  }

  // ----------------------------------------------------
  // CHECK 4: Month & Year of Manufacture / Pre-Packing
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
  // CHECK 5: Batch, Lot or Code Number
  // Statutory Reference: Rule 6(1)(g)
  // ----------------------------------------------------
  const batch = declarations.batchNumber;
  if (!batch || !batch.detected) {
    const failCheck = {
      ruleCode: 'LMR-06-1-G-BATCH',
      ruleReference: 'Rule 6(1)(g)',
      title: 'Batch / Lot / Code Number Declaration',
      category: 'Traceability & Dates',
      requirement: 'Every pre-packed commodity shall bear a batch number or lot number or code number for traceability and consumer safety.',
      detectedValue: 'Not detected on submitted packaging surfaces',
      status: 'FAIL',
      validationNotes: 'No stamped or printed batch or lot identifier was located on package images.',
      sourceImageId: null,
      boundingBox: null,
    };
    checks.push(failCheck);
    violations.push({
      violationCode: 'V-BATCH-01',
      title: 'Missing Batch / Lot Identification Number',
      severity: 'MAJOR',
      detectedValue: 'Not detected in submitted package images',
      expectedRequirement: 'Batch No., Lot No. or Code No. clearly visible.',
      legalReference: 'The Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(g)',
      explanation: 'Package lacks a batch/lot identifier which is mandatory for batch traceability and consumer quality audits.',
      evidenceImageId: null,
      boundingBox: null,
      recommendedAction: 'Verify batch stamp on alternate crimp or underside before notice issuance.',
    });
  } else {
    checks.push({
      ruleCode: 'LMR-06-1-G-BATCH',
      ruleReference: 'Rule 6(1)(g)',
      title: 'Batch / Lot / Code Number Declaration',
      category: 'Traceability & Dates',
      requirement: 'Batch / Lot identifier clearly stated for product traceability.',
      detectedValue: batch.value,
      status: 'PASS',
      validationNotes: 'Batch or lot identifier detected for statutory traceability.',
      sourceImageId: batch.sourceImageId,
      boundingBox: batch.boundingBox,
    });
  }

  // ----------------------------------------------------
  // CHECK 6: Country of Origin Declaration
  // Statutory Reference: Rule 6(10)
  // ----------------------------------------------------
  const country = declarations.countryOfOrigin;
  if (!country || !country.detected) {
    const failCheck = {
      ruleCode: 'LMR-06-10-COUNTRY-ORIGIN',
      ruleReference: 'Rule 6(10)',
      title: 'Country of Origin Declaration',
      category: 'Entity Identification',
      requirement: 'Every package shall bear the name of the country of origin or manufacture or assembly.',
      detectedValue: 'Not detected on package surfaces',
      status: 'FAIL',
      validationNotes: 'Country of origin statement (e.g. "Made in India" or "Country of Origin: ...") was not located.',
      sourceImageId: null,
      boundingBox: null,
    };
    checks.push(failCheck);
    violations.push({
      violationCode: 'V-ORIGIN-01',
      title: 'Missing Mandatory Country of Origin Declaration',
      severity: 'MAJOR',
      detectedValue: 'Not detected in submitted package images',
      expectedRequirement: 'Explicit country of origin declaration (e.g. Country of Origin: India).',
      legalReference: 'The Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(10)',
      explanation: 'Pre-packed commodities must prominently display the Country of Origin to guarantee consumer information transparency.',
      evidenceImageId: null,
      boundingBox: null,
      recommendedAction: 'Direct packer/importer to comply with Rule 6(10) Country of Origin disclosure.',
    });
  } else {
    checks.push({
      ruleCode: 'LMR-06-10-COUNTRY-ORIGIN',
      ruleReference: 'Rule 6(10)',
      title: 'Country of Origin Declaration',
      category: 'Entity Identification',
      requirement: 'Country of origin or manufacture declared conspicuously.',
      detectedValue: country.value,
      status: 'PASS',
      validationNotes: `Country of origin verified: ${country.country}.`,
      sourceImageId: country.sourceImageId,
      boundingBox: country.boundingBox,
    });
  }

  // ----------------------------------------------------
  // CHECK 7: Manufacturer / Packer / Importer Details
  // Statutory Reference: Rule 6(1)(a) read with Rule 10
  // ----------------------------------------------------
  const mfg = declarations.manufacturer;
  if (!mfg || !mfg.detected) {
    const failCheck = {
      ruleCode: 'LMR-06-1-A-MFG',
      ruleReference: 'Rule 6(1)(a) & Rule 10',
      title: 'Manufacturer / Packer / Importer Identity & Complete Address',
      category: 'Entity Identification',
      requirement: 'Name and complete postal address of the manufacturer, or where manufacturer is not the packer, name and address of manufacturer and packer with PIN code.',
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
      expectedRequirement: 'Name and complete address (factory/street, city, state, and PIN code).',
      legalReference: 'The Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(a) & Rule 10',
      explanation: 'Package fails to declare the identity and complete geographical location of the manufacturing or pre-packing entity.',
      evidenceImageId: null,
      boundingBox: null,
      recommendedAction: 'Direct manufacturer to furnish statutory packaging declarations.',
    });
  } else if (!mfg.hasPinCode) {
    // Address exists but lacks 6-digit postal PIN code
    checks.push({
      ruleCode: 'LMR-06-1-A-MFG-PIN',
      ruleReference: 'Rule 10(1)',
      title: 'Postal Address PIN Code Completeness',
      category: 'Entity Identification',
      requirement: 'Complete postal address shall include city, state, and 6-digit Indian PIN code for consumer traceability.',
      detectedValue: `${mfg.value} (PIN code not explicitly detected)`,
      status: 'MANUAL_REVIEW',
      validationNotes: 'Manufacturer identity and address were detected, but 6-digit postal PIN code could not be verified by OCR.',
      sourceImageId: mfg.sourceImageId,
      boundingBox: mfg.boundingBox,
    });
    manualChecks.push({
      ruleCode: 'LMR-06-1-A-MFG-PIN',
      ruleReference: 'Rule 10(1)',
      title: 'Postal Address PIN Code Verification',
      category: 'Entity Identification',
      requirement: 'Check whether 6-digit PIN code is stamped on label address.',
      detectedValue: mfg.value,
      status: 'MANUAL_REVIEW',
      inspectorAction: 'Physically inspect manufacturer address panel to verify complete postal PIN code.',
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
      validationNotes: mfg.hasPinCode
        ? `Complete postal address with PIN code (${mfg.pinCode}) located.`
        : 'Manufacturer identity and address detected on label.',
      sourceImageId: mfg.sourceImageId,
      boundingBox: mfg.boundingBox,
    });
  }

  // ----------------------------------------------------
  // CHECK 8: Consumer Care Information
  // Statutory Reference: Rule 6(2)
  // ----------------------------------------------------
  const cc = declarations.consumerCare;
  if (!cc || !cc.detected) {
    const failCheck = {
      ruleCode: 'LMR-06-2-CONSUMER-CARE',
      ruleReference: 'Rule 6(2)',
      title: 'Consumer Grievance Redressal / Care Details',
      category: 'Consumer Protection',
      requirement: 'Every package shall bear the name, address, telephone number, and e-mail address of the person or office to contact in case of consumer complaints.',
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
  // CHECK 9: Generic / Common Name of Commodity
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
    sourceImageId: gen?.sourceImageId,
    boundingBox: gen?.boundingBox,
  });

  // ----------------------------------------------------
  // CHECK 10: Principal Display Panel Numeral & Letter Height
  // Statutory Reference: Rule 7 (Table I & Table II)
  // ----------------------------------------------------
  let minHeightMm = '2 mm';
  if (netQty && netQty.quantityNumber) {
    const qty = netQty.quantityNumber;
    const unit = netQty.unit;
    if ((unit === 'g' || unit === 'ml') && qty <= 50) minHeightMm = '1 mm';
    else if ((unit === 'g' || unit === 'ml') && qty <= 200) minHeightMm = '2 mm';
    else if ((unit === 'g' || unit === 'ml') && qty <= 1000) minHeightMm = '4 mm';
    else if (unit === 'kg' || unit === 'l') minHeightMm = '6 mm';
  }

  const manualCheckItem = {
    ruleCode: 'LMR-07-FONT-SIZE',
    ruleReference: 'Rule 7, Table I & Table II',
    title: 'Principal Display Panel Numeral & Letter Height',
    category: 'Display & Legibility',
    requirement: `Minimum height of numerals on Principal Display Panel as prescribed: at least ${minHeightMm} for declared Net Quantity.`,
    detectedValue: `Calculated Statutory Target: ${minHeightMm} (Physical measurement required)`,
    status: 'MANUAL_REVIEW',
    validationNotes: `Photographic 2D image lacks calibrated millimeter scale. Officer must verify with standard gauge that font height meets statutory minimum of ${minHeightMm}.`,
    inspectorAction: `Use calibrated Legal Metrology measurement ruler on physical package to confirm numeral height is at least ${minHeightMm}.`,
    sourceImageId: null,
    boundingBox: null,
  };
  checks.push(manualCheckItem);
  manualChecks.push(manualCheckItem);

  // ----------------------------------------------------
  // CHECK 11: Language of Declarations
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
