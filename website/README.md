# MCP-Obsidian Website

🌐 **Live Site**: [mcp-obsidian.org](https://mcp-obsidian.org)

This is the official landing page and documentation website for [MCP-Obsidian](https://github.com/bitbonsai/mcp-obsidian) - a Model Context Protocol (MCP) server that enables AI assistants like Claude to interact securely and intelligently with Obsidian vaults.

## 🎯 Project Objective

This website serves to:

- **Showcase MCP-Obsidian**: Demonstrate the capabilities and benefits of connecting AI assistants to Obsidian
- **Provide Installation Guide**: Clear, step-by-step instructions for setting up MCP-Obsidian
- **Interactive Demo**: Live demonstrations of AI-powered note management
- **Documentation Hub**: Comprehensive guides, examples, and best practices
- **Community Resource**: Links to support, contributions, and discussions

## ✨ Features

- **Modern Design**: Beautiful, responsive interface built with Astro and Tailwind CSS
- **Interactive Demo**: Live terminal simulation showing AI-Obsidian interactions
- **Code Examples**: Syntax-highlighted configuration examples
- **Feature Comparison**: Clear comparison tables showing MCP-Obsidian advantages
- **Dark/Light Theme**: Automatic theme switching with system preferences
- **Performance Optimized**: Static site generation for fast loading

## 🛠️ Tech Stack

- **Framework**: [Astro](https://astro.build/) - Static site generation with component islands
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **Interactive Components**: [React](https://react.dev/) - For dynamic UI elements
- **Icons**: [Lucide React](https://lucide.dev/) - Beautiful, customizable icons
- **Code Highlighting**: [Shiki](https://shiki.style/) - Syntax highlighting
- **Runtime**: [Bun](https://bun.sh/) - Fast JavaScript runtime and package manager

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) runtime installed
- Node.js 18+ (for compatibility)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/bitbonsai/mcp-obsidian.org.git
   cd mcp-obsidian.org
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Start development server**:
   ```bash
   bun run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:4321`

### Build Commands

```bash
# Start development server with hot reload
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Type checking
bun run astro check
```

## 📁 Project Structure

```
src/
   components/          # Reusable UI components
      Hero.astro      # Main hero section
      Terminal.astro  # Installation terminal
      FeatureGrid.astro # Features showcase
      InteractiveDemo.tsx # Live demo component
      CodeExample.astro # Syntax-highlighted examples
      ...
   layouts/
      Layout.astro    # Base layout template
   pages/
      index.astro     # Homepage
      about.astro     # About page
   styles/             # Global styles
```

## 🔧 Development

### Adding New Components

1. Create component in `src/components/`
2. Use Astro for static content, React for interactivity
3. Follow existing naming conventions
4. Import and use in pages or other components

### Styling Guidelines

- Use Tailwind CSS utility classes
- Follow existing color scheme and spacing
- Responsive design with mobile-first approach
- Dark/light theme support using CSS custom properties

### Code Style

- TypeScript for type safety
- Prettier for formatting
- Component-scoped styles when needed
- Semantic HTML structure

## 🌐 Deployment

This site is configured for static deployment and can be hosted on:

- **Vercel** (recommended)
- **Netlify**
- **GitHub Pages**
- **Cloudflare Pages**
- Any static hosting service

The build output is generated in the `dist/` directory.

## 🤝 Contributing

Contributions are welcome! Please feel free to:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Follow the development guidelines
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Contribution Guidelines

- Ensure responsive design across all devices
- Test your changes thoroughly
- Follow existing code style and conventions
- Update documentation if needed
- Add meaningful commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- **[MCP-Obsidian](https://github.com/bitbonsai/mcp-obsidian)**: The main MCP server implementation
- **[Model Context Protocol](https://modelcontextprotocol.io)**: Protocol specification and tools
- **[Obsidian](https://obsidian.md/)**: The knowledge management app

## 💬 Support & Community

- **Issues**: [GitHub Issues](https://github.com/bitbonsai/mcp-obsidian/issues)
- **Discussions**: [GitHub Discussions](https://github.com/bitbonsai/mcp-obsidian/discussions)
- **Author**: [@bitbonsai](https://github.com/bitbonsai)

---

<div align="center">

**[Visit Live Site](https://mcp-obsidian.org)** • **[View Source](https://github.com/bitbonsai/mcp-obsidian)**

Made with ❤️ for the Obsidian community

</div>