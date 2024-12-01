import { createContext, useState, useMemo } from "react";
import { createTheme } from "@mui/material/styles";

// color design tokens 
export const tokens = () => ({
    black: {
      100: "#e6e6e6",
      200: "#cccccc",
      300: "#b3b3b3",
      400: "#999999",
      500: "#808080",
      600: "#666666",
      700: "#4d4d4d",
      800: "#333333",
      900: "#1a1a1a",
    },
    grey: {
      100: "#f2f2f2",
      200: "#e6e6e6",
      300: "#cccccc",
      400: "#b3b3b3",
      500: "#999999",
      600: "#808080",
      700: "#666666",
      800: "#4d4d4d",
      900: "#333333",
    },
    white: {
      100: "#333333",
      200: "#4d4d4d",
      300: "#666666",
      400: "#808080",
      500: "#999999",
      600: "#b3b3b3",
      700: "#cccccc",
      800: "#e6e6e6",
      900: "#f2f2f2",
    },
    teal: {
      100: "#2E9600",
      200: "#0B1A12",
      300: "#88f9f3",
      400: "#55f8ea",
      500: "#22f7e1",
      600: "#1be7cb",
      700: "#13d7b5",
      800: "#0cc79f",
      900: "#0a5e52",
    },
    cyan: {
      100: "#009FBF",
      200: "#0F0D1A",
      300: "#a3f2f7",
      400: "#81edec",
      500: "#5fe8e1",
      600: "#47dbde",
      700: "#2fcedb",
      800: "#17c1d8",
      900: "#135c5c",
    },
    yellow: {
      100: "#FFDE59",
      200: "#141709",
      300: "#fff7eb",
      400: "#fff2d4",
      500: "#ffeebd",
      600: "#ffe987",
      700: "#ffe470",
      800: "#ffde59",
      900: "#665c29",
    },
});

// mui theme settings
export const themeSettings = () => {
    const colors = tokens();

    return {
        palette: {
            primary: {
                main: colors.black[100],
            },
            secondary: {
                main: colors.teal[500],
            },
            neutral: {
                dark: colors.grey[700],
                main: colors.grey[500],
                light: colors.grey[100],
            },
            background: {
                default: "#fcfcfc",
            },
        },
        typography: {
            fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
            fontSize: 12,
            h1: {
                fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
                fontSize: 40,  
            },
            h2: {
                fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
                fontSize: 32,  
            },
            h3: {
                fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
                fontSize: 24,  
            },
            h4: {
                fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
                fontSize: 20,  
            },
            h5: {
                fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
                fontSize: 16,  
            },
            h6: {
                fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
                fontSize: 14,  
            },
        },
    };
};

export const ColorModeContext = createContext({
  toggleColorMode: () => {}
});

export const useMode = () => {
    const [mode] = useState("light");

    const theme = useMemo(() => createTheme(themeSettings()), []);

    return [theme];
};