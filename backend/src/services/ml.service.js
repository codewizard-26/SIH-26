import natural from 'natural';

/**
 * Enhanced Packaging Machine Learning Extraction & Classification Service
 * Utilizes Naive Bayes NLP model with n-gram feature representations and
 * spatial/panel priors specifically trained on Legal Metrology commodity packaging text.
 */
class MLExtractionService {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.classifier = new natural.BayesClassifier();
    this.isTrained = false;
  }

  /**
   * Train the local Naive Bayes classifier on rich Legal Metrology package corpus.
   * Dataset covers 10 packaging classes across Food, Cosmetics, Electronics, FMCG, and Commodities.
   */
  trainModel() {
    if (this.isTrained) return;

    console.log('[ML Service] Training enhanced multi-class packaging text classifier...');

    // ----------------------------------------------------
    // CLASS 1: PRODUCT_NAME (Generic names, specific products, brand descriptions)
    // ----------------------------------------------------
    const productExamples = [
      'Premium Roasted California Almonds',
      'Whole Wheat Atta Flour',
      'Refined Sunflower Edible Oil',
      'Hair Cleanser Ayurvedic Shampoo',
      'Moisturizing Aloe Vera Face Wash',
      'Tomato Ketchup Sauce',
      'Pure Coconut Oil',
      'Alkaline Mineral Drinking Water',
      'Green Tea Leaves Bags',
      'Potato Chips Classic Salted',
      'Basmati Long Grain Rice',
      'Instant Masala Noodles',
      'Chocolate Coated Wafer Biscuit',
      'Full Cream Pasteurised Milk',
      'Sparkling Lemon Flavoured Drink',
      'Herbal Anti-Dandruff Hair Oil',
      'Glow & Radiance Skin Cream',
      'Deep Cleansing Bathing Soap',
      'Mint Fresh Gel Toothpaste',
      'Natural Rose Body Lotion',
      'Hand Sanitizer Alcohol Rub',
      'Detergent Washing Powder',
      'Liquid Dishwash Concentrated Gel',
      'Disinfectant Floor Surface Cleaner',
      'Mosquito Repellent Liquid Vaporizer',
      'Air Freshener Lavender Spray',
      'Rechargeable LED Emergency Light',
      'USB Type-C Fast Charging Cable',
      'Lithium-ion Portable Power Bank',
      'Alkaline AA Battery Cell',
      'Smart Bluetooth Fitness Band',
      'Pure Cotton Formal Shirt',
      'Microfiber Double Bed Sheet',
      'Comfort Cushion Ankle Socks',
      'Multi-Surface Kitchen Cleaner',
      'Iodised Vacuum Evaporated Salt',
      'Organic Wild Honey',
      'Pure Cow Ghee',
      'Turmeric Powder Haldi',
      'Cumin Seeds Whole Jeera',
      'Red Chilli Powder Lal Mirch',
      'Roasted Salted Cashews',
      'Corn Flakes Breakfast Cereal',
      'Apple Cider Vinegar',
      'Peanut Butter Creamy',
      'Instant Coffee Powder',
      'Digestive High Fibre Biscuits',
      'Moisturising Sunscreen SPF 50',
      'Baby Soft Diapers Pants',
      'Ferrero Rocher Fine Hazelnut Chocolates',
      'Cadbury Dairy Milk Silk Chocolate',
      'Dettol Antiseptic Disinfectant Liquid',
      'Parachute 100% Pure Coconut Oil',
      'Fortune Sunlite Refined Sunflower Oil',
      'Aashirvaad Superior MP Atta',
      'Maggi 2-Minute Masala Noodles',
      'Haldiram Nagpur Aloo Bhujia',
      'Britannia Good Day Butter Cookies',
      'Amul Butter Pasteurised',
      'Tata Salt Desh Ka Namak',
      'Colgate Strong Teeth Toothpaste',
      'Head & Shoulders Smooth & Silky Shampoo',
      'Lifebuoy Total Germ Protection Soap',
      'Patanjali Dant Kanti Dental Cream',
      'Kissan Fresh Tomato Ketchup',
    ];
    productExamples.forEach((t) => this.classifier.addDocument(t, 'PRODUCT_NAME'));

    // ----------------------------------------------------
    // CLASS 2: MANUFACTURER (Name, address, factory, packer, importer)
    // ----------------------------------------------------
    const mfgExamples = [
      'Manufactured by ABC Foods Private Limited',
      'Mfg. By: XYZ Industries Industrial Area Gurgaon',
      'Packed by Global Consumer Brands Plot No 45 Phase II Okhla New Delhi 110020',
      'Imported and Marketed by Sunrise Trading Corp Mumbai 400001 Maharashtra India',
      'Marketed by National Consumer Products Sector 18 Noida UP',
      'Manufactured and Packed in India by Nestle India Limited Moga Punjab',
      'Factory: Survey No 123 Village Kheda Taluka Sanand Gujarat 382110',
      'Mfd By Hindustan Unilever Limited Barotiwala Tehsil Kasauli Distt Solan HP 174103',
      'Registered Office: Express Towers 21st Floor Nariman Point Mumbai 400021',
      'Country of Manufacture: India. Packed at Unit 4 Peenya Industrial Estate Bangalore 560058',
      'Manufactured by ITC Limited 37 JL Nehru Road Kolkata 700071 West Bengal',
      'Mfg by Britannia Industries Ltd 5/1A Hungerford Street Kolkata 700017',
      'Packed at: Khasra No 456 Village Raipur Roorkee Haridwar Uttarakhand 247667',
      'Manufactured and packed by Marico Limited Grande Palladium Santacruz East Mumbai 400055',
      'In case of import: Imported by Apple India Private Limited UB City Bangalore 560001',
      'Mfg & Pkd by: Dabur India Limited 8/3 Asaf Ali Road New Delhi 110002',
      'Manufacturer Details: Godrej Consumer Products Limited Eastern Express Highway Vikhroli Mumbai',
      'Address of Manufacturer / Packer: Plot 12 Sector 5 IMT Manesar Gurugram Haryana 122050',
    ];
    mfgExamples.forEach((t) => this.classifier.addDocument(t, 'MANUFACTURER'));

    // ----------------------------------------------------
    // CLASS 3: MRP (Maximum Retail Price & Tax Inclusivity)
    // ----------------------------------------------------
    const mrpExamples = [
      'MRP Rs 250.00 inclusive of all taxes',
      'Maximum Retail Price Rs 199.00 incl. of all taxes',
      'MRP: ₹ 450 (incl. of all taxes)',
      'M.R.P. Rs. 99/- (Inclusive of all taxes)',
      'MRP Rs 1200.00 (inclusive of all taxes)',
      'Max Retail Price: ₹ 35.00 incl of all taxes',
      'MRP ₹ 499.00 INCL. OF ALL TAXES',
      'MRP (incl. all taxes) Rs 85.00',
      'M.R.P. 150.00 INCLUSIVE OF ALL TAXES',
      'MRP Rs 10.00 (incl of taxes)',
      'Maximum Retail Price: ₹ 75.00 (incl. of all taxes)',
      'Retail Price (inclusive of all statutory levies) ₹ 180.00',
      'M.R.P. Rs 65.00 INCL OF ALL TAXES',
      'MRP Rs 20/- incl. all taxes',
    ];
    mrpExamples.forEach((t) => this.classifier.addDocument(t, 'MRP'));

    // ----------------------------------------------------
    // CLASS 4: UNIT_SALE_PRICE (Rule 6(1)(f) - Mandatory USP)
    // ----------------------------------------------------
    const uspExamples = [
      'Unit Sale Price: Rs 0.50 / g',
      'USP: ₹ 1.25 per ml',
      'Unit Sale Price Rs 25.00 / N',
      'USP ₹ 0.40 / gram',
      'Unit Sale Price: ₹ 12.50 per piece',
      'USP: Rs 0.80 / ml (incl. of all taxes)',
      'Unit Sale Price: Rs 150.00 per kg',
      'USP ₹ 2.00 / metre',
      'Unit Sale Price: ₹ 0.20 per gram (incl of all taxes)',
      'USP Rs 45.00 / 100g',
      'Unit Sale Price: Rs 0.95 / g',
      'USP: ₹ 1.10 per ml',
      'Unit Sale Price: Rs 5.00 / piece',
      'USP: Rs 0.35 / g',
    ];
    uspExamples.forEach((t) => this.classifier.addDocument(t, 'UNIT_SALE_PRICE'));

    // ----------------------------------------------------
    // CLASS 5: NET_QUANTITY (Rule 6(1)(c) - Net content & units)
    // ----------------------------------------------------
    const qtyExamples = [
      'Net Quantity: 500 g',
      'Net Weight: 1 kg',
      'Net Volume: 250 ml',
      'Net Contents: 1 L',
      'Net Qty: 200 gm',
      'Net Quantity: 5 N (Pieces)',
      'Net Wt: 750 grams',
      'Net Content: 5 Litres',
      'Net Qty: 10 Units',
      'Net Quantity: 100 g',
      'Net Weight when packed 200g',
      'Net Qty: approx 250 ml',
      'Net Contents: 1.5 kg',
      'Net Volume: 750 ml',
      'Net Quantity: 1 Piece (1 N)',
      'Net Wt: 250 g (When Packed)',
      'Quantity: 50 gms',
      'Net: 2 kg',
      'Net Qty 100ml',
      'Net Weight: 500g',
      'Net Quantity: 4 N x 50 g = 200 g',
      'Drained Weight: 150 g',
    ];
    qtyExamples.forEach((t) => this.classifier.addDocument(t, 'NET_QUANTITY'));

    // ----------------------------------------------------
    // CLASS 6: MFG_DATE (Rule 6(1)(d) - Date of packaging/mfg)
    // ----------------------------------------------------
    const dateExamples = [
      'Date of Manufacture: 08/2026',
      'Mfg Date: AUG 2026',
      'Pkd Date: 12/2025',
      'Month & Year of Packing: 09/2026',
      'Date of Pre-Packing: JULY 2026',
      'Mfd: 01/26',
      'Date of Mfg & Batch: 05/2026',
      'Packed on: 15/08/2026',
      'Mfg: 11/2025',
      'Pkd: SEP 2026',
      'Date of Importation: 04/2026',
      'Mfd & Pkd on: 10/2026',
      'Date of Manufacture: SEP 2026',
      'Date of Packing: 06/2026',
    ];
    dateExamples.forEach((t) => this.classifier.addDocument(t, 'MFG_DATE'));

    // ----------------------------------------------------
    // CLASS 7: BATCH_LOT (Rule 6(1)(g) - Batch / Lot Identification)
    // ----------------------------------------------------
    const batchExamples = [
      'Batch No: B24089',
      'Lot Number: LT-9981-A',
      'Batch: 24K09',
      'B.No.: 88472',
      'Lot No: 2026-X8',
      'Batch / Lot No: BL-5502',
      'Batch Code: A4190',
      'B. No: K24B',
      'Lot: 772910',
      'Control Code / Batch: 2608M',
    ];
    batchExamples.forEach((t) => this.classifier.addDocument(t, 'BATCH_LOT'));

    // ----------------------------------------------------
    // CLASS 8: CONSUMER_CARE (Rule 6(2) - Grievance redressal)
    // ----------------------------------------------------
    const careExamples = [
      'For complaints or queries contact Consumer Care Cell',
      'Customer Support Executive Toll Free: 1800 123 4567',
      'Email: customercare@brand.com Helpline: 1800-222-333',
      'In case of consumer grievance write to Manager Consumer Services',
      'Contact Consumer Care Officer at manufacturer postal address',
      'Toll Free Helpline: 1800 209 0000 Email: feedback@marico.com',
      'Customer Care Manager PO Box 1234 Mumbai Phone 022-26543210',
      'Consumer Care Tel: 1800 102 2221 Email: care@itc.in',
      'For feedback write to Consumer Response Cell Phone: 1800 119 900',
      'Consumer Care Helpline No. 1800-425-1947 Email: wecare@nestle.in',
      'Any complaints? Call Toll Free 1800-180-1515 or email customercare@dabur.com',
      'Contact Customer Grievance Redressal Officer at feedback@hindustanunilever.com',
    ];
    careExamples.forEach((t) => this.classifier.addDocument(t, 'CONSUMER_CARE'));

    // ----------------------------------------------------
    // CLASS 9: COUNTRY_OF_ORIGIN (Rule 6(10) - Mandatory Origin)
    // ----------------------------------------------------
    const originExamples = [
      'Country of Origin: India',
      'Made in India',
      'Product of India',
      'Country of Origin: USA',
      'Country of Origin: Germany',
      'Country of Origin: Italy',
      'Manufactured and packed in India',
      'Country of Manufacture: India',
      'Country of Origin: China',
      'Origin: Republic of India',
      'Proudly Made in India',
    ];
    originExamples.forEach((t) => this.classifier.addDocument(t, 'COUNTRY_OF_ORIGIN'));

    // ----------------------------------------------------
    // CLASS 10: NOISE (Marketing, Nutrition, Ingredients, Storage)
    // ----------------------------------------------------
    const noiseExamples = [
      '100% Natural and Organic Goodness',
      'Rich in Calcium Protein and Essential Dietary Fibre',
      'Now with 20% Extra Free Limited Offer',
      'Store in a cool hygienic and dry place away from direct sunlight',
      'Best Before 12 Months from the Date of Packaging',
      'Best before six months from manufacture',
      'Nutrition Facts per 100g: Energy 520 kcal Protein 8.5g Carbohydrates 65g',
      'Ingredients: Refined Wheat Flour Sugar Edible Vegetable Oil Salt Emulsifier',
      'Contains added artificial flavours and natural identical flavouring substances',
      'Scan QR code for delicious recipes and exciting offers',
      'Allergen Advice: Contains Wheat Gluten and Milk Solids May contain nuts',
      'Dispose of properly Keep your city clean Green Dot Vegetarian Logo',
      'Serving suggestion: Serve chilled Do not buy if pack is puffed or leaking',
      'FSSAI Lic. No. 10014011002233',
      'An ISO 22000 Certified Quality Company',
      'Trademark registered by brand owner',
    ];
    noiseExamples.forEach((t) => this.classifier.addDocument(t, 'NOISE'));

    this.classifier.train();
    this.isTrained = true;
    console.log('[ML Service] Training complete with 10 statutory packaging classes.');
  }

  /**
   * Pre-processes OCR line for higher classification accuracy.
   */
  normalizeText(text) {
    return text
      .replace(/[₹]/g, ' Rs. ')
      .replace(/\b[Ff]s\.\b/g, 'Rs.')
      .replace(/\b[Mm]\.[Rr]\.[Ff]\b/g, 'MRP')
      .replace(/\b[Qq]m\b/g, 'g')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Classify OCR lines using the trained ML model with spatial prior weighting.
   * @param {Array} lines - Array of OCR line objects {text, confidence, bbox, viewType}
   * @returns {Object} Classified entities grouped by class name
   */
  classifyLines(lines = []) {
    if (!this.isTrained) {
      this.trainModel();
    }

    const results = {
      PRODUCT_NAME: [],
      MANUFACTURER: [],
      MRP: [],
      UNIT_SALE_PRICE: [],
      NET_QUANTITY: [],
      MFG_DATE: [],
      BATCH_LOT: [],
      CONSUMER_CARE: [],
      COUNTRY_OF_ORIGIN: [],
      NOISE: [],
    };

    lines.forEach((line) => {
      const cleanText = this.normalizeText(line.text || '');
      if (cleanText.length < 2) return;
      if (/^[\d.\-\/\s]+$/.test(cleanText)) return; // Skip pure numeric strings

      const classifications = this.classifier.getClassifications(cleanText);
      if (!classifications || classifications.length === 0) return;

      const top = classifications[0];
      let adjustedConfidence = top.value;

      // Spatial Prior: Front panel lines receive higher prior for PRODUCT_NAME
      if (line.viewType === 'front') {
        if (top.label === 'PRODUCT_NAME') {
          adjustedConfidence = Math.min(1.0, adjustedConfidence * 1.35);
        }
      }

      // Spatial Prior: MRP close-up slot receives higher prior for MRP & UNIT_SALE_PRICE
      if (line.viewType === 'mrp') {
        if (top.label === 'MRP' || top.label === 'UNIT_SALE_PRICE' || top.label === 'BATCH_LOT') {
          adjustedConfidence = Math.min(1.0, adjustedConfidence * 1.3);
        }
      }

      // Spatial Prior: Side panel receives higher prior for CONSUMER_CARE
      if (line.viewType === 'side') {
        if (top.label === 'CONSUMER_CARE') {
          adjustedConfidence = Math.min(1.0, adjustedConfidence * 1.3);
        }
      }

      if (results[top.label]) {
        results[top.label].push({
          ...line,
          text: cleanText,
          mlClass: top.label,
          mlConfidence: Math.round(adjustedConfidence * 100) / 100,
        });
      }
    });

    // Sort all classes descending by confidence
    for (const key in results) {
      results[key].sort((a, b) => b.mlConfidence - a.mlConfidence);
    }

    return results;
  }
}

export const mlService = new MLExtractionService();
