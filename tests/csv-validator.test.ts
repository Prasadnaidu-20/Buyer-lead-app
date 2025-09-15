import { transformCSVRow, validateBudget, CSVRow } from './utils/csv-validator';

describe('CSV Row Validator', () => {
  describe('transformCSVRow', () => {
    const validCSVRow: CSVRow = {
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      city: 'Chandigarh',
      propertyType: 'Apartment',
      bhk: 'TWO',
      purpose: 'Buy',
      budgetMin: '5000000',
      budgetMax: '6000000',
      timeline: 'ZERO_TO_3M',
      source: 'Website',
      notes: 'Test buyer',
      tags: 'urgent, lakeside',
      status: 'New'
    };

    it('should successfully validate a complete valid CSV row', () => {
      const result = transformCSVRow(validCSVRow);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.fullName).toBe('John Doe');
      expect(result.data.email).toBe('john@example.com');
      expect(result.data.phone).toBe('1234567890');
      expect(result.data.city).toBe('Chandigarh');
      expect(result.data.propertyType).toBe('Apartment');
      expect(result.data.bhk).toBe('TWO');
      expect(result.data.purpose).toBe('Buy');
      expect(result.data.budgetMin).toBe(5000000);
      expect(result.data.budgetMax).toBe(6000000);
      expect(result.data.timeline).toBe('ZERO_TO_3M');
      expect(result.data.source).toBe('Website');
      expect(result.data.status).toBe('New');
      expect(result.data.notes).toBe('Test buyer');
      expect(result.data.tags).toEqual(['urgent', 'lakeside']);
    });

    it('should handle optional fields correctly', () => {
      const rowWithOptionalFields: CSVRow = {
        ...validCSVRow,
        email: '',
        bhk: '',
        budgetMin: '',
        budgetMax: '',
        notes: '',
        tags: '',
        status: ''
      };

      const result = transformCSVRow(rowWithOptionalFields);
      
      expect(result.success).toBe(true);
      expect(result.data.email).toBeNull();
      expect(result.data.bhk).toBeNull();
      expect(result.data.budgetMin).toBeNull();
      expect(result.data.budgetMax).toBeNull();
      expect(result.data.notes).toBeNull();
      expect(result.data.tags).toEqual([]);
      expect(result.data.status).toBe('New'); // Default value
    });

    it('should trim whitespace from all fields', () => {
      const rowWithWhitespace: CSVRow = {
        ...validCSVRow,
        fullName: '  John Doe  ',
        email: '  john@example.com  ',
        phone: '  1234567890  ',
        city: '  Chandigarh  ',
        tags: '  urgent , lakeside  '
      };

      const result = transformCSVRow(rowWithWhitespace);
      
      expect(result.success).toBe(true);
      expect(result.data.fullName).toBe('John Doe');
      expect(result.data.email).toBe('john@example.com');
      expect(result.data.phone).toBe('1234567890');
      expect(result.data.city).toBe('Chandigarh');
      expect(result.data.tags).toEqual(['urgent', 'lakeside']);
    });

    it('should fail validation for missing required fields', () => {
      const requiredFields = ['fullName', 'phone', 'city', 'propertyType', 'purpose', 'timeline', 'source'];
      
      requiredFields.forEach(field => {
        const invalidRow = { ...validCSVRow, [field]: '' };
        const result = transformCSVRow(invalidRow);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe(`${field} is required`);
      });
    });

    it('should fail validation for invalid enum values', () => {
      const invalidEnums = [
        { field: 'city', value: 'InvalidCity' },
        { field: 'propertyType', value: 'InvalidType' },
        { field: 'bhk', value: 'INVALID_BHK' },
        { field: 'purpose', value: 'InvalidPurpose' },
        { field: 'timeline', value: 'INVALID_TIMELINE' },
        { field: 'source', value: 'InvalidSource' },
        { field: 'status', value: 'InvalidStatus' }
      ];

      invalidEnums.forEach(({ field, value }) => {
        const invalidRow = { ...validCSVRow, [field]: value };
        const result = transformCSVRow(invalidRow);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain(field);
      });
    });

    it('should handle invalid budget values', () => {
      const invalidBudgetRows = [
        { ...validCSVRow, budgetMin: 'invalid', budgetMax: '6000000' },
        { ...validCSVRow, budgetMin: '5000000', budgetMax: 'invalid' },
        { ...validCSVRow, budgetMin: '-1000000', budgetMax: '6000000' },
        { ...validCSVRow, budgetMin: '5000000', budgetMax: '-1000000' }
      ];

      invalidBudgetRows.forEach(row => {
        const result = transformCSVRow(row);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should handle budget range validation', () => {
      const invalidRangeRow = {
        ...validCSVRow,
        budgetMin: '6000000',
        budgetMax: '5000000' // Min > Max
      };

      const result = transformCSVRow(invalidRangeRow);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should parse tags correctly', () => {
      const tagTestCases = [
        { input: 'tag1, tag2, tag3', expected: ['tag1', 'tag2', 'tag3'] },
        { input: 'tag1,tag2,tag3', expected: ['tag1', 'tag2', 'tag3'] },
        { input: 'single-tag', expected: ['single-tag'] },
        { input: 'tag1, , tag3', expected: ['tag1', 'tag3'] }, // Empty tag filtered out
        { input: '', expected: [] },
        { input: '   ', expected: [] }
      ];

      tagTestCases.forEach(({ input, expected }) => {
        const row = { ...validCSVRow, tags: input };
        const result = transformCSVRow(row);
        
        expect(result.success).toBe(true);
        expect(result.data.tags).toEqual(expected);
      });
    });
  });

  describe('validateBudget', () => {
    it('should validate budget with both min and max', () => {
      const result = validateBudget(5000000, 6000000);
      
      expect(result.isValid).toBe(true);
      expect(result.formattedBudget).toBe('₹50.0L - ₹60.0L');
    });

    it('should validate budget with only max', () => {
      const result = validateBudget(null, 6000000);
      
      expect(result.isValid).toBe(true);
      expect(result.formattedBudget).toBe('Up to ₹60.0L');
    });

    it('should validate budget with only min', () => {
      const result = validateBudget(5000000, null);
      
      expect(result.isValid).toBe(true);
      expect(result.formattedBudget).toBe('From ₹50.0L');
    });

    it('should validate budget with no values', () => {
      const result = validateBudget(null, null);
      
      expect(result.isValid).toBe(true);
      expect(result.formattedBudget).toBe('Not specified');
    });

    it('should fail validation when min > max', () => {
      const result = validateBudget(6000000, 5000000);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Budget minimum cannot be greater than maximum');
    });

    it('should fail validation for negative min value', () => {
      const result = validateBudget(-1000000, 6000000);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Budget minimum must be a positive integer');
    });

    it('should fail validation for negative max value', () => {
      const result = validateBudget(5000000, -1000000);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Budget maximum must be a positive integer');
    });

    it('should handle decimal budget values correctly', () => {
      const result = validateBudget(5000000, 7500000);
      
      expect(result.isValid).toBe(true);
      expect(result.formattedBudget).toBe('₹50.0L - ₹75.0L');
    });

    it('should handle large budget values correctly', () => {
      const result = validateBudget(10000000, 20000000);
      
      expect(result.isValid).toBe(true);
      expect(result.formattedBudget).toBe('₹100.0L - ₹200.0L');
    });
  });
});
