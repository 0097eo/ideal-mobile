import { useState, useEffect } from 'react';
import { Appearance } from 'react-native';

const lightTheme = {
    background: '#fafafa',
    surface: '#ffffff',
    card: '#ffffff',
    text: '#1a1a1a',
    textSecondary: '#666666',
    textTertiary: '#999999',
    border: '#f0f0f0',
    divider: '#e5e5e5',
    primary: '#f59e0b',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    shadow: '#000000',
    navigationBackground: '#fafafa',
    navigationText: '#1a1a1a',
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
};

const darkTheme = {
    background: '#000000',
    surface: '#1c1c1e',
    card: '#2c2c2e',
    text: '#ffffff',
    textSecondary: '#a1a1a6',
    textTertiary: '#6d6d70',
    border: '#38383a',
    divider: '#48484a',
    primary: '#f59e0b',
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
    shadow: '#000000',
    navigationBackground: '#000000',
    navigationText: '#ffffff',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
}

export const useThemes = () => {
    //get initial color scheme from system
    const deviceColorScheme = Appearance.getColorScheme();

    //state for manual override
    const [manualColorScheme, setManualColorScheme] = useState<"light" | "dark" | null>(null);


    //state for current theme
    const [systemColorScheme, setSystemColorScheme] = useState(deviceColorScheme);

    // Listen for system color scheme changes
    useEffect(() => {
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        setSystemColorScheme(colorScheme);
        });
        
        return () => subscription?.remove();
    }, []);

     // Determine current color scheme
    const currentColorScheme = manualColorScheme || systemColorScheme || 'light';
    
    // Get current theme
    const colors = currentColorScheme === 'dark' ? darkTheme : lightTheme;

    // Theme switching functions
    const setLightMode = () => setManualColorScheme('light');
    const setDarkMode = () => setManualColorScheme('dark');
    const setSystemMode = () => setManualColorScheme(null);
    
    // Toggle between light and dark (doesn't affect system following)
    const toggleColorScheme = () => {
        if (manualColorScheme === 'dark') {
        setLightMode();
        } else if (manualColorScheme === 'light') {
        setDarkMode();
        } else {
        // If following system, toggle to opposite of current system
        setManualColorScheme(systemColorScheme === 'dark' ? 'light' : 'dark');
        }
    };
    
    return {
        // Current state
        colorScheme: currentColorScheme,
        isDark: currentColorScheme === 'dark',
        isLight: currentColorScheme === 'light',
        isFollowingSystem: manualColorScheme === null,
        systemColorScheme,
        
        // Colors
        colors,
        
        // Theme switching functions
        setLightMode,
        setDarkMode,
        setSystemMode,
        toggleColorScheme,
        
        // Helper function to create styles with theme colors
        createStyles: <T extends object>(styleFunction: (colors: typeof lightTheme) => T): T =>
        styleFunction(colors),

    };
};