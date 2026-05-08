const { exec } = require('child_process');

const getDiskSpace = () => new Promise((resolve) => {
  if (process.platform === 'win32') {
    exec('wmic logicaldisk where "DeviceID=\'C:\'" get FreeSpace,Size /format:value', (err, stdout) => {
      if (err) { resolve(null); return; }
      const free = parseInt(stdout.match(/FreeSpace=(\d+)/)?.[1] || 0);
      const size = parseInt(stdout.match(/Size=(\d+)/)?.[1] || 0);
      resolve({ free, size, used: size - free });
    });
  } else {
    exec("df -B1 / | awk 'NR==2{print \"FreeSpace=\"$4\"\\nSize=\"$2}'", (err, stdout) => {
      if (err) { resolve(null); return; }
      const free = parseInt(stdout.match(/FreeSpace=(\d+)/)?.[1] || 0);
      const size = parseInt(stdout.match(/Size=(\d+)/)?.[1] || 0);
      resolve({ free, size, used: size - free });
    });
  }
});

module.exports = { getDiskSpace };
