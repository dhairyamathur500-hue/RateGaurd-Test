import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  Play,
  Zap,
  RotateCcw,
  Activity,
  Server,
  Layers,
  Clock,
  ArrowUpRight,
  Code2,
  Lock,
  Cpu,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Hash
} from 'lucide-react';

const PACKAGE_NAME = 'rateguard-dhairyamathur';
const NPM_URL = 'https://www.npmjs.com/package/rateguard-dhairyamathur';
const GITHUB_URL = 'https://github.com/dhairyamathur500-hue/Rategaurd_NPM_Package';
// Use relative path for single integrated deployment, or configurable via env var
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
export default function App() {
  // Copy state
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('npm');

  // Backend config state
  const [configData, setConfigData] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);

  // Live test stats & state
  const [isLoading, setIsLoading] = useState(false);
  const [totalRequests, setTotalRequests] = useState(0);
  const [successfulRequests, setSuccessfulRequests] = useState(0);
  const [blockedRequests, setBlockedRequests] = useState(0);
  const [remainingQuota, setRemainingQuota] = useState(10);
  const [maxLimit, setMaxLimit] = useState(10);
  const [resetSeconds, setResetSeconds] = useState(60);
  const [retryAfter, setRetryAfter] = useState(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  // Live request history
  const [requestLogs, setRequestLogs] = useState([]);
  const [latestResponse, setLatestResponse] = useState(null);

  // Fetch backend rate-limit config on load
  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/config`);
      if (res.ok) {
        const data = await res.json();
        setConfigData(data.config);
        setMaxLimit(data.config.max || 10);
        setRemainingQuota(data.config.max || 10);
        setBackendOnline(true);
      }
    } catch (err) {
      console.warn('Backend not reachable yet:', err);
      setBackendOnline(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    const interval = setInterval(fetchConfig, 10000);
    return () => clearInterval(interval);
  }, []);

  // Copy command helper
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getInstallCmd = () => {
    switch (activeTab) {
      case 'pnpm':
        return `pnpm add ${PACKAGE_NAME}`;
      case 'yarn':
        return `yarn add ${PACKAGE_NAME}`;
      case 'bun':
        return `bun add ${PACKAGE_NAME}`;
      default:
        return `npm install ${PACKAGE_NAME}`;
    }
  };

  // Send single live request to protected backend endpoint
  const sendLiveRequest = async () => {
    setIsLoading(true);
    const startTime = performance.now();

    try {
      const res = await fetch(`${API_BASE_URL}/api/test`);
      const latency = Math.round(performance.now() - startTime);

      // Read actual headers set by RateGuard middleware
      const limitHeader = res.headers.get('RateLimit-Limit');
      const remainingHeader = res.headers.get('RateLimit-Remaining');
      const resetHeader = res.headers.get('RateLimit-Reset');
      const retryAfterHeader = res.headers.get('Retry-After');

      const data = await res.json().catch(() => ({}));
      const statusCode = res.status;

      // Update remaining quota and limits from real headers
      if (remainingHeader !== null) {
        setRemainingQuota(parseInt(remainingHeader, 10));
      }
      if (limitHeader !== null) {
        setMaxLimit(parseInt(limitHeader, 10));
      }
      if (resetHeader !== null) {
        setResetSeconds(parseInt(resetHeader, 10));
      }
      if (retryAfterHeader !== null) {
        setRetryAfter(parseInt(retryAfterHeader, 10));
      } else {
        setRetryAfter(null);
      }

      setTotalRequests((prev) => prev + 1);

      if (statusCode === 200) {
        setSuccessfulRequests((prev) => prev + 1);
        setIsRateLimited(false);
      } else if (statusCode === 429) {
        setBlockedRequests((prev) => prev + 1);
        setIsRateLimited(true);
      }

      const logEntry = {
        id: Date.now() + Math.random(),
        time: new Date().toLocaleTimeString(),
        status: statusCode,
        latency: `${latency}ms`,
        remaining: remainingHeader,
        limit: limitHeader,
        resetIn: resetHeader,
        retryAfter: retryAfterHeader,
        data: data,
        headers: {
          'RateLimit-Limit': limitHeader || '10',
          'RateLimit-Remaining': remainingHeader || '0',
          'RateLimit-Reset': resetHeader || '0',
          ...(retryAfterHeader ? { 'Retry-After': retryAfterHeader } : {})
        }
      };

      setRequestLogs((prev) => [logEntry, ...prev.slice(0, 19)]);
      setLatestResponse(logEntry);
      setBackendOnline(true);
    } catch (err) {
      console.error('Request error:', err);
      setBackendOnline(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Burst requests (5 rapid calls) to quickly exceed limit
  const sendBurstRequests = async (count = 5) => {
    for (let i = 0; i < count; i++) {
      await sendLiveRequest();
      // tiny jitter so logs show sequential timestamps
      await new Promise((r) => setTimeout(r, 60));
    }
  };

  // Reset counters via backend RateGuard resetAll()
  const resetLiveCounters = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/reset`, { method: 'POST' });
      if (res.ok) {
        setTotalRequests(0);
        setSuccessfulRequests(0);
        setBlockedRequests(0);
        setRemainingQuota(maxLimit);
        setIsRateLimited(false);
        setRetryAfter(null);
        setRequestLogs([]);
        setLatestResponse(null);
      }
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  return (
    <div className="relative min-h-screen bg-dark-950 text-slate-100 bg-grid-pattern overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-500/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-dark-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                RateGuard
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                v1.0.0
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono">
              <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-slate-400">API:</span>
              <span className={backendOnline ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
                {backendOnline ? 'API Connected' : 'Connecting...'}
              </span>
            </div>

            <a
              href={NPM_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 hover:bg-red-900/40 hover:border-red-500/50 transition-all"
            >
              <span className="font-bold">npm</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>

            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-600 transition-all"
            >
              <span>GitHub</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Zero-Dependency Express Rate Limiter</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Next-Gen API Protection for{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Express.js
          </span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          High-performance in-memory rate-limiting middleware featuring custom key generation, IP whitelisting, standard rate headers, and automatic memory cleanup.
        </p>

        {/* Package Banner Badge */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <span className="text-xs font-mono text-slate-400">Package:</span>
          <span className="font-mono text-sm font-semibold text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 px-3 py-1 rounded-lg">
            {PACKAGE_NAME}
          </span>
        </div>

        {/* Modern Install Command Box */}
        <div className="mt-8 max-w-xl mx-auto">
          <div className="glass-panel-elevated rounded-xl p-1.5 border border-slate-800 shadow-2xl">
            {/* Package Manager Tabs */}
            <div className="flex items-center space-x-1 px-3 pt-2 pb-1 border-b border-slate-800/80 text-xs">
              {['npm', 'pnpm', 'yarn', 'bun'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2.5 py-1 rounded font-mono transition-colors ${
                    activeTab === tab
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between p-3 font-mono text-sm bg-dark-900/90 rounded-lg mt-1">
              <div className="flex items-center space-x-3 overflow-x-auto text-left py-1">
                <span className="text-emerald-500 font-bold select-none">$</span>
                <span className="text-slate-200 whitespace-nowrap">{getInstallCmd()}</span>
              </div>
              <button
                onClick={() => handleCopy(getInstallCmd())}
                aria-label="Copy install command"
                className="ml-3 p-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700 flex-shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Quick feature pills */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Zero External Dependencies</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>In-Memory Map Storage</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Standard RateLimit Headers</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Express 4.x & 5.x Ready</span>
          </div>
        </div>
      </section>

      {/* Main Interactive Demo & Live API Section */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-20">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-mono text-emerald-400 mb-2">
              <Activity className="w-4 h-4" />
              <span>LIVE INTERACTIVE TEST BENCH</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Test Real Rate Limiting in Real Time
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Requests hit an actual Express backend running <code className="text-emerald-400">{PACKAGE_NAME}</code> middleware.
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            <button
              onClick={resetLiveCounters}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Counters</span>
            </button>

            <button
              onClick={() => sendBurstRequests(5)}
              disabled={isLoading}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition-all disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Send Burst (5x)</span>
            </button>

            <button
              onClick={sendLiveRequest}
              disabled={isLoading}
              className="inline-flex items-center space-x-2 px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-dark-950 font-bold text-xs tracking-wide transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-dark-950" />
              <span>{isLoading ? 'Sending...' : 'Send Request'}</span>
            </button>
          </div>
        </div>

        {/* HTTP 429 Alert Banner (Visible when limit is exceeded) */}
        {isRateLimited && (
          <div className="mb-8 p-4 rounded-xl bg-rose-950/60 border border-rose-500/60 shadow-lg shadow-rose-950/40 flex items-start space-x-3 animate-bounce-short">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-rose-500 text-white">
                  HTTP 429
                </span>
                <h3 className="font-bold text-rose-200">Rate Limit Exceeded!</h3>
              </div>
              <p className="mt-1 text-sm text-rose-300/90">
                RateGuard successfully blocked this request because you exceeded the configured limit of{' '}
                <strong className="text-white">{maxLimit} requests</strong> per window.{' '}
                {retryAfter && (
                  <span>
                    Retry available in <strong className="text-white">{retryAfter} seconds</strong>.
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Total Requests */}
          <div className="glass-panel rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Requests</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">{totalRequests}</div>
            <div className="mt-2 text-xs text-slate-400 flex items-center space-x-1">
              <span>Cumulative calls made</span>
            </div>
          </div>

          {/* Card 2: Successful Requests */}
          <div className="glass-panel rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Successful (200)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 font-mono">
              {successfulRequests}
            </div>
            <div className="mt-2 text-xs text-slate-400">Allowed through middleware</div>
          </div>

          {/* Card 3: Remaining Requests */}
          <div className="glass-panel rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Remaining Quota</span>
              <Shield className={`w-4 h-4 ${remainingQuota > 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
            </div>
            <div
              className={`text-3xl font-extrabold font-mono ${
                remainingQuota === 0
                  ? 'text-rose-400'
                  : remainingQuota <= 3
                  ? 'text-amber-400'
                  : 'text-white'
              }`}
            >
              {remainingQuota} <span className="text-sm font-normal text-slate-500">/ {maxLimit}</span>
            </div>
            {/* Visual Quota Bar */}
            <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  remainingQuota === 0
                    ? 'bg-rose-500'
                    : remainingQuota <= 3
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, (remainingQuota / maxLimit) * 100))}%` }}
              />
            </div>
          </div>

          {/* Card 4: Blocked Requests */}
          <div className="glass-panel rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Blocked (429)</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl font-extrabold text-rose-400 font-mono">{blockedRequests}</div>
            <div className="mt-2 text-xs text-slate-400">Rejected & rate-limited</div>
          </div>
        </div>

        {/* Split Section: Configuration Inspector + Live Terminal Log */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (5 cols): Current Rate-Limit Configuration */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            <div className="glass-panel rounded-xl p-5 border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center space-x-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-sm text-slate-200">Active Rate-Limit Configuration</h3>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  server.js
                </span>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-dark-900/80 border border-slate-800/80">
                  <span className="text-slate-400 font-sans">Window Duration</span>
                  <span className="text-emerald-400 font-semibold">
                    {configData ? `${configData.windowSeconds}s (${configData.windowMs} ms)` : '60s (60000 ms)'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-dark-900/80 border border-slate-800/80">
                  <span className="text-slate-400 font-sans">Max Requests Limit</span>
                  <span className="text-cyan-400 font-semibold">{maxLimit} requests</span>
                </div>

                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-dark-900/80 border border-slate-800/80">
                  <span className="text-slate-400 font-sans">HTTP Status on Exceed</span>
                  <span className="text-rose-400 font-semibold">429 (Too Many Requests)</span>
                </div>

                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-dark-900/80 border border-slate-800/80">
                  <span className="text-slate-400 font-sans">Response Headers</span>
                  <span className="text-slate-200">Standard + Legacy (X-RateLimit)</span>
                </div>

                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-dark-900/80 border border-slate-800/80">
                  <span className="text-slate-400 font-sans">Storage Engine</span>
                  <span className="text-violet-400 font-semibold">In-Memory MapStore</span>
                </div>
              </div>

              {/* Express Code Snippet */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="flex items-center space-x-1.5 font-sans">
                    <Code2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Backend Implementation</span>
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-dark-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
                  <p className="text-slate-500">// Actual backend code executing right now:</p>
                  <p><span className="text-purple-400">const</span> rateGuard = <span className="text-yellow-300">require</span>(<span className="text-emerald-300">'{PACKAGE_NAME}'</span>);</p>
                  <p className="mt-1"><span className="text-purple-400">const</span> apiLimiter = <span className="text-cyan-400">rateGuard</span>(&#123;</p>
                  <p className="pl-4">windowMs: <span className="text-amber-300">60000</span>,</p>
                  <p className="pl-4">max: <span className="text-amber-300">10</span>,</p>
                  <p className="pl-4">statusCode: <span className="text-amber-300">429</span></p>
                  <p>&#125;);</p>
                  <p className="mt-1">app.<span className="text-blue-400">get</span>(<span className="text-emerald-300">'/api/test'</span>, apiLimiter, handler);</p>
                </div>
              </div>
            </div>

            {/* Links and Package Card */}
            <div className="glass-panel rounded-xl p-5 border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Official Links & Package Resources
              </h4>
              <div className="space-y-2">
                <a
                  href={NPM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg bg-dark-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all text-xs"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-mono font-bold text-[10px]">
                      npm
                    </span>
                    <span className="text-slate-200 font-mono">{PACKAGE_NAME}</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>

                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg bg-dark-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all text-xs"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono font-bold text-[10px]">
                      git
                    </span>
                    <span className="text-slate-200">Rategaurd_NPM_Package</span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column (7 cols): Live Request/Response Inspector & Console */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            <div className="glass-panel rounded-xl p-5 border border-slate-800 flex-1 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-slate-200">Live Request & Header Inspector</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {requestLogs.length} call{requestLogs.length === 1 ? '' : 's'} recorded
                </span>
              </div>

              {/* Latest Response Header Inspection Card */}
              {latestResponse ? (
                <div className="mb-4 p-3.5 rounded-lg bg-dark-900/90 border border-slate-800 text-xs font-mono">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-300">
                    <span className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-white text-[10px] ${
                          latestResponse.status === 200 ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      >
                        {latestResponse.status === 200 ? '200 OK' : '429 TOO MANY REQUESTS'}
                      </span>
                      <span className="text-slate-400 font-sans">Endpoint:</span>
                      <span className="text-slate-200">GET /api/test</span>
                    </span>
                    <span className="text-slate-400">{latestResponse.latency}</span>
                  </div>

                  {/* RateGuard Response Headers */}
                  <div className="space-y-1 text-[11px] text-slate-400">
                    <div className="text-slate-500 font-sans uppercase tracking-wider text-[10px] mb-1">
                      RateGuard Headers Received:
                    </div>
                    <div>
                      <span className="text-cyan-400">RateLimit-Limit:</span>{' '}
                      <span className="text-white">{latestResponse.headers['RateLimit-Limit']}</span>
                    </div>
                    <div>
                      <span className="text-cyan-400">RateLimit-Remaining:</span>{' '}
                      <span
                        className={
                          latestResponse.headers['RateLimit-Remaining'] === '0'
                            ? 'text-rose-400 font-bold'
                            : 'text-emerald-400 font-bold'
                        }
                      >
                        {latestResponse.headers['RateLimit-Remaining']}
                      </span>
                    </div>
                    <div>
                      <span className="text-cyan-400">RateLimit-Reset:</span>{' '}
                      <span className="text-white">{latestResponse.headers['RateLimit-Reset']}s</span>
                    </div>
                    {latestResponse.headers['Retry-After'] && (
                      <div>
                        <span className="text-rose-400 font-bold">Retry-After:</span>{' '}
                        <span className="text-rose-300 font-bold">
                          {latestResponse.headers['Retry-After']}s
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Raw JSON payload preview */}
                  <div className="mt-3 pt-2 border-t border-slate-800/80">
                    <div className="text-slate-500 font-sans uppercase tracking-wider text-[10px] mb-1">
                      Response Body:
                    </div>
                    <pre className="text-slate-300 text-[11px] bg-dark-950 p-2.5 rounded border border-slate-800 overflow-x-auto">
                      {JSON.stringify(latestResponse.data, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  <Play className="w-6 h-6 mx-auto mb-2 opacity-30 text-emerald-400" />
                  <p>Click "Send Request" or "Send Burst (5x)" to trigger live RateGuard inspection.</p>
                </div>
              )}

              {/* History Table */}
              <div className="mt-auto">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Recent Request Log
                </div>
                <div className="rounded-lg border border-slate-800 overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-dark-900 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Time</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Remaining</th>
                        <th className="py-2 px-3 text-right">Latency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-dark-950/60">
                      {requestLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-slate-500">
                            No requests sent yet
                          </td>
                        </tr>
                      ) : (
                        requestLogs.map((log) => (
                          <tr
                            key={log.id}
                            className={`hover:bg-slate-800/40 transition-colors ${
                              log.status === 429 ? 'bg-rose-950/20' : ''
                            }`}
                          >
                            <td className="py-1.5 px-3 text-slate-400">{log.time}</td>
                            <td className="py-1.5 px-3">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  log.status === 200
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                                }`}
                              >
                                {log.status} {log.status === 200 ? 'OK' : 'Blocked'}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 text-slate-300">
                              {log.remaining !== null ? `${log.remaining} left` : '-'}
                            </td>
                            <td className="py-1.5 px-3 text-right text-slate-400">{log.latency}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-dark-950/90 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-300">RateGuard</span>
            <span>— In-memory API rate limiter by Dhairya Mathur</span>
          </div>

          <div className="flex items-center space-x-4">
            <a href={NPM_URL} target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">
              npm package: {PACKAGE_NAME}
            </a>
            <span>•</span>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">
              GitHub Repository
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
