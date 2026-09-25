import { describe, expect, it } from 'vitest';
import { analyticalEngineTestCases } from './analytics_test_suite';

describe('Analytical Engine (Motor Analítico do Recife de Casa)', () => {
  // Executa toda a suíte canônica definida na fonte única da verdade (analytics_test_suite.ts)
  for (const testCase of analyticalEngineTestCases) {
    describe(testCase.category, () => {
      it(testCase.title, () => {
        const result = testCase.run();
        if (!result.passed) {
          throw new Error(result.message);
        }
        expect(result.passed).toBe(true);
      });
    });
  }
});
