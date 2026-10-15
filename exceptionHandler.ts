class ExceptionHandler {
    /**
     * handle method.
     *
     * @param {any} error
     * @param {any} { response }
     * @param {any} next
     * @returns {any}
     */
    handle(error, { response }, next) {
        let status = 500;
        if (error instanceof Error) {
            status = error.status || 500;
            error = error.stack;
        } else if (typeof error == 'object') {
            status = error.status || 500;
            error = error;
        }
        error = process.env['NODE_ENV'] != 'production' ? error : 'Whoops, looks like something went wrong.';
        response.send(`<pre>${error}</pre>`, status);
        if (typeof next === 'function') {
            next();
        }
    }

    /**
     * terminate method.
     *
     * @param {any} error
     * @param {any} { response }
     * @param {any} next
     * @returns {any}
     */
    terminate(error, { response }, next) {
        console.error(error)
    }
}

module.exports = ExceptionHandler
