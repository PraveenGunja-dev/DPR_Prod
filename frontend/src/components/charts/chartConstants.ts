// src/components/charts/chartConstants.ts

export const CHART_COLORS = {
    primary: "hsl(200, 90%, 37%)",      // Adani Blue
    secondary: "hsl(270, 36%, 44%)",    // Adani Purple
    success: "hsl(142, 76%, 36%)",      // Green
    warning: "hsl(38, 92%, 50%)",       // Orange
    danger: "hsl(0, 84%, 60%)",         // Red
    muted: "hsl(220, 10%, 60%)",        // Gray
};

export const PIE_COLORS = [
    CHART_COLORS.success,
    CHART_COLORS.warning,
    CHART_COLORS.primary,
    CHART_COLORS.danger,
];

export const BAR_COLORS = [
    CHART_COLORS.primary,
    CHART_COLORS.secondary,
    CHART_COLORS.success,
    CHART_COLORS.warning,
    CHART_COLORS.danger,
];

export const axisProps = {
    tick: { fill: "hsl(var(--muted-foreground))", fontSize: 11 },
    tickLine: { stroke: "hsl(var(--muted-foreground))" },
    axisLine: { stroke: "hsl(var(--border))" },
};
