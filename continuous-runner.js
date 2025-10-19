/**
 * Continuous Runner - Non-Stop Browser Sessions
 * Runs browser sessions continuously with extended duration
 */

const BrowserSession = require('./browser-session');
const { getRandomDeviceAny } = require('./config/devices');
const { getRandomProxy } = require('./config/proxies');
const { sleep } = require('./utils/helpers');

class ContinuousRunner {
  constructor(options = {}) {
    this.options = {
      minSessionDuration: options.minSessionDuration || 90000,    // 1.5 minutes minimum
      maxSessionDuration: options.maxSessionDuration || 180000,   // 3 minutes maximum
      delayBetweenSessions: options.delayBetweenSessions || 5000, // 5 seconds between sessions
      pagesPerSession: options.pagesPerSession || 5,              // Visit 5 pages per session
      runIndefinitely: options.runIndefinitely !== false,         // Run forever by default
      maxSessions: options.maxSessions || Infinity,               // Max sessions (Infinity = forever)
      verbose: options.verbose !== false                          // Verbose logging
    };

    this.sessionCount = 0;
    this.successCount = 0;
    this.failureCount = 0;
    this.startTime = null;
    this.isRunning = false;
  }

  /**
   * Start continuous running
   */
  async start() {
    this.isRunning = true;
    this.startTime = Date.now();

    console.log('\n' + '═'.repeat(80));
    console.log('🔄 CONTINUOUS RUNNER - NON-STOP MODE');
    console.log('═'.repeat(80));
    console.log('\nConfiguration:');
    console.log(`  Min Session Duration:  ${this.options.minSessionDuration / 1000}s`);
    console.log(`  Max Session Duration:  ${this.options.maxSessionDuration / 1000}s`);
    console.log(`  Pages Per Session:     ${this.options.pagesPerSession}`);
    console.log(`  Delay Between:         ${this.options.delayBetweenSessions / 1000}s`);
    console.log(`  Run Indefinitely:      ${this.options.runIndefinitely ? 'YES' : 'NO'}`);
    console.log(`  Max Sessions:          ${this.options.maxSessions === Infinity ? '∞' : this.options.maxSessions}`);
    console.log('\n' + '═'.repeat(80));
    console.log('\n⚠️  Press Ctrl+C to stop at any time\n');
    console.log('═'.repeat(80) + '\n');

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => this.stop());

    while (this.isRunning && this.sessionCount < this.options.maxSessions) {
      await this.runSession();
      
      if (this.sessionCount < this.options.maxSessions) {
        console.log(`\n⏳ Waiting ${this.options.delayBetweenSessions / 1000}s before next session...\n`);
        await sleep(this.options.delayBetweenSessions);
      }
    }

    this.stop();
  }

  /**
   * Run a single extended session
   */
  async runSession() {
    this.sessionCount++;
    const sessionStart = Date.now();

    const device = getRandomDeviceAny();
    const proxy = getRandomProxy();

    console.log('\n' + '─'.repeat(80));
    console.log(`🚀 SESSION #${this.sessionCount} - ${new Date().toLocaleTimeString()}`);
    console.log('─'.repeat(80));
    console.log(`📱 Device:  ${device.name} (${device.type})`);
    console.log(`🌐 Proxy:   ${proxy.ip}:${proxy.port} (${proxy.country}, ${proxy.city})`);
    console.log('─'.repeat(80) + '\n');

    const session = new BrowserSession({
      device,
      proxy,
      sessionId: `continuous_${this.sessionCount}_${Date.now()}`
    });

    try {
      // Run session with extended behavior
      const success = await session.runExtendedSession(
        'zentha matcha',
        this.options.pagesPerSession,
        this.options.minSessionDuration
      );

      const duration = ((Date.now() - sessionStart) / 1000).toFixed(2);

      if (success) {
        this.successCount++;
        console.log(`\n✅ Session #${this.sessionCount} completed successfully (${duration}s)`);
      } else {
        this.failureCount++;
        console.log(`\n⚠️  Session #${this.sessionCount} completed with warnings (${duration}s)`);
      }
    } catch (error) {
      this.failureCount++;
      const duration = ((Date.now() - sessionStart) / 1000).toFixed(2);
      console.error(`\n❌ Session #${this.sessionCount} failed (${duration}s):`, error.message);
    }

    // Print running statistics
    this.printStats();
  }

  /**
   * Print current statistics
   */
  printStats() {
    const uptime = ((Date.now() - this.startTime) / 1000).toFixed(0);
    const successRate = this.sessionCount > 0 
      ? ((this.successCount / this.sessionCount) * 100).toFixed(1) 
      : 0;

    console.log('\n' + '─'.repeat(80));
    console.log('📊 STATISTICS');
    console.log('─'.repeat(80));
    console.log(`  Total Sessions:   ${this.sessionCount}`);
    console.log(`  ✅ Successful:     ${this.successCount}`);
    console.log(`  ❌ Failed:         ${this.failureCount}`);
    console.log(`  📈 Success Rate:   ${successRate}%`);
    console.log(`  ⏱️  Uptime:         ${uptime}s`);
    console.log('─'.repeat(80) + '\n');
  }

  /**
   * Stop the runner
   */
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;

    console.log('\n\n' + '═'.repeat(80));
    console.log('🛑 STOPPING CONTINUOUS RUNNER');
    console.log('═'.repeat(80) + '\n');

    this.printStats();

    console.log('═'.repeat(80));
    console.log('👋 Continuous runner stopped. Goodbye!');
    console.log('═'.repeat(80) + '\n');

    process.exit(0);
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);

  const options = {
    minSessionDuration: 90000,    // 1.5 minutes
    maxSessionDuration: 180000,   // 3 minutes
    delayBetweenSessions: 5000,   // 5 seconds
    pagesPerSession: 5,           // 5 pages
    runIndefinitely: true,
    maxSessions: Infinity,
    verbose: true
  };

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--duration':
      case '-d':
        const mins = parseInt(args[++i]) || 1.5;
        options.minSessionDuration = mins * 60 * 1000;
        options.maxSessionDuration = mins * 60 * 1000 * 1.5;
        break;
      case '--pages':
      case '-p':
        options.pagesPerSession = parseInt(args[++i]) || 5;
        break;
      case '--delay':
        options.delayBetweenSessions = parseInt(args[++i]) * 1000 || 5000;
        break;
      case '--max-sessions':
      case '-m':
        options.maxSessions = parseInt(args[++i]) || Infinity;
        options.runIndefinitely = false;
        break;
      case '--help':
      case '-h':
        printHelp();
        return;
    }
  }

  const runner = new ContinuousRunner(options);
  await runner.start();
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
Continuous Runner - Non-Stop Browser Sessions
==============================================

Usage: node continuous-runner.js [options]

Options:
  -d, --duration <minutes>    Min session duration in minutes (default: 1.5)
  -p, --pages <n>            Pages to visit per session (default: 5)
  --delay <seconds>          Delay between sessions in seconds (default: 5)
  -m, --max-sessions <n>     Max sessions before stopping (default: ∞)
  -h, --help                 Show this help message

Examples:
  node continuous-runner.js                              # Run indefinitely, 1.5min sessions
  node continuous-runner.js --duration 2 --pages 7       # 2min sessions, 7 pages
  node continuous-runner.js --max-sessions 10            # Stop after 10 sessions
  node continuous-runner.js -d 3 -p 10 --delay 10        # 3min sessions, 10 pages, 10s delay

Press Ctrl+C to stop at any time.
  `);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = ContinuousRunner;

