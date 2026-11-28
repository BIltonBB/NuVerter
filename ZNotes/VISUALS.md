nuVerter — Major UI/UX & Application Structure Overhaul

1. Main Navigation & Application Categories

Reorganize the existing main navigation into several larger, distinct categories instead of displaying every individual tool directly in the main navigation.

The idea is to make nuVerter feel like multiple smaller applications integrated into one unified application.

For example (illustrative, research and propose the actual categories first):

- All — Access to every available tool.
- AI — AI-related tools and functionality.
- Media — Video, audio, image, and other media-related tools.
- Documents — Document conversion and processing.
- Other categories — Determine appropriate groupings based on the existing tools.

Requirements:

- Audit all existing tools and their functionality before deciding on the final category structure.
- Group tools logically according to their actual purpose.
- Avoid unnecessary categories and excessive navigation items.
- Keep the main navigation clean, compact, and easy to understand.
- Every existing tool must remain accessible unless explicitly approved for removal.
- The All category should provide access to the complete tool collection.

Treat each category as its own mini-application within nuVerter, rather than simply another filter on a crowded tools page.

2. Application Launch Experience & Category Selection

Create a dedicated category-selection interface that appears when a user first opens or launches nuVerter.

The selection interface should:

- Appear above the existing application UI as an overlay.
- Cover the main interface while allowing the background to remain subtly visible.
- Use a modern, attractive blurred background with appropriate depth and visual effects.
- Present the available categories as large, visually appealing cards.
- Use approximately three prominent cards per initial view, or another layout if research suggests a better solution.
- Include category names, short descriptions, and appropriate visual identifiers.
- Match nuVerter's existing design language rather than looking like an unrelated application.

The experience should feel like choosing which application environment to enter.

Reopening the selector

Add an accessible tab or navigation control that allows users to reopen the category selector at any time.

This should let users switch between application categories without needing to reload the website.

When switching categories:

- Update the displayed tools and relevant navigation.
- Preserve the unified application experience.
- Avoid unnecessary full-page reloads.
- Ensure the selection interface can be opened and dismissed reliably.

Research modern application launchers and workspace selectors for design inspiration before implementation.

3. Overall Visual Overhaul

A broader visual overhaul of nuVerter is permitted and encouraged.

The existing design does not need to be preserved exactly. Improve the overall visual hierarchy, consistency, and usability where appropriate.

Focus on:

- More deliberate spacing and alignment.
- Better component hierarchy.
- Consistent typography.
- More polished buttons, cards, panels, and navigation.
- Modern transitions and subtle animations.
- Improved responsiveness.
- Consistent visual language across all tools.

However:

- Do not redesign things randomly just for the sake of changing them.
- Maintain a coherent design system.
- Avoid unnecessary visual effects that negatively affect performance.
- Preserve existing functionality and useful workflows.
- Prioritize usability over decoration.

4. Video Editor UI — Major Rework

The video editor needs particular attention.

Its current layout has a problem with the timeline not feeling like the primary interface element.

The timeline should be one of the central visual and functional components of the editor, not something that gets pushed down or visually subordinated by collapsible dropdowns and surrounding panels.

Required improvements

- Rework the overall video editor layout.
- Make the timeline a prominent, central workspace.
- Give the timeline sufficient screen space.
- Prevent collapsible panels, dropdowns, and secondary controls from unnecessarily pushing the timeline down.
- Reconsider how panels are positioned and how they expand or collapse.
- Keep essential editing controls accessible.
- Make the preview, timeline, and editing controls feel like parts of one cohesive editor.
- Ensure the layout works at different screen sizes.

Research professional video-editing applications and their workspace layouts for inspiration.

Do not blindly copy another editor. Identify what makes their timeline-centered workflows effective and adapt those principles to nuVerter.

The result should feel like a proper video editor rather than a collection of controls placed around a timeline.

5. Native UI Elements — Custom Components Only

Remove native browser UI elements and replace them with custom-designed components.

The intended direction is a consistent, fully customized interface that matches nuVerter's design system.

Examples include:

- Custom dropdowns.
- Custom selection menus.
- Custom dialogs and confirmation windows.
- Custom tooltips.
- Custom context menus.
- Custom switches and controls.
- Custom file-selection interfaces where technically feasible.

Important:

- Do not sacrifice accessibility or keyboard navigation.
- Maintain proper focus handling.
- Support appropriate keyboard interactions.
- Ensure custom components behave consistently across browsers.

Clarification required before implementation: The original instruction says "REMOVE ALL NATIVE GOOGLES, CUSTOM ONLY." This may refer to native toggles, Google-related UI elements, or something else. Do not guess what "GOOGLES" means. Ask me to clarify before making changes related to this particular requirement.

6. NSIS Installer — Custom Design

The NSIS setup/installer also needs a custom visual design.

Do not leave the installer looking like a default NSIS installation wizard.

Requirements:

- Create a custom-designed installer interface.
- Match the visual identity and design language of nuVerter.
- Use consistent typography, colors, spacing, and visual elements.
- Improve the presentation of installation progress and available options.
- Make the installer feel like an intentional part of the nuVerter application.

Research the available NSIS customization capabilities before deciding how to implement the design.

Do not compromise installation reliability, uninstallation, update compatibility, or existing installation behavior just to achieve a custom appearance.

7. Tool Organization — Utilities Must Not Appear in Main Navigation

Remove all individual tools currently categorized under Utilities from the main navigation.

They should not appear as individual main navigation entries anymore.

However:

- Do not automatically delete the tools.
- Determine where they belong within the new category structure.
- Preserve their accessibility through the appropriate category or All view.
- Avoid leaving orphaned tools or broken navigation references.

The goal is to reduce clutter, not remove functionality.

8. Research & Clarification Before Implementation

ASK / RESEARCH BEFORE MAKING ASSUMPTIONS.

This is a substantial application-wide redesign. Do not immediately start modifying files based on assumptions.

Before implementation:

1. Audit the current nuVerter architecture, existing navigation, tool inventory, and design system.
2. Research modern multi-tool applications, application launchers, workspace selectors, and professional video-editor layouts.
3. Evaluate possible category structures based on the actual tools available.
4. Identify the best technical approach for the category selector and navigation changes.
5. Identify potential compatibility issues with the existing application.
6. Present your proposed category structure, UI direction, and implementation plan to me.
7. Ask questions about ambiguous requirements before proceeding.

Do not ask unnecessary questions about details you can determine by inspecting the codebase or conducting research.

9. Implementation Constraints

- Preserve existing tool functionality.
- Avoid breaking existing routes, APIs, and integrations.
- Avoid unnecessary dependencies.
- Follow the existing project architecture unless there is a justified reason to change it.
- Do not introduce placeholder functionality in place of working features.
- Avoid duplicating components or creating unnecessary parallel implementations.
- Ensure the website remains responsive.
- Test affected functionality after implementation.
- Test the NSIS installer separately from the website.
- Keep changes maintainable and consistent with the rest of the codebase.

Overall Design Direction

The intended result is a more polished, modern nuVerter that feels like a unified platform containing several distinct applications.

The category-selection experience should establish the application's identity, the navigation should remain uncluttered, and individual tools should feel purpose-built rather than squeezed into one enormous interface.

Prioritize architecture, usability, and visual quality together. Do not treat this as merely a cosmetic redesign.

"Origin message:
Make the categories in the main nav into multiple big categories so the web doesn't get cluttered like(Like ex:1.All (current?),2.AI,3.etc. Think of these as seperate apps but within one application). Make it appear when you first open the app/launch web as like covering over the UI with cool blur background with 3 cards or wtv. Modern design like the web itself. And tab reopens it so you can pick again. Do major visuals overhaul to the rest if you want. Mainly video editor UI needs some kind of reworking like the timeline main UI just isn't main if it's like being affected by those collapsible drop downs and being brought down. REMOVE ALL NATIVE GOOGLES, CUSTOM ONLY. NSIS SETUP NEEDS TO BE CUSTOM TOO
And uh dont include any tools from utilities to main nav anymore ASK/RESEARCH"