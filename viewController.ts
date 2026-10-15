class View {
    constructor(app, defaults = {}) {
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
    handle({ request, response, next }) {
        response.view(this.$view, this.$data, this.$status)
    }
}

module.exports = View