# Gemini Agent Master Workflow

**CRITICAL DIRECTIVE:** This project uses a modular AI skill system. Before writing code, planning, or modifying files, you MUST check the `.gemini/skills/` and `.gemini/extensions/` directories for relevant guidelines. Do not rely on your base training data for architectural or design decisions.

## Your Standard Operating Procedure:

1. **Analyze the Request:** Determine what the user is asking for (e.g., UI design, routing, state management, animations).
2. **Search for Skills:** Use the `glob` tool to list all markdown files inside the `.gemini/skills/` directory, as well as any `SKILL.md` files located in the `.gemini/extensions/` directory tree.
3. **Read Relevant Context:** Read the specific `.md` files that apply to the current task.
   - _Example: If the task involves routing, read `nextjs-react19-core.md`._
   - _Example: If the task involves UI animations, read the Framer Motion `SKILL.md` file from the extensions folder._
4. **Follow Secondary Directives:** If a skill file instructs you to read local documentation (e.g., inside `node_modules/next/dist/docs/`), you must do so before writing code.
5. **Execute:** Complete the user's request strictly adhering to the rules you just loaded.

## Global Fallback Rules:

- Always prioritize local documentation over your training data.
- If you are unsure which skill applies, use the `ask_user` tool to clarify before proceeding.

## Global Project Context

- **Project:** High-end e-commerce storefront for luxury perfumery, pure attar oils, and artisanal fragrances.
- **Core Stack:** Next.js 16, React 19, Tailwind CSS v4, Framer Motion v12.
- **Constraint:** Do not suggest or write code using older paradigms (like React 18 `useMemo` caching or Tailwind v3 syntax) even in your initial planning phases.
