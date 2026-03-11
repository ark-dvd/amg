module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'started server on',
      startServerReadyTimeout: 30000,
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/about',
        'http://localhost:3000/services',
        'http://localhost:3000/portfolio',
        'http://localhost:3000/insights',
        'http://localhost:3000/contact',
        'http://localhost:3000/services/ci-benchmark-service',
        'http://localhost:3000/portfolio/ci-benchmark-project',
        'http://localhost:3000/insights/ci-benchmark-article',
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'perf',
        formFactor: 'mobile',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 4,
        },
        screenEmulation: {
          mobile: true,
          width: 390,
          height: 844,
          deviceScaleFactor: 3,
          disabled: false,
        },
      },
    },
    assert: {
      preset: 'lighthouse:no-pwa',
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
