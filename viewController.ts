class View {
    /**
     * constructor method.
     *
     * @param {any} app
     * @param {any} defaults
     * @returns {any}
     */
    constructor(app: any, defaults: Record<string, any> = {}) {
        if ((!defaults || Object.keys(defaults).length === 0) && app && typeof app === 'object' && app.view) {
            defaults = app;
            app = null;
        }
        defaults = defaults || {};
        this.$app = app;
        this.$view = defaults.view;
        this.$data = defaults.data;
        this.$status = defaults.status;
    }
    /**
     * handle method.
     *
     * @param {any} { request
     * @param {any} response
     * @param {any} next }
     * @returns {any}
     */
    handle({ request, response, next }: Record<string, any>) {
        response.view(this.$view, this.$data, this.$status)
    }
}

module.exports = View