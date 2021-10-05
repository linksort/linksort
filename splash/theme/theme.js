const sans = `"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif`
const serif = `Georgia, "Source Serif Pro", serif`
const mono = `SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace`

const theme = {
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
  },

  fonts: {
    sans: sans,
    serif: serif,
    heading: sans,
    body: sans,
    mono: mono,
  },

  shadows: {
    outline: "0 0 0 3px #80a9ff",
  },

  components: {
    Input: {
      defaultProps: {
        focusBorderColor: "accent",
      },
    },
  },

  colors: {
    transparent: "transparent",
    current: "currentColor",
    black: "#000000",
    white: "#FFFFFF",

    primary: "#558cff", // brand.300
    accent: "#80a9ff", // brand.200

    brand: {
      50: "#d5e2ff",
      100: "#aac5ff",
      200: "#80a9ff",
      300: "#558cff",
      400: "#2b6fff",
      500: "#0a52ff",
      600: "#0042cc",
      700: "#003199",
      800: "#002166",
      900: "#001033",
    },

    whiteAlpha: {
      50: "rgba(255, 255, 255, 0.04)",
      100: "rgba(255, 255, 255, 0.06)",
      200: "rgba(255, 255, 255, 0.08)",
      300: "rgba(255, 255, 255, 0.16)",
      400: "rgba(255, 255, 255, 0.24)",
      500: "rgba(255, 255, 255, 0.36)",
      600: "rgba(255, 255, 255, 0.48)",
      700: "rgba(255, 255, 255, 0.64)",
      800: "rgba(255, 255, 255, 0.80)",
      900: "rgba(255, 255, 255, 0.92)",
    },

    blackAlpha: {
      50: "rgba(0, 0, 0, 0.04)",
      100: "rgba(0, 0, 0, 0.06)",
      200: "rgba(0, 0, 0, 0.08)",
      300: "rgba(0, 0, 0, 0.16)",
      400: "rgba(0, 0, 0, 0.24)",
      500: "rgba(0, 0, 0, 0.36)",
      600: "rgba(0, 0, 0, 0.48)",
      700: "rgba(0, 0, 0, 0.64)",
      800: "rgba(0, 0, 0, 0.80)",
      900: "rgba(0, 0, 0, 0.92)",
    },

    gray: {
      50: "#FAFAFA",
      100: "#EEEEEE",
      200: "#DDDDDD",
      300: "#CCCCCC",
      400: "#AAAAAA",
      500: "#999999",
      600: "#777777",
      700: "#555555",
      800: "#333333",
      900: "#111111",
    },

    red: {
      50: "#fdf8f9",
      100: "#faeaec",
      200: "#f6dadf",
      300: "#f1c9d0",
      400: "#edb6bf",
      500: "#e7a0ac",
      600: "#e18595",
      700: "#d86477",
      800: "#ca2e48",
      900: "#840016",
    },

    orange: {
      50: "#fdf9f6",
      100: "#f8ebe4",
      200: "#f3dcd1",
      300: "#eeccbb",
      400: "#e8baa3",
      500: "#e1a688",
      600: "#d98e68",
      700: "#cf6f3f",
      800: "#c04202",
      900: "#722600",
    },

    yellow: {
      50: "#fbfaf1",
      100: "#f4eed2",
      200: "#ebe1b1",
      300: "#e2d48c",
      400: "#d8c463",
      500: "#ccb233",
      600: "#bd9d00",
      700: "#a28700",
      800: "#806b00",
      900: "#4b3f00",
    },

    green: {
      50: "#f4fcf2",
      100: "#dbf5d6",
      200: "#c0edb6",
      300: "#a0e493",
      400: "#7bd969",
      500: "#4dcc34",
      600: "#1fb900",
      700: "#1b9f00",
      800: "#157e00",
      900: "#0c4a00",
    },

    teal: {
      50: "#f2fcf5",
      100: "#d7f5e1",
      200: "#b8edca",
      300: "#94e4af",
      400: "#6ada8f",
      500: "#35cc67",
      600: "#00b93e",
      700: "#009f35",
      800: "#007e2a",
      900: "#004a19",
    },

    blue: {
      50: "#f5fafd",
      100: "#e1f0f7",
      200: "#cbe5f2",
      300: "#b3d9ec",
      400: "#97cbe5",
      500: "#78bbdd",
      600: "#54a9d4",
      700: "#2592c8",
      800: "#0072ab",
      900: "#004365",
    },

    cyan: {
      50: "#f1fcfa",
      100: "#d4f4ef",
      200: "#b3ece2",
      300: "#8de2d4",
      400: "#60d7c3",
      500: "#26c9ad",
      600: "#00b496",
      700: "#009b81",
      800: "#007a66",
      900: "#00483c",
    },

    purple: {
      50: "#fcf8fd",
      100: "#f7e9fa",
      200: "#f1d9f6",
      300: "#eac8f1",
      400: "#e3b4ec",
      500: "#da9ee7",
      600: "#d083e0",
      700: "#c360d7",
      800: "#af2aca",
      900: "#6e0084",
    },

    pink: {
      50: "#fdf8fb",
      100: "#f9e9f4",
      200: "#f5d9ec",
      300: "#f1c7e3",
      400: "#ecb3d9",
      500: "#e69ccd",
      600: "#df80bf",
      700: "#d65cad",
      800: "#c71e8e",
      900: "#7d0053",
    },
  },
}

module.exports = theme
