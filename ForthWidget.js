import BaseWidget from './BaseWidget.js';

export default class ForthWidget extends BaseWidget {
    init(target, doneCallback) {
        super.init(target, doneCallback);
    }

    destroy() {
        super.destroy();
    }

    done() {
        const res = super.done();
    }

    fail() {
        const res = super.fail();
    }
}
