class InvalidRouteExceptions extends Error {
    /**
     * constructor method.
     *
     * @param {any} message
     * @returns {any}
     */
    constructor(message: string) {
        super();
        this.name = this.constructor.name;
        this.message = message;
        this.statusCode = 500;
        Error.captureStackTrace(this, this.constructor);

    }
}
module.exports = InvalidRouteExceptions