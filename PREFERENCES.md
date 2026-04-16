# Project Preferences & Coding Standards

## General Style
- **Theme**: Always Light Mode.
- **Background**: Light backgrounds only (ignore system/dark mode defaults).
- **Aesthetics**: Premium, clean, statistical, modern (use Lucide icons, Shadcn UI).

## Localization & Formatting
- **Currency**: Argentine Pesos ($) with no decimals. Use format: $ 1.500.
- **Date & Time**: Argentine format (DD/MM/YYYY HH:mm).
- **Text Inputs**: Auto-capitalize the first letter (except for emails).

## UX & Feedback
- **Button Feedback**: 
    - Always show a loading state (spinner/disabled).
    - Success state: Change color to green, show check icon, and update text.
    - Notifications: Always trigger a Sonner Toast for confirmation/error.

## Code Quality & Architecture (IMPORTANT)
- **Modularization**: Avoid monolithic files. If a component exceeds 150 lines, split it into smaller sub-components.
- **Clean Code**: Use descriptive variable names. Follow the Single Responsibility Principle (SRP).
- **Comments**: Every function, Server Action, or complex logic block must have a clear, concise comment explaining its purpose.
- **Custom Hooks**: Extract complex logic (state, effects, API calls) into custom hooks to keep components focused on the UI.
- **Structure**: Prefer composition over deep nesting.