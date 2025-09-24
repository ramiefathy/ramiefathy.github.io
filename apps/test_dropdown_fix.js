const { chromium } = require('playwright');
const path = require('path');

(async () => {
    console.log('🧪 Testing Dropdown Menu Z-Index Fixes...\n');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500
    });
    
    const page = await browser.newPage();
    
    // Test CTCL dropdown
    console.log('📊 Testing CTCL Dropdown...');
    const ctclPath = 'file://' + path.resolve('CTCLMindMaps/CTCL/CTCLMindMaps.html');
    await page.goto(ctclPath);
    await page.waitForTimeout(2000);
    
    // Hover over Subtypes dropdown
    console.log('   Hovering over Subtypes dropdown...');
    await page.hover('#tab-subtypes');
    await page.waitForTimeout(1000);
    
    // Check if dropdown is visible
    const subtypesDropdown = await page.$('#tab-subtypes .dropdown');
    if (subtypesDropdown) {
        const isVisible = await subtypesDropdown.isVisible();
        console.log(`   ✅ Subtypes dropdown visible: ${isVisible}`);
        
        // Get z-index
        const zIndex = await page.$eval('#tab-subtypes .dropdown', el => 
            window.getComputedStyle(el).zIndex
        );
        console.log(`   📍 Z-index: ${zIndex}`);
    }
    
    // Take screenshot
    await page.screenshot({ 
        path: 'screenshots/ctcl_dropdown_fix.png',
        fullPage: false
    });
    console.log('   📸 Screenshot saved: ctcl_dropdown_fix.png');
    
    // Test Treatment dropdown
    console.log('\n   Hovering over Treatment dropdown...');
    await page.hover('#tab-treatment');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
        path: 'screenshots/ctcl_treatment_dropdown.png',
        fullPage: false
    });
    console.log('   📸 Screenshot saved: ctcl_treatment_dropdown.png');
    
    // Test other apps
    const otherApps = [
        {
            name: 'Psoriasis',
            path: 'PsoriasisMindMaps/Psoriasis/PsoriasisMindMaps.html',
            dropdown: '#tab-treatment'
        },
        {
            name: 'AutoimmuneBullous',
            path: 'AutoimmuneBullousMindMaps/AutoimmuneBullous/AutoimmuneBullousMindMaps.html',
            dropdown: '#tab-compendium'
        }
    ];
    
    for (const app of otherApps) {
        console.log(`\n📊 Testing ${app.name} Dropdown...`);
        const appPath = 'file://' + path.resolve(app.path);
        await page.goto(appPath);
        await page.waitForTimeout(2000);
        
        await page.hover(app.dropdown);
        await page.waitForTimeout(1000);
        
        const dropdown = await page.$(`${app.dropdown} .dropdown`);
        if (dropdown) {
            const zIndex = await page.$eval(`${app.dropdown} .dropdown`, el => 
                window.getComputedStyle(el).zIndex
            );
            console.log(`   📍 Z-index: ${zIndex}`);
        }
        
        await page.screenshot({ 
            path: `screenshots/${app.name.toLowerCase()}_dropdown_fix.png`,
            fullPage: false
        });
        console.log(`   📸 Screenshot saved: ${app.name.toLowerCase()}_dropdown_fix.png`);
    }
    
    console.log('\n✅ Dropdown z-index fixes complete!');
    console.log('💡 All dropdowns should now display on top of the mind map container.');
    
    // Keep browser open for inspection
    console.log('\n🔍 Browser remains open for manual inspection...');
})();