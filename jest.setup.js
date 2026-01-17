import '@testing-library/jest-dom'
import 'whatwg-fetch'

// Polyfill for Request and Response
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init) {
      this.url = typeof input === 'string' ? input : input.url
      this.method = init?.method || 'GET'
      this.headers = new Map(Object.entries(init?.headers || {}))
      this.body = init?.body
    }

    async json() {
      return JSON.parse(this.body)
    }
  }
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init) {
      this.body = body
      this.status = init?.status || 200
      this.statusText = init?.statusText || 'OK'
      this.headers = new Map(Object.entries(init?.headers || {}))
    }

    async json() {
      return JSON.parse(this.body)
    }
  }
}
