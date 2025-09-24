#!/usr/bin/env python3
"""
Script to test the Alopecia mind map application and capture screenshots
"""

import asyncio
from playwright.async_api import async_playwright
import os

async def test_alopecia_mindmap():
    """Test the Alopecia mind map application"""
    
    # File path to the HTML application
    html_path = "/Users/ramiefathy/Desktop/WebApps/apps/MindMaps/AlopeciaMindMaps/Alopecia/AlopeciaMindMaps_optimized_stable.html"
    file_url = f"file://{html_path}"
    
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            viewport={"width": 1440, "height": 900}
        )
        page = await context.new_page()
        
        print(f"Navigating to: {file_url}")
        await page.goto(file_url)
        
        # Wait for the application to load
        await page.wait_for_selector('#mind-map-container', timeout=10000)
        await asyncio.sleep(2)
        
        # Take screenshot of initial state (Diagnostic Approach tab)
        await page.screenshot(path="screenshots/alopecia_diagnostic_approach.png")
        print("✓ Captured Diagnostic Approach tab")
        
        # Test Classification tab
        await page.click('[data-tab="classification"]')
        await asyncio.sleep(2)
        await page.screenshot(path="screenshots/alopecia_classification.png")
        print("✓ Captured Classification tab")
        
        # Test Diagnostic Tools tab
        await page.click('[data-tab="tools"]')
        await asyncio.sleep(2)
        await page.screenshot(path="screenshots/alopecia_diagnostic_tools.png")
        print("✓ Captured Diagnostic Tools tab")
        
        # Test Therapeutic Modality tab
        await page.click('[data-tab="modality"]')
        await asyncio.sleep(2)
        await page.screenshot(path="screenshots/alopecia_therapeutic_modality.png")
        print("✓ Captured Therapeutic Modality tab")
        
        # Test Treatment by Condition - Androgenetic Alopecia
        await page.hover('[data-tab="treatment-aga"]')
        await page.click('[data-tab="treatment-aga"]')
        await asyncio.sleep(2)
        await page.screenshot(path="screenshots/alopecia_treatment_aga.png")
        print("✓ Captured Treatment - Androgenetic Alopecia")
        
        # Test Treatment by Condition - Alopecia Areata
        await page.hover('.dropdown')
        await page.click('[data-tab="treatment-aa"]')
        await asyncio.sleep(2)
        await page.screenshot(path="screenshots/alopecia_treatment_aa.png")
        print("✓ Captured Treatment - Alopecia Areata")
        
        # Test Treatment by Condition - Lymphocytic Scarring Alopecia
        await page.hover('.dropdown')
        await page.click('[data-tab="treatment-lpp"]')
        await asyncio.sleep(2)
        await page.screenshot(path="screenshots/alopecia_treatment_lpp.png")
        print("✓ Captured Treatment - Lymphocytic Scarring Alopecia")
        
        # Test Patient Counseling tab
        await page.click('[data-tab="counseling"]')
        await asyncio.sleep(2)
        await page.screenshot(path="screenshots/alopecia_patient_counseling.png")
        print("✓ Captured Patient Counseling tab")
        
        # Test mobile viewport
        await page.set_viewport_size({"width": 375, "height": 667})
        await asyncio.sleep(1)
        await page.screenshot(path="screenshots/alopecia_mobile_view.png")
        print("✓ Captured Mobile view")
        
        await browser.close()
        print("✓ All screenshots captured successfully!")

if __name__ == "__main__":
    asyncio.run(test_alopecia_mindmap())