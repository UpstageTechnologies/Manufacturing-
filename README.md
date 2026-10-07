# React + Vite

## Demo access and roles

The application starts with a CEO account:

- Email: `ceo@manufacture.local`
- Password: `CEO@123`

Sign in as CEO and use **Account Management** to create Manager and Accountant accounts. Public registration is disabled. Manager access is limited to the dashboard, inventory, attendance, and salary; Accountant access includes detailed accounting pages, with sensitive income and expense amounts masked. Company-wide financial summaries are shown only to the CEO.

This project currently stores accounts, credentials, and ERP data in browser local storage. It is suitable for a local demo, not production authentication; production use requires server-side authentication, authorization, and protected credential storage.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
