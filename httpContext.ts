const { Macroable } = require('@ostro/support/macro')

class HttpRouterContext extends Macroable {
    /**
     * constructor method.
     *
     * @param {any} request
     * @param {any} response
     * @param {any} next
     * @returns {any}
     */
    constructor(request: any, response: any, next: Function) {
        super()
        Object.defineProperty(this, 'request', {
            value: request,
            enumerable: true,
            configurable: false,
            writable: false
        })
        Object.defineProperty(this, 'response', {
            value: response,
            enumerable: true,
            configurable: false,
            writable: false
        })
    }

}

module.exports = HttpRouterContext