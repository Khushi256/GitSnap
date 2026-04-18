# GitSnap

GitSnap is a high-performance GitHub profile visualization dashboard designed to transform raw developer activity data into meaningful, data-driven narratives. By leveraging custom SVG charts, real-time analytics, and immersive WebGL backgrounds, it provides recruiters and developers with a comprehensive overview of engineering impact, technical evolution, and open-source contributions.

## Project Overview

GitSnap aims to bridge the gap between complex GitHub event streams and human-readable insights. It allows users to enter any GitHub username and instantly generate a curated gallery of their coding journey. The dashboard is optimized for recruiter analytics, highlighting key signals such as consistent contribution patterns, technical stack maturation, and community engagement.

## Key Features

- **Immersive Shader Backgrounds**: Custom WebGL/GLSL shader backgrounds powered by Three.js for a premium, dynamic visual experience.
- **Responsive Contribution Heatmap**: A custom-built SVG visualization of activity intensity over the past year, optimized for all screen sizes.
- **Tech Stack Evolution Timeline**: A longitudinal analysis of language usage, tracking how a developer's toolkit has evolved over time.
- **Open Source Footprint**: A detailed breakdown of contributions to external repositories, distinguishing between personal projects and community impact.
- **Work Schedule Analysis**: Statistical visualization of weekday versus weekend activity, providing insights into a developer's consistent work-style.
- **Technical Breakdown**: Automated analysis of repository distributions, language proficiency, and activity types (Commits, Pull Requests, Issues).
- **Premium Dark Aesthetic**: A high-contrast, modern interface designed for visual excellence and professional presentation.

## Technical Architecture

The application is built using a modern, type-safe stack designed for speed and reliability:

- **Framework**: Vite + React 19 (SPA)
- **Styling**: Tailwind CSS 4 with custom animations
- **Graphics**: Three.js & Custom GLSL Shaders
- **Routing**: TanStack Router (File-based routing)
- **Data Fetching**: TanStack Query
- **Visualization**: Recharts and custom SVG implementations
- **Icons**: Lucide React
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- [Bun](https://bun.sh/) (Recommended) or NPM

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/gitsnap.git
   ```

2. Install dependencies:

   ```bash
   bun install
   # or
   npm install
   ```

3. Start the development server:

   ```bash
   bun run dev
   # or
   npm run dev
   ```

4. Build for production:
   ```bash
   bun run build
   # or
   npm run build
   ```

## Project Structure

- `/src/components`: Reusable UI components, specialized chart modules, and shader backgrounds.
- `/src/routes`: File-based routing system and page-level logic.
- `/src/lib`: Utility functions and data transformation logic.
- `/src/hooks`: Custom React hooks for data fetching and state management.
- `/public`: Static assets including logos and global styles.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
