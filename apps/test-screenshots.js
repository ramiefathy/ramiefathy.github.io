const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function captureAlopeciaScreenshots() {
    // Ensure screenshots directory exists
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir);
    }

    const htmlPath = path.join(__dirname, 'AlopeciaMindMaps', 'Alopecia', 'AlopeciaMindMaps_optimized_stable.html');
    const fileUrl = `file://${htmlPath}`;
    
    console.log(`Opening: ${fileUrl}`);
    
    const browser = await chromium.launch({ 
        headless: false,
        args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
    });
    
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 }
    });
    
    const page = await context.newPage();
    
    // Navigate to the application
    await page.goto(fileUrl, { waitUntil: 'networkidle' });
    
    // Wait for the mind map container to be visible
    await page.waitForSelector('#mind-map-container', { timeout: 10000 });
    await page.waitForTimeout(3000); // Extra wait for D3 rendering
    
    console.log('✓ Application loaded successfully');
    
    // Take screenshot of initial state (Diagnostic Approach)
    await page.screenshot({ 
        path: path.join(screenshotsDir, '1_diagnostic_approach.png'),
        fullPage: false
    });
    console.log('✓ Captured Diagnostic Approach tab');
    
    // Test Classification tab
    await page.click('[data-tab="classification"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ 
        path: path.join(screenshotsDir, '2_classification.png'),
        fullPage: false
    });
    console.log('✓ Captured Classification tab');
    
    // Test Diagnostic Tools tab
    await page.click('[data-tab="tools"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ 
        path: path.join(screenshotsDir, '3_diagnostic_tools.png'),
        fullPage: false
    });
    console.log('✓ Captured Diagnostic Tools tab');
    
    // Test Therapeutic Modality tab
    await page.click('[data-tab="modality"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ 
        path: path.join(screenshotsDir, '4_therapeutic_modality.png'),
        fullPage: false
    });
    console.log('✓ Captured Therapeutic Modality tab');
    
    // Test Treatment by Condition - Androgenetic Alopecia
    const treatmentDropdown = page.locator('[data-tab="treatment"] .dropdown-item[data-tab="treatment-aga"]');
    await page.hover('[data-tab="treatment"]');
    await page.waitForTimeout(500);
    await treatmentDropdown.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ 
        path: path.join(screenshotsDir, '5_treatment_aga.png'),
        fullPage: false
    });
    console.log('✓ Captured Treatment - Androgenetic Alopecia');
    
    // Test Treatment - Alopecia Areata
    await page.hover('[data-tab="treatment"]');
    await page.waitForTimeout(500);
    await page.click('[data-tab="treatment-aa"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ 
        path: path.join(screenshotsDir, '6_treatment_aa.png'),
        fullPage: false
    });
    console.log('✓ Captured Treatment - Alopecia Areata');
    
    // Test Treatment - Lymphocytic Scarring Alopecia  
    await page.hover('[data-tab="treatment"]');
    await page.waitForTimeout(500);
    await page.click('[data-tab="treatment-lpp"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ 
        path: path.join(screenshotsDir, '7_treatment_lpp.png'),
        fullPage: false
    });
    console.log('✓ Captured Treatment - Lymphocytic Scarring Alopecia');
    
    // Test Patient Counseling tab
    await page.click('[data-tab="counseling"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ 
        path: path.join(screenshotsDir, '8_patient_counseling.png'),
        fullPage: false
    });
    console.log('✓ Captured Patient Counseling tab');
    
    // Test mobile viewport for one tab
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.click('[data-tab="classification"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ 
        path: path.join(screenshotsDir, '9_mobile_classification.png'),
        fullPage: false
    });
    console.log('✓ Captured Mobile view - Classification');
    
    await browser.close();
    console.log('✓ All screenshots captured successfully!');
    console.log(`Screenshots saved to: ${screenshotsDir}`);
}

// Run the screenshot capture
captureAlopeciaScreenshots().catch(console.error);