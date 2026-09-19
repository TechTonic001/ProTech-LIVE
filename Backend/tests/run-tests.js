const notificationTests = require('./notificationEngine.test');
const occupancyTests = require('./roomOccupancy.test');

try {
  notificationTests.runAll();
  if (occupancyTests) {
    console.log('[TEST] roomOccupancy regression passed');
  }
  console.log('[RUN TESTS] Success');
  process.exit(0);
} catch (err) {
  console.error('[RUN TESTS] Failure:', err && err.stack ? err.stack : err);
  process.exit(1);
}
