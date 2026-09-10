import natural from 'natural';

class MLExtractionService {
  constructor() {
    this.classifier = new natural.BayesClassifier();
    this.isTrained = false;
  }

  /**
   * Train the local Naive Bayes classifier on package textual features.
   * We use a predefined dataset simulating OCR text blocks found on packaged commodities.
   */
  trainModel() {
    if (this.isTrained) return;

    console.log('[ML Service] Training local Naive Bayes text classifier...');

    // Class: PRODUCT_NAME (Generic names, specific products)
    this.classifier.addDocument('Premium Roasted Almonds', 'PRODUCT_NAME');
    this.classifier.addDocument('Whole Wheat Bread', 'PRODUCT_NAME');
    this.classifier.addDocument('Tomato Ketchup', 'PRODUCT_NAME');
    this.classifier.addDocument('Hair Cleanser Shampoo', 'PRODUCT_NAME');
    this.classifier.addDocument('Moisturizing Face Wash', 'PRODUCT_NAME');
    this.classifier.addDocument('Pure Coconut Oil', 'PRODUCT_NAME');
    this.classifier.addDocument('Alkaline Water', 'PRODUCT_NAME');
    this.classifier.addDocument('Green Tea bags', 'PRODUCT_NAME');
    this.classifier.addDocument('Refined Sunflower Oil', 'PRODUCT_NAME');
    this.classifier.addDocument('Potato Chips Classic Salted', 'PRODUCT_NAME');

    // Class: MANUFACTURER
    this.classifier.addDocument('Manufactured by ABC Corp Ltd', 'MANUFACTURER');
    this.classifier.addDocument('Mfg. By: XYZ Industries', 'MANUFACTURER');
    this.classifier.addDocument('Packed by Global Foods', 'MANUFACTURER');
    this.classifier.addDocument('Imported by: Sunrise Trading Co.', 'MANUFACTURER');
    this.classifier.addDocument('Marketed by National Brands', 'MANUFACTURER');
    this.classifier.addDocument('Plot No 45, Industrial Area, New Delhi 110020', 'MANUFACTURER');
    this.classifier.addDocument('Mfg by', 'MANUFACTURER');

    // Class: MRP
    this.classifier.addDocument('MRP Rs 250.00 incl. of all taxes', 'MRP');
    this.classifier.addDocument('Maximum Retail Price 199', 'MRP');
    this.classifier.addDocument('MRP: 50/-', 'MRP');
    this.classifier.addDocument('Rs. 100 (incl of all taxes)', 'MRP');
    this.classifier.addDocument('inclusive of all taxes', 'MRP');

    // Class: NET_QUANTITY
    this.classifier.addDocument('Net Qty 500g', 'NET_QUANTITY');
    this.classifier.addDocument('Net Weight: 1 kg', 'NET_QUANTITY');
    this.classifier.addDocument('Volume 250 ml', 'NET_QUANTITY');
    this.classifier.addDocument('Net Contents 1 L', 'NET_QUANTITY');
    this.classifier.addDocument('Weight 200 gm', 'NET_QUANTITY');

    // Class: MFG_DATE
    this.classifier.addDocument('Mfg Date: 08/2026', 'MFG_DATE');
    this.classifier.addDocument('Pkd. Aug 2026', 'MFG_DATE');
    this.classifier.addDocument('Date of Manufacture 12/25', 'MFG_DATE');
    this.classifier.addDocument('Date of Packing', 'MFG_DATE');
    this.classifier.addDocument('Use by 10/2027', 'MFG_DATE');

    // Class: CONSUMER_CARE
    this.classifier.addDocument('For feedback contact consumer care', 'CONSUMER_CARE');
    this.classifier.addDocument('Customer Care Executive', 'CONSUMER_CARE');
    this.classifier.addDocument('Toll Free 1800 123 4567', 'CONSUMER_CARE');
    this.classifier.addDocument('Email: support@brand.com', 'CONSUMER_CARE');
    this.classifier.addDocument('In case of complaints, write to', 'CONSUMER_CARE');

    // Class: NOISE (Irrelevant stuff, marketing, etc.)
    this.classifier.addDocument('100% Natural and organic', 'NOISE');
    this.classifier.addDocument('Rich in vitamins and minerals', 'NOISE');
    this.classifier.addDocument('Now with 20% extra free', 'NOISE');
    this.classifier.addDocument('Keep in a cool dry place', 'NOISE');
    this.classifier.addDocument('Best before 12 months', 'NOISE');
    this.classifier.addDocument('Nutrition facts', 'NOISE');
    this.classifier.addDocument('Ingredients: sugar, water, salt', 'NOISE');

    this.classifier.train();
    this.isTrained = true;
    console.log('[ML Service] Training complete.');
  }

  /**
   * Classify OCR lines using the trained ML model.
   * @param {Array} lines - Array of OCR line objects {text, confidence, bbox}
   * @returns {Object} Classified entities
   */
  classifyLines(lines) {
    if (!this.isTrained) {
      this.trainModel();
    }

    const results = {
      PRODUCT_NAME: [],
      MANUFACTURER: [],
      MRP: [],
      NET_QUANTITY: [],
      MFG_DATE: [],
      CONSUMER_CARE: [],
      NOISE: [],
    };

    lines.forEach(line => {
      const cleanText = line.text.trim();
      if (cleanText.length < 3) return;
      if (/^[\d.\-\/]+$/.test(cleanText)) return; // Exclude numbers only

      const classifications = this.classifier.getClassifications(cleanText);
      const topClassification = classifications[0];
      
      // If the model classifies it, push it
      results[topClassification.label].push({
        ...line,
        mlConfidence: topClassification.value
      });
    });

    // Sort all categories by mlConfidence descending
    for (const key in results) {
      results[key].sort((a, b) => b.mlConfidence - a.mlConfidence);
    }

    return results;
  }
}

export const mlService = new MLExtractionService();
