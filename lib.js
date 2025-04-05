export default class WidgetManager {
    static _instance;
    #widgets = new Map();
    #widgetInitPromises = new Map();
    #resolver = async (path) => (await import(`./${path}.js`)).default;
    initWidgetCallback = () => {};

    constructor(options) {
        if (WidgetManager._instance) {
            return WidgetManager._instance
        }
        WidgetManager._instance = this;

        if (options?.resolver === 'require') {
            this.#resolver = (path) => Promise.resolve(require(`./${path}.js`));
        } else if (options?.resolver === 'test' && typeof options?.testWidget === 'function' && options?.testWidget?.prototype) {
            this.#resolver = (path) => Promise.resolve(options.testWidget);
        }
        if (options?.initWidgetCallback) {
            this.initWidgetCallback = options.initWidgetCallback;
        }
    }

    async #getWidget(path) {
        if (!this.#widgets.has(path)) {
            const module = await this.#resolver(path);
            const widget = new module();
            this.#widgets.set(path, widget);
        }
        return this.#widgets.get(path);
    }

    async #initWidget(path, node, widget) {
        const initPromise = new Promise((resolve, reject) => {
            widget.init(node, (err) => {
                this.#widgetInitPromises.delete(path);
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
                this.initWidgetCallback(node);
            });
        });
        this.#widgetInitPromises.set(path, initPromise);
        return initPromise;
    }

    async init(target, callback) {
        const errors = [];
        let initializedWidgetsCount = 0;

        const initImpl = async (node) => {
            if (!node) {
                return;
            }
            const widgetTreeErrors = [];
            const widgetPath = node.getAttribute('widget');
            if (widgetPath) {
                try {
                    const widget = await this.#getWidget(widgetPath);
                    if (widget?.status === 'failed') {
                        return;
                    } else if (widget?.status !== 'initialized') {
                        let initPromise = this.#widgetInitPromises.get(widgetPath);
                        if (!initPromise) {
                            // widget initialization not started yet
                            await this.#initWidget(widgetPath, node, widget);
                            this.#widgets.set(widgetPath, widget);
                            initializedWidgetsCount++;
                        } else {
                            // widget is already initializing, wait for existing initialization promise to finish
                            await initPromise;
                            await new Promise(resolve => setTimeout(resolve, 20));
                        }
                    }
                } catch (error) {
                    widgetTreeErrors.push(error);
                }
            }
            errors.push(...widgetTreeErrors);
            if (!widgetTreeErrors.length && node.children.length) {
                const childrenInitPromises = [];
                for (const child of node.children) {
                    childrenInitPromises.push(initImpl(child));
                }
                await Promise.all(childrenInitPromises);
            }
        };

        await initImpl(target);
        callback(initializedWidgetsCount, errors.length ? errors : null);
    }

    destroy(target) {
        const destroyWidget = (node) => {
            const widgetPath = node.getAttribute('widget');
            if (widgetPath && this.#widgets.has(widgetPath)) {
                const widget = this.#widgets.get(widgetPath);
                widget.destroy();
                this.#widgets.delete(widgetPath);
                this.#widgetInitPromises.delete(widgetPath);
            }
            for (const child of node.children) {
                destroyWidget(child);
            }
        };
        destroyWidget(target);
    }
}
