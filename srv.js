import express from 'express';
import path from 'path';

const __dirname = process.cwd();

const app = express();

app.enable('trust proxy');

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

app.get('*', (req, res) => {
    const allowedStaticFiles = ['', 'index.html', 'styles.css', 'main.js', 'lib.js', 'favicon.ico', 'BaseWidget.js',
        'FirstWidget.js', 'SecondWidget.js', 'ThirdWidget.js', 'ForthWidget.js', 'FifthWidget.js',
        'SixthWidget.js', 'SeventhWidget.js', 'EighthWidget.js', 'NinthWidget.js'];
    const mimeTypes = { html: 'text/html', css: 'text/css', js: 'text/javascript', '': 'text/html', ico: 'image/x-icon' };

    const urlParts = req.url.split('/');
    const accessedFile = urlParts.at(-1);

    if (!allowedStaticFiles.includes(accessedFile)) {
        res.set('Content-Type', 'text/html');
        res.send('Not found');
        return;
    }

    const ext = accessedFile.split('.').pop();

    //res.set('Content-Type', `text/${mimeTypes[ext]}`);
    res.set('Content-Type', mimeTypes[ext]);
    res.sendFile(path.join(__dirname, accessedFile || 'index.html'));
});

app.listen(3080, () => {});
