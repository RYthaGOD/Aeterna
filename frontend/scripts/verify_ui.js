const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('Starting visual verification...');

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        userDataDir: path.join(__dirname, '.puppeteer_tmp_' + Date.now())
    });

    try {
        const page = await browser.newPage();

        // Set viewport to a standard desktop size
        await page.setViewport({ width: 1920, height: 1080 });

        console.log('Navigating to localhost:3000...');
        await page.goto('http://localhost:3000', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Wait a bit for WebGL shaders to warm up
        console.log('Waiting for shaders...');
        await new Promise(r => setTimeout(r, 5000));

        const screenshotPath = path.join(__dirname, 'visual_verification.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });

        console.log(`Screenshot captured: ${screenshotPath}`);

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await browser.close();
    }
})();
