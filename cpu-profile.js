const fs = require('fs');

const profiler = require('v8-profiler-node8');

profiler.startProfiling('probe', true);
setTimeout(() => {
  const profile = profiler.stopProfiling('probe');
  profile.export((error, result) => {
    fs.writeFileSync('jkitchen.cpuprofile', result);
    profile.delete();
    process.exit();
  });
}, 2000);

function requestHandler(req, res) {
  res.setHeader('Strict-Transport-Security', 'max-age=630720; includeSubDomains; preload');
}