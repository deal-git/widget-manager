import BaseWidget from './BaseWidget.js';

export default class EighthWidget extends BaseWidget {
    init(target, doneCallback) {
        super.init(target, doneCallback);
        this.contentElement.onmouseenter = this.contentOnMouseEnterHandler;
        this.contentElement.onmouseleave = this.contentOnMouseLeaveHandler;
        this.contentElement.onclick = this.contentOnClickHandler;
        this.contentElement.innerHTML = 'EighthWidget is initializing...';
    }

    destroy() {
        super.destroy();
    }

    done() {
        const res = super.done();
        if (!res) {
            return;
        }
        this.contentElement.innerHTML = 'EighthWidget is initialized.';
        setTimeout(() => {
            const style = document.createElement('style');
            const keyframes = `
                @keyframes rotateXYZ {
                    0% {
                        transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
                    }
                    25% {
                        transform: rotateX(90deg) rotateY(0deg) rotateZ(5deg);
                    }
                    50% {
                        transform: rotateX(180deg) rotateY(0deg) rotateZ(0deg);
                    }
                    75% {
                        transform: rotateX(270deg) rotateY(0deg) rotateZ(5deg);
                    }
                    100% {
                        transform: rotateX(360deg) rotateY(0deg) rotateZ(0deg);
                    }
                }
            `;
            style.innerHTML = keyframes;
            document.head.appendChild(style);
            this.contentElement.style.display = 'block';
            this.contentElement.style.color = 'white';
            this.contentElement.style.fontWeight = 'bold';
            this.contentElement.style.fontSize = '2em';
            this.contentElement.style.transformStyle = 'preserve-3d';
            this.contentElement.style.textShadow = '-1px -1px 0 #000, 1px -1px 0 #000, -1px  1px 0 #000, 1px  1px 0 #000';
            this.contentElement.style.animation = 'rotateXYZ 5s infinite linear';
            this.contentElement.innerHTML = 'EighthWidget';
        }, 2000);
    }

    fail() {
        const res = super.fail();
        if (!res) {
            return;
        }
        this.contentElement.innerHTML = 'EighthWidget initialization failed.';
    }
    contentOnMouseEnterHandler() {
        this.contentElement.style.color = '#00aaff';
        this.contentElement.style.cursor = 'pointer';
    }
    contentOnMouseLeaveHandler() {
        this.contentElement.style.color = 'white';
        this.contentElement.style.cursor = 'default';
    }
    contentOnClickHandler() {
        alert('EighthWidget content clicked');
    }
}
