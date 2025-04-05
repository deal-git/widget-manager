import BaseWidget from './BaseWidget.js';

export default class FirstWidget extends BaseWidget {
    init(target, doneCallback) {
        super.init(target, doneCallback);
        this.contentElement.onclick = this.contentClickHandler;
        this.contentElement.innerHTML = 'FirstWidget content. Widget is initializing...';
    }

    destroy() {
        super.destroy();
    }

    done() {
        const res = super.done();
        if (!res) {
            return;
        }
        this.contentElement.innerHTML = 'FirstWidget content. Widget is initialized.';
    }

    fail() {
        const res = super.fail();
        if (!res) {
            return;
        }
        this.contentElement.innerHTML = 'FirstWidget content. Widget initialization failed.';
    }

    contentClickHandler() {
        console.log('FirstWidget content clicked', arguments, this);
    }
}
