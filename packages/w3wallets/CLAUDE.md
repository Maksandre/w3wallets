# Playwright test rules

<waiting>
- If you need to wait, prefer to wait for some effect – for example, a visible or hidden UI element.
- It's okay to wait for API calls - use `page.waitForResponse`, `page.waitForRequest` if there are no reliable UI elements to await.
- Use `page.waitForTimeout` only during debugging or if you have no idea how to avoid it.
</waiting>
