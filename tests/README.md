# Testing Setup

This project uses Jest for unit testing with TypeScript support.

## Test Structure

- **Tests Directory**: `tests/`
- **Test Files**: `*.test.ts` or `*.spec.ts`
- **Test Utilities**: `tests/utils/`
- **Mock Files**: `tests/mocks/`

## Available Scripts

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

The project includes comprehensive unit tests for:

### CSV Row Validator (`tests/csv-validator.test.ts`)
- ✅ Complete valid CSV row validation
- ✅ Optional fields handling
- ✅ Whitespace trimming
- ✅ Required field validation
- ✅ Enum value validation
- ✅ Invalid budget value handling
- ✅ Budget range validation
- ✅ Tag parsing

### Budget Validator (`tests/csv-validator.test.ts`)
- ✅ Budget with both min and max
- ✅ Budget with only max
- ✅ Budget with only min
- ✅ No budget values
- ✅ Invalid range validation (min > max)
- ✅ Negative value validation
- ✅ Decimal value handling
- ✅ Large value handling

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/csv-validator.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="CSV Row Validator"

# Run tests with verbose output
npm test -- --verbose
```

## Test Configuration

- **Jest Config**: `jest.config.js`
- **TypeScript Support**: `ts-jest` preset
- **Test Environment**: Node.js
- **Setup File**: `tests/setup.ts`

## Adding New Tests

1. Create test files in the `tests/` directory
2. Use `.test.ts` or `.spec.ts` extension
3. Import functions from `src/` or `tests/utils/`
4. Follow the existing test structure and naming conventions

## Example Test Structure

```typescript
import { functionToTest } from '../src/path/to/function';

describe('Function Name', () => {
  describe('specific behavior', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test input';
      
      // Act
      const result = functionToTest(input);
      
      // Assert
      expect(result).toBe('expected output');
    });
  });
});
```
