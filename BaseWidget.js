export default class BaseWidget {
    constructor() {
        this.target = null;
        this.status = null;
        this.contentElement = null;
        this.doneCallback = null;
        this.bindHandlers();
    }

    #removeClasses() {
        const classesToRemove = Array.from(this.target.classList).filter(className => className.startsWith('widget-'));
        classesToRemove.every(className => this.target.classList.remove(className));
    }

    #addClass(className) {
        this.target.classList.add(className);
    }

    #createContentElement() {
        this.contentElement = document.createElement('span');
        this.target.prepend(this.contentElement);
    }

    #removeContentElement() {
        if (this.contentElement) {
            this.target.removeChild(this.contentElement);
            this.contentElement = null;
        }
    }

    bindHandlers() {
        for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(this))) {
            if (typeof this[key] === 'function' && key.endsWith('Handler')) {
                this[key] = this[key].bind(this);
            }
        }
    }

    init(target, doneCallback) {
        if (this.status) {
            return false;
        }
        target.widgetInstance = this;
        this.target = target;
        this.status = 'initializing';
        this.doneCallback = doneCallback;
        this.#removeClasses();
        this.#addClass('widget-initializing');
        this.#createContentElement();
    }

    done() {
        if (this.status !== 'initializing') {
            return false;
        }
        this.status = 'initialized';
        this.#removeClasses();
        this.#addClass('widget-done');
        if (typeof this.doneCallback === 'function') {
            this.doneCallback();
        }
        return true;
    }

    fail() {
        if (this.status !== 'initializing') {
            return false;
        }
        this.status = 'failed';
        this.#removeClasses();
        this.#addClass('widget-failed');
        if (typeof this.doneCallback === 'function') {
            const error = new Error(`Initialization failed for widget ${this.constructor.name}`);
            this.doneCallback(error);
        }
        return true;
    }

    destroy() {
        if (['initializing'].includes(this.status)) {
            const error = new Error(`Widget destroy error for widget ${this.constructor.name}`);
            this.doneCallback(error);
        }
        this.#removeContentElement();
        this.#removeClasses();
        this.target.widgetInstance = null;
        this.target = null;
        this.status = null;
        this.doneCallback = null;
    }
}
