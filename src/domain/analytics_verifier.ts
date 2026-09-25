import { analyticalEngineTestCases, EngineTestCase } from './analytics_test_suite';

export interface TestResult {
  title: string;
  passed: boolean;
  message: string;
}

/**
 * Executa os testes do motor analítico em tempo de execução no browser.
 * Utiliza as mesmas especificações de teste executadas pelo Vitest em analytics_engine.test.ts.
 */
export function runAnalyticalEngineTests(): TestResult[] {
  return analyticalEngineTestCases.map((testCase: EngineTestCase) => {
    try {
      const result = testCase.run();
      return {
        title: testCase.title,
        passed: result.passed,
        message: result.message
      };
    } catch (err: any) {
      return {
        title: testCase.title,
        passed: false,
        message: err?.message || String(err)
      };
    }
  });
}
