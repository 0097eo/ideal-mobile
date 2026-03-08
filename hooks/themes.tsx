import { useState, useEffect } from 'react';
import { Appearance } from 'react-native';

// ─── Light Theme (warm luxury) ─────────────────────────────────────────────
const lightTheme = {
    background:            '#FAF7F2',
    surface:               '#FFFFFF',
    card:                  '#FDF9F4',
    text:                  '#1C1510',
    textSecondary:         '#6B5D4F',
    textTertiary:          '#9C8E82',
    border:                'rgba(0,0,0,0.08)',
    divider:               'rgba(0,0,0,0.10)',
    primary:               '#B8843A',       // darker gold — readable on light bg
    primaryDim:            'rgba(184,132,58,0.12)',
    primaryBorder:         'rgba(184,132,58,0.35)',
    primaryText:           '#FFFFFF',           // text on primary-colored buttons
    stickyBackground:      'rgba(250,247,242,0.96)', 
    success:               '#22C55E',
    warning:               '#D97706',
    error:                 '#DC2626',
    shadow:                '#000000',
    navigationBackground:  '#FAF7F2',
    navigationText:        '#1C1510',
    modalOverlay:          'rgba(0,0,0,0.50)',
};

// ─── Dark Theme (luxury dark) ──────────────────────────────────────────────
const darkTheme = {
    background:            '#0F0C08',
    surface:               'rgba(255,255,255,0.07)',
    card:                  'rgba(255,255,255,0.04)',
    text:                  '#FFFFFF',
    textSecondary:         'rgba(255,255,255,0.55)',
    textTertiary:          'rgba(255,255,255,0.28)',
    border:                'rgba(255,255,255,0.09)',
    divider:               'rgba(255,255,255,0.12)',
    primary:               '#D4A96A',       // luxury gold
    primaryDim:            'rgba(212,169,106,0.12)',
    primaryBorder:         'rgba(212,169,106,0.35)',
     primaryText:           '#1A1208',           // text on primary-colored buttons
    stickyBackground:      'rgba(15,12,8,0.96)',
    success:               '#4ADE80',
    warning:               '#FBBF24',
    error:                 '#FF6B6B',
    shadow:                '#000000',
    navigationBackground:  '#0F0C08',
    navigationText:        '#FFFFFF',
    modalOverlay:          'rgba(0,0,0,0.75)',
};

export type AppColors = typeof lightTheme;

export const useThemes = () => {
    const deviceColorScheme = Appearance.getColorScheme();
    const [manualColorScheme, setManualColorScheme] = useState<'light' | 'dark' | null>(null);
    const [systemColorScheme, setSystemColorScheme] = useState(deviceColorScheme);

    useEffect(() => {
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            setSystemColorScheme(colorScheme);
        });
        return () => subscription?.remove();
    }, []);

    const currentColorScheme = manualColorScheme || systemColorScheme || 'light';
    const colors: AppColors = currentColorScheme === 'dark' ? darkTheme : lightTheme;

    const setLightMode  = () => setManualColorScheme('light');
    const setDarkMode   = () => setManualColorScheme('dark');
    const setSystemMode = () => setManualColorScheme(null);

    const toggleColorScheme = () => {
        if (manualColorScheme === 'dark') {
            setLightMode();
        } else if (manualColorScheme === 'light') {
            setDarkMode();
        } else {
            setManualColorScheme(systemColorScheme === 'dark' ? 'light' : 'dark');
        }
    };

    return {
        colorScheme:        currentColorScheme,
        isDark:             currentColorScheme === 'dark',
        isLight:            currentColorScheme === 'light',
        isFollowingSystem:  manualColorScheme === null,
        systemColorScheme,
        colors,
        setLightMode,
        setDarkMode,
        setSystemMode,
        toggleColorScheme,
        createStyles: <T extends object>(styleFunction: (colors: AppColors) => T): T =>
            styleFunction(colors),
    };
};