import BaseWidget from './BaseWidget.js';

export default class NinthWidget extends BaseWidget {
    init(target, doneCallback) {
        super.init(target, doneCallback);
        this.contentElement.innerHTML = 'NinthWidget is initializing...';
    }

    destroy() {
        super.destroy();
    }

    done() {
        const res = super.done();
        if (!res) {
            return;
        }
        this.contentElement.innerHTML = 'NinthWidget is initialized.';
        setTimeout(() => {
            this.contentElement.innerHTML = 'Weather:<br>';
            const weatherDiv = document.createElement('span');
            const weatherA = document.createElement('a');
            weatherA.href = 'https://www.metoffice.gov.uk/weather/specialist-forecasts/mountain/northwest-highlands';
            weatherA.setAttribute('data-theme', 'light');
            weatherA.textContent = 'Northwest Highlands mountain weather on Met Office';
            weatherA.classList.add('metoffice-mountain-forecast');
            weatherDiv.appendChild(weatherA);

            const script = document.createElement('script');
            script.async = true;
            script.src = 'https://www.metoffice.gov.uk/public/pws/components/mountain/loader.js';
            this.contentElement.appendChild(weatherDiv);
            this.contentElement.appendChild(script);
        }, 1000);
    }

    fail() {
        const res = super.fail();
        if (!res) {
            return;
        }
        this.contentElement.innerHTML = 'NinthWidget initialization failed.';
    }
}
