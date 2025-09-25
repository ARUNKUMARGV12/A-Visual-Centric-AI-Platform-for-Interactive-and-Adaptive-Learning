/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light Theme
        light: {
          bg: "#FFFFFF",
          sidebar: "#F8F9FA",
          border: "#E5E7EB",
          card: "#FFFFFF",
          text: {
            primary: "#1F2937",
            secondary: "#6B7280",
            accent: "#374151",
          },
          accent: {
            primary: "#10B981", // Green
            secondary: "#F59E0B", // Amber
            success: "#059669",
            error: "#DC2626",
            warning: "#D97706",
          }
        },
        // Dark Theme
        dark: {
          bg: "#000000",
          sidebar: "#000000",
          border: "#334155",
          card: "#1E293B",
          text: {
            primary: "#F1F5F9",
            secondary: "#94A3B8",
            accent: "#CBD5E1",
          },
          accent: {
            primary: "#2da69b", // Cyan
            secondary: "#F59E0B", // Amber
            success: "#059669",
            error: "#DC2626",
            warning: "#D97706",
          }
        },
        // Forest Theme
        forest: {
          bg: "#000000",
          sidebar: "#000000",
          border: "#2D4A2D",
          card: "#1A2E1A",
          text: {
            primary: "#E8F5E8",
            secondary: "#A3D4A3",
            accent: "#C8E6C8",
          },
          accent: {
            primary: "#1bb453", // Bright green
            secondary: "#84CC16", // Lime
            success: "#16A34A",
            error: "#DC2626",
            warning: "#EAB308",
          }
        },
        // Sunset Theme
        sunset: {
          bg: "#000131",
          sidebar: "#000131",
          border: "#2b4192",
          card: "#000131",
          text: {
            primary: "#FDF2F8",
            secondary: "#edf1ff",
            accent: "#FED7AA",
          },
          accent: {
            primary: "#2b4192", // Orange
            secondary: "#EF4444", // Red
            success: "#22C55E",
            error: "#DC2626",
            warning: "#F59E0B",
          }
        },
        // Purple Theme
        purple: {
          bg: "#0F0A1A",
          sidebar: "#1B142D",
          border: "#2C1A4A",
          card: "#1B142D",
          text: {
            primary: "#F3F0FF",
            secondary: "#C4B5FD",
            accent: "#DDD6FE",
          },
          accent: {
            primary: "#8B5CF6", // Purple
            secondary: "#A855F7", // Purple variant
            success: "#22C55E",
            error: "#DC2626",
            warning: "#F59E0B",
          }
        }
      },
      boxShadow: {
        'custom-light': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'custom-dark': '0 4px 6px rgba(0, 0, 0, 0.3)',
      }
    },
  },
  plugins: [],
}

