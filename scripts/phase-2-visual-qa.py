from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3100"
VIEWPORTS = [360, 390, 768, 1024, 1280, 1440]
PUBLIC_PATHS = [
    "/",
    "/find-charger",
    "/how-to-charge",
    "/connector-guide",
    "/insights",
    "/about",
    "/contact",
    "/support",
    "/safety",
    "/pricing",
    "/solutions/fleets",
    "/solutions/workplace",
    "/host-a-charger",
    "/legal/privacy",
    "/legal/terms",
    "/legal/refunds",
    "/legal/grievance",
    "/legal/accessibility",
]
issues: list[str] = []


def check_overflow(page, width: int, path: str) -> None:
    metrics = page.evaluate(
        """() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          h1: document.querySelectorAll('h1').length
        })"""
    )
    if metrics["scrollWidth"] > metrics["clientWidth"] + 1:
        issues.append(
            f"horizontal scroll at {width}px on {path}: "
            f"{metrics['scrollWidth']} > {metrics['clientWidth']}"
        )
    if metrics["h1"] != 1:
        issues.append(f"{path} at {width}px has {metrics['h1']} h1s")
    if page.locator("header.header").count() == 0:
        issues.append(f"missing header at {width}px on {path}")
    if page.locator("main#main-content").count() == 0:
        issues.append(f"missing main at {width}px on {path}")


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        headless=True,
        executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    )
    for width in VIEWPORTS:
        page = browser.new_page(viewport={"width": width, "height": 900})
        for path in PUBLIC_PATHS:
            page.goto(f"{BASE}{path}", wait_until="networkidle")
            check_overflow(page, width, path)

            if path == "/find-charger":
                body = page.inner_text("body")
                if "Phase 5 will replace" in body:
                    issues.append("temporary Phase 5 copy still on /find-charger")
                if page.get_by_role("link", name="Start charging", exact=True).count() or page.get_by_role("button", name="Start charging", exact=True).count():
                    issues.append("booking/start-charging CTA appeared on /find-charger")
                if page.get_by_role("link", name="Book a bay", exact=True).count() or page.get_by_role("button", name="Book a bay", exact=True).count():
                    issues.append("booking/start-charging CTA appeared on /find-charger")
                if page.get_by_label("Search published stations").count() == 0:
                    issues.append("finder search field missing")
                if width >= 1024:
                    if "Map display is unavailable" not in body and page.locator(".finder-map-canvas").count() == 0:
                        issues.append("finder has neither map nor unavailable message")

            if path == "/how-to-charge":
                if page.get_by_role("link", name="Start charging", exact=True).count() or page.get_by_role("button", name="Start charging", exact=True).count():
                    issues.append("how-to-charge offered a Start charging control")
                if page.get_by_role("heading", level=1).count() != 1:
                    issues.append("how-to-charge h1 count")

            if path == "/pricing":
                if page.get_by_label("Energy to add (kWh)").count() == 0:
                    issues.append("pricing calculator energy field missing")
                body = page.inner_text("body").lower()
                if "exact cost" in body and "not an exact cost" not in body:
                    issues.append("pricing page claimed exact cost")

            if path == "/insights":
                if "No published articles yet" not in page.inner_text("body") and page.locator(".learn-list").count() == 0:
                    issues.append("insights index missing empty state or list")

        sitemap = page.request.get(f"{BASE}/sitemap.xml").text()
        if "/design-system" in sitemap:
            issues.append("design-system appeared in sitemap")
        if "/admin" in sitemap:
            issues.append("admin appeared in sitemap")
        if "/how-to-charge" not in sitemap:
            issues.append("how-to-charge missing from sitemap")
        robots = page.request.get(f"{BASE}/robots.txt").text()
        if "design-system" not in robots:
            issues.append("robots.txt does not disallow design-system")

        if width <= 768:
            page.goto(f"{BASE}/", wait_until="networkidle")
            page.get_by_role("button", name="Open menu").click()
            page.get_by_role("dialog", name="Menu").wait_for()
            if page.get_by_role("link", name="Design system").count():
                issues.append("design-system link appeared in public nav")
            page.get_by_role("dialog", name="Menu").get_by_role(
                "button", name="Close menu"
            ).click()
            page.get_by_role("dialog", name="Menu").wait_for(state="hidden")

            page.get_by_role("button", name="Open menu").click()
            page.get_by_role("dialog", name="Menu").wait_for()
            page.keyboard.press("Escape")
            page.get_by_role("dialog", name="Menu").wait_for(state="hidden")

        if width == 360:
            page.goto(f"{BASE}/", wait_until="networkidle")
            faq = page.get_by_role("button", name="What will charging cost?")
            faq.focus()
            page.keyboard.press("Enter")
            if not faq.get_attribute("aria-expanded") == "true":
                issues.append("accordion did not expand from keyboard")
            page.goto(f"{BASE}/pricing", wait_until="networkidle")
            energy = page.get_by_label("Energy to add (kWh)")
            energy.focus()
            energy.fill("-1")
            page.get_by_role("button", name="Look up approved tariff").click()
            if page.get_by_text("Energy must be between").count() == 0 and page.get_by_text("Enter energy in kWh").count() == 0:
                issues.append("pricing calculator did not show energy validation")
            page.screenshot(path="/tmp/png-qa-360-pricing.png", full_page=True)

            page.goto(f"{BASE}/how-to-charge", wait_until="networkidle")
            howto_faq = page.get_by_role("button", name="Can I start charging with a QR code on this site?")
            howto_faq.focus()
            page.keyboard.press("Enter")
            if not howto_faq.get_attribute("aria-expanded") == "true":
                issues.append("how-to-charge accordion did not expand from keyboard")
            page.screenshot(path="/tmp/png-qa-360-how-to-charge.png", full_page=True)

            page.goto(f"{BASE}/contact", wait_until="networkidle")
            page.get_by_role("button", name="Send enquiry").click()
            if page.get_by_text("Please correct the highlighted fields.").count() == 0:
                issues.append("contact form did not show accessible validation")
            page.screenshot(path="/tmp/png-qa-360-contact.png", full_page=True)

        if width == 1280:
            page.goto(f"{BASE}/", wait_until="networkidle")
            page.screenshot(path="/tmp/png-qa-1280-home.png", full_page=True)
            page.goto(f"{BASE}/pricing", wait_until="networkidle")
            page.screenshot(path="/tmp/png-qa-1280-pricing.png", full_page=True)

        page.close()
    browser.close()

if issues:
    print("FAIL")
    print("\n".join(issues))
    raise SystemExit(1)

print("PASS Phase 6 viewport, h1, landmark, menu, form, accordion, finder, guides, and SEO checks")
