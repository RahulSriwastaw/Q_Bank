I will consolidate the shape selection and properties into a single unified panel to ensure a clean, "all-in-one" user experience.

### **Plan:**

1.  **Update `ShapePropertiesPanel.tsx`**:
    *   **Integrate Shape Selection**: I will move the shape selection buttons (Rectangle, Circle, Triangle, etc.) from the external vertical toolbar directly into the top of the `ShapePropertiesPanel`.
    *   **Layout**: The panel will now have:
        *   **Top**: A grid of shape icons to select the active shape.
        *   **Middle/Bottom**: The existing properties controls (Preview, Fill/Border toggles, Colors, Stroke, Opacity).
    *   This ensures that when you open the Shape menu, you can both *select* a shape and *configure* it in one place.

2.  **Update `BoardToolbar.tsx`**:
    *   **Remove Vertical Toolbar**: I will delete the code that renders the separate `ShapeToolbar` on the left side of the screen.
    *   **Simplify Logic**: Remove the specific click-outside logic for the separate toolbar, as everything will now be contained within the main toolbar's popover.

3.  **Cleanup**:
    *   (Optional) Delete `ShapeToolbar.tsx` if it's no longer used, or leave it for reference. I will focus on the integration first.

**Outcome**: Clicking the "Shapes" button on the main toolbar will open a single, comprehensive menu containing all shape options and settings, keeping the interface clean and "under" the parent tool as requested.