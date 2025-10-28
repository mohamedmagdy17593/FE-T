## 🖥️ Demo

View the live demo or try it out here:
[https://fe-t.vercel.app/](https://fe-t.vercel.app/)

# HVAC Component Grid Builder

A modern React-based drag-and-drop application for designing HVAC (Heating, Ventilation, and Air Conditioning) systems. Users can drag building components like lights, air supply units, air return units, and smoke detectors onto a grid canvas to create system layouts.

## 🛠️ Tools & Technologies

### Core Framework

- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server

### UI & Styling

- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - Modern component library built on Radix UI
- **Radix UI** - Accessible, unstyled UI primitives
- **Lucide React** - Beautiful icon library
- **React Icons** - Additional icon collections

### State Management

- **Zustand** - Lightweight state management

### Drag & Drop

- **@dnd-kit/core** - Modern drag and drop toolkit for React

### Development Tools

- **ESLint** - Code linting with TypeScript support
- **TypeScript ESLint** - TypeScript-specific linting rules
- **React Plugin ESLint** - React-specific linting rules

### Utilities

- **class-variance-authority** - Class name utilities
- **clsx** - Conditional class name utility
- **tailwind-merge** - Tailwind class merging utility

## 🚀 Installation Guide

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd fe-t
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` (default Vite port)

## 📜 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run lint` - Run ESLint for code quality checks
- `npm run preview` - Preview production build locally

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── Canvas.tsx      # Main grid canvas component
│   ├── Sidebar.tsx     # Component palette sidebar
│   └── Nav.tsx         # Navigation header
├── lib/                # Utilities and constants
│   ├── types.ts        # TypeScript type definitions
│   ├── constants.ts    # Application constants
│   ├── utils.ts        # Helper functions
│   └── componentUtils.tsx # Component-specific utilities
├── store/              # State management
│   └── gridStore.ts    # Zustand store for grid state
└── assets/             # Static assets
```

## ✨ Features

### Core Functionality

- **Drag & Drop Interface** - Intuitive component placement using @dnd-kit
- **Grid-Based Canvas** - Precise component positioning on a configurable grid
- **Component Library** - Pre-built HVAC components:
  - 💡 Light fixtures
  - 🌬️ Air supply units
  - 🔄 Air return units
  - 🚨 Smoke detectors

### Technical Features

- **Type-Safe Development** - Full TypeScript support
- **Responsive Design** - Works on different screen sizes
- **Modern React Patterns** - Hooks, refs, and concurrent features
- **Performance Optimized** - Fast builds with Vite and optimized bundling

### Developer Experience

- **Hot Module Replacement** - Instant updates during development
- **ESLint Integration** - Code quality and consistency
- **Path Aliases** - Clean imports with `@/` prefix
- **Component Architecture** - Modular, reusable components

## 🎯 Component Types

The application supports four main HVAC component types:

- **Light** - Lighting fixtures and controls
- **Air Supply** - Air supply vents and units
- **Air Return** - Air return grilles and systems
- **Smoke Detector** - Fire safety and detection devices

Each component is visually distinct with unique colors and icons for easy identification.

## 🔧 Configuration

### Tailwind CSS

The project uses Tailwind CSS 4 with custom configuration:

- Base color: Zinc
- CSS variables for theming
- Custom component styles

### ESLint Configuration

- TypeScript-aware linting
- React-specific rules
- Custom formatting preferences

## 🚀 Deployment

1. **Build for production**

   ```bash
   npm run build
   ```

2. **Preview production build**

   ```bash
   npm run preview
   ```

3. **Deploy the `dist` folder** to your hosting provider (Netlify, Vercel, etc.)
