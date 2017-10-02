class Smoother {
  constructor (option) {
    const op = Object.assign({}, {
      method: 'exponential',
      params: {
        alpha: 0.05
      }
    }, option)
    this.op = op

    this.cache = new Map()
  }
  setValue (v) {
    switch (this.op.method) {
      case 'exponential':
        this.cache.set('vLast', v)
        if (!this.cache.has('sLast')) {
          this.cache.set('sLast', v)
        }
        break
    }
  }
  getValue () {
    // Every get triggers a iteration.
    switch (this.op.method) {
      case 'exponential':
        if (!this.cache.has('vLast')) {
          return 0
        }
        if (!this.cache.has('sLast')) {
          return this.cache.get('vLast')
        }
        const alpha = this.op.params.alpha
        let s = alpha * this.cache.get('vLast') + (1 - alpha) * this.cache.get('sLast')
        this.cache.set('sLast', s)
        return s
    }
  }
  reset () {

  }
}

export default Smoother
