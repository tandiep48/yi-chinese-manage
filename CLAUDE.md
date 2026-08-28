# Project Overview

E-learning platform focused on Chinese language education.
**Important Architecture Note:** This project is currently transitioning a Flask/Jinja frontend in **Learning/template & Learning/static** folder to a seperate Next.js frontend.

# Tech Stack

- **Backend:** Python (Flask)
- **Frontend:** Next.js, React, Node.js, Tailwind CSS
- **Database:** PostgreSQL (using SQLAlchemy ORM for queries)

# Global Execution Rules

Strictly adhere to the following workflow, coding, and communication constraints:

## 1. Pre-Execution & Strategy (Think Before Doing)

Do not blindly write code. Analyze the request and ask for clarification if you are unsure about:

- **1.1 Feature Intent:** What exactly the requested feature is supposed to achieve.
- **1.2 Implementation:** The technical strategy for executing the feature.
- **1.3 Duplication/Conflicts:** If the new feature seems to already exist or conflicts with existing functionality in the codebase.
- **1.4 Dependencies:** If the implementation requires third-party services, manual human setup, or paid subscriptions.

## 2. Coding Standards & Output

- **2.1 No Conversational Filler:** Output only the code. Do not explain every action, provide summaries for each item, or narrate your thought process. Only provide explanations if explicitly asked to do so.
- **2.2 Performance & Readability:** Ensure the code is highly performant and readable for human review.
- **2.3 Automated Testing:** Always write test cases for new features.
- **2.4 Housekeeping:** Clean up unneeded items, dead code, and unused imports within the specific folder you are working on.

## 3. Git & Version Control Constraints

- **3.1 Backend Branch:** All work in the `Learning/` folder must be done on the `dev` branch.
- **3.2 Frontend Branch:** All work in the `yi-chinese-manage/` folder must be done on the `dev` branch.
- **3.3 Pull Requests:** Only pull the latest code on these branches when explicitly instructed by the user.
- **3.4 No Committing:** Do not commit code after completing a task. Keep the changes uncommitted so the user can review the results first.

## 4. UI/UX, Color, and Layout Standards (Tailwind CSS)

When working in the `yi-chinese-manage` Next.js frontend, strictly follow these design rules:

- **4.1 Centralized Theming:** Utilize `global.css` and the `tailwind.config.ts` file for all primary color definitions. Avoid using hardcoded hex codes or arbitrary Tailwind values (e.g., `bg-[#1a2b3c]`) in standard components.
- **4.2 Component Spacing & Layout:** Use standardized Tailwind spacing (e.g., `p-4`, `m-2`, `gap-4`). Rely on CSS Grid (`grid`, `grid-cols-*`) for structural page layouts and Flexbox (`flex`, `items-center`, `justify-between`) for component-level alignment.
- **4.3 Responsive Design:** Implement a mobile-first approach. Use Tailwind's default breakpoints (`sm:`, `md:`, `lg:`, `xl:`) to ensure tables, forms, and sidebars collapse or stack appropriately on smaller screens.
- **4.4 UI Consistency:** Re-use standard components from the `components/ui/` folder (e.g., `Badge`, `Modal`, `Toast`, `Pagination`) instead of rebuilding native HTML elements to ensure a unified look across the dashboard.
- **4.5 Loading & Empty States:** Utilize `SkeletonRow.tsx` for loading states in tables and ensure clear, accessible empty states when queries return no data.

# Project Structure

```text
yi-chinese-manage/
├── app/
│   ├── passage/
│   │   └── page.tsx
│   ├── vocab/
│   │   └── page.tsx
│   ├── global.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   ├── passage/
│   │   ├── LineEditor.tsx
│   │   ├── PassageForm.tsx
│   │   └── PassageTable.tsx
│   ├── ui/
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Pagination.tsx
│   │   ├── SkeletonRow.tsx
│   │   └── Toast.tsx
│   └── vocab/
│       ├── VocabForm.tsx
│       └── VocabTable.tsx
├── ├── shared/
├── hooks/
│   ├── usePassage.tsx
│   └── useVocab.tsx
└── lib/
    ├── api.tsx
    └── type.tsx
```
