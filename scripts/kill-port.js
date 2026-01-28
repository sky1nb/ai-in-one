// Helper script to kill process on port 5173
const { exec } = require('child_process');

const port = 5173;

if (process.platform === 'win32') {
  exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
    if (error) {
      console.log(`No process found on port ${port}`);
      return;
    }
    
    const lines = stdout.trim().split('\n');
    const pids = new Set();
    
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') {
        pids.add(pid);
      }
    });
    
    if (pids.size === 0) {
      console.log(`No process found on port ${port}`);
      return;
    }
    
    pids.forEach(pid => {
      exec(`taskkill /PID ${pid} /F`, (err) => {
        if (err) {
          console.error(`Failed to kill process ${pid}:`, err.message);
        } else {
          console.log(`Killed process ${pid} on port ${port}`);
        }
      });
    });
  });
} else {
  exec(`lsof -ti:${port} | xargs kill -9`, (error) => {
    if (error) {
      console.log(`No process found on port ${port}`);
    } else {
      console.log(`Killed process on port ${port}`);
    }
  });
}
