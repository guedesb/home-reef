import { runAnalyticalEngineTests } from './analytics_engine.test';

console.log('====================================================');
console.log('🧪 Executando Testes Unitários do Motor Analítico');
console.log('====================================================\n');

const results = runAnalyticalEngineTests();
let allPassed = true;

results.forEach((res, index) => {
  const status = res.passed ? '✅ [PASS]' : '❌ [FAIL]';
  console.log(`${index + 1}. ${status} ${res.title}`);
  console.log(`   ${res.message}\n`);
  if (!res.passed) {
    allPassed = false;
  }
});

console.log('====================================================');
if (allPassed) {
  console.log(`🎉 Sucesso: Todos os ${results.length} testes passaram com êxito!`);
  console.log('====================================================');
  process.exit(0);
} else {
  console.error(`💥 Falha: Pelo menos um teste falhou.`);
  console.log('====================================================');
  process.exit(1);
}
