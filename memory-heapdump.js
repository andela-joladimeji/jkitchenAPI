const fs = require('fs');
const profiler = require('v8-profiler-node8');
const snapshot1 = profiler.takeSnapshot();
const snapshot2 = profiler.takeSnapshot();

// Export snapshot to file file
snapshot1.export((error, result) => {
  fs.writeFileSync('jkitchenMemory.heapsnapshot', result);
  snapshot1.delete();
});
setTimeout(() => {
  // Export snapshot to file stream
  snapshot2.export(() => {
    fs.writeFile('jkitchenMemoryTwo.heapsnapshot');
    snapshot2.delete();
    process.exit();
  });
}, 2000);