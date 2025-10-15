// Simple in-memory cache middleware for faster responses
const cache = new Map()

const cacheMiddleware = (duration = 300) => { // 5 minutes default
  return (req, res, next) => {
    // Only cache GET requests and exclude admin routes
    if (req.method !== 'GET' || req.path.includes('/admin') || req.session.userId) {
      return next()
    }
    
    const key = req.originalUrl || req.url
    const cached = cache.get(key)
    
    // Return cached response if valid
    if (cached && (Date.now() - cached.timestamp) < duration * 1000) {
      console.log(`🚀 Cache HIT for ${key}`)
      return res.send(cached.data)
    }
    
    // Override res.send to cache the response
    const originalSend = res.send
    res.send = function(data) {
      // Only cache successful responses
      if (res.statusCode === 200) {
        cache.set(key, {
          data: data,
          timestamp: Date.now()
        })
        console.log(`💾 Cached ${key}`)
        
        // Clean old cache entries (keep last 100)
        if (cache.size > 100) {
          const firstKey = cache.keys().next().value
          cache.delete(firstKey)
        }
      }
      
      originalSend.call(this, data)
    }
    
    next()
  }
}

// Function to clear cache when needed
const clearCache = (pattern) => {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key)
      }
    }
  } else {
    cache.clear()
  }
}

module.exports = { cacheMiddleware, clearCache }