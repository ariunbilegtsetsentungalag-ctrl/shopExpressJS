// Performance monitoring script for tracking optimizations
const performanceMonitor = {
  startTime: Date.now(),
  metrics: {
    pageLoadTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    apiCalls: 0,
    lazyImagesLoaded: 0,
    compressionRatio: 0
  },

  // Track page load time
  trackPageLoad() {
    window.addEventListener('load', () => {
      this.metrics.pageLoadTime = Date.now() - this.startTime
      console.log('📊 Page Load Time:', this.metrics.pageLoadTime + 'ms')
    })
  },

  // Track cache performance
  trackCachePerformance() {
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const response = await originalFetch(...args)
      if (response.headers.get('x-cache') === 'HIT') {
        this.metrics.cacheHits++
        console.log('💾 Cache HIT for:', args[0])
      } else {
        this.metrics.cacheMisses++
        console.log('🌐 Cache MISS for:', args[0])
      }
      this.metrics.apiCalls++
      return response
    }
  },

  // Track lazy loading
  trackLazyImages() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'IMG' && node.src) {
            this.metrics.lazyImagesLoaded++
            console.log('🖼️ Lazy image loaded:', node.src)
          }
        })
      })
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  },

  // Display performance dashboard
  showDashboard() {
    const dashboard = document.createElement('div')
    dashboard.id = 'performance-dashboard'
    dashboard.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      min-width: 250px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `
    
    const updateDashboard = () => {
      const cacheHitRate = this.metrics.apiCalls > 0 ? 
        ((this.metrics.cacheHits / this.metrics.apiCalls) * 100).toFixed(1) : 0
      
      dashboard.innerHTML = `
        <div style="color: #4CAF50; font-weight: bold; margin-bottom: 10px;">⚡ Performance Monitor</div>
        <div>📊 Page Load: ${this.metrics.pageLoadTime}ms</div>
        <div>💾 Cache Hit Rate: ${cacheHitRate}%</div>
        <div>🌐 API Calls: ${this.metrics.apiCalls}</div>
        <div>🖼️ Lazy Images: ${this.metrics.lazyImagesLoaded}</div>
        <div style="margin-top: 8px; color: #FFD700;">
          Cache Hits: ${this.metrics.cacheHits} | Misses: ${this.metrics.cacheMisses}
        </div>
        <div style="margin-top: 8px; font-size: 10px; color: #888;">
          Click to toggle dashboard
        </div>
      `
    }
    
    dashboard.addEventListener('click', () => {
      dashboard.style.display = dashboard.style.display === 'none' ? 'block' : 'none'
    })
    
    document.body.appendChild(dashboard)
    
    // Update dashboard every 2 seconds
    setInterval(updateDashboard, 2000)
    updateDashboard()
  },

  // Initialize all monitoring
  init() {
    console.log('🔍 Performance Monitor initialized')
    this.trackPageLoad()
    this.trackCachePerformance()
    this.trackLazyImages()
    
    // Dashboard disabled - uncomment to show performance monitor
    // setTimeout(() => {
    //   this.showDashboard()
    // }, 3000)
  }
}

// Auto-initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => performanceMonitor.init())
} else {
  performanceMonitor.init()
}

// Make globally available for debugging
window.performanceMonitor = performanceMonitor