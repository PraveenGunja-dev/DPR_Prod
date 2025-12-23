# Infinite Scroll Table Implementation Guide

## Overview
This guide explains how to implement infinite scrolling in tables to prevent UI freezing when displaying large datasets. The implementation loads data in batches and only renders what's visible, significantly improving performance.

## Components

### 1. InfiniteScrollTable Component
Location: `src/components/InfiniteScrollTable.tsx`

This component wraps the existing `StyledExcelTable` and adds infinite scrolling capabilities.

#### Props
- `title`: Table title
- `columns`: Array of column names
- `data`: Full dataset (all rows)
- `batchSize`: Number of rows to load per batch (default: 50)
- All other props from `StyledExcelTable`

### 2. Usage Example
Location: `src/components/InfiniteScrollDemo.tsx`

## Implementation Details

### How It Works
1. **Initial Load**: Loads first `batchSize` rows (default 50)
2. **Scroll Detection**: Monitors scroll position to detect when user is near bottom
3. **Dynamic Loading**: Loads additional batches as user scrolls
4. **Performance**: Only renders visible rows, reducing DOM size

### Key Features
- Automatic scroll detection with 100px threshold
- Manual "Load More" button as fallback
- Progress indicators showing loaded vs total rows
- Preserves all `StyledExcelTable` functionality

## Integration Guide

### 1. Replace StyledExcelTable with InfiniteScrollTable
```tsx
// Before
import { StyledExcelTable } from "@/components/StyledExcelTable";

<StyledExcelTable
  title="My Table"
  columns={columns}
  data={largeDataset}
  {...otherProps}
/>

// After
import { InfiniteScrollTable } from "@/components/InfiniteScrollTable";

<InfiniteScrollTable
  title="My Table"
  columns={columns}
  data={largeDataset}
  batchSize={50}
  {...otherProps}
/>
```

### 2. Route Access
The demo page is available at `/infinite-scroll-demo` after authentication.

## Benefits

1. **Performance**: Prevents UI freezing with large datasets
2. **Memory Efficiency**: Only renders visible rows
3. **User Experience**: Smooth scrolling with progress indicators
4. **Compatibility**: Maintains all existing table features
5. **Flexibility**: Configurable batch size

## Best Practices

1. **Batch Size**: 
   - Small datasets (< 1000 rows): Batch size 50-100
   - Large datasets (> 10000 rows): Batch size 20-50

2. **Styling**: Ensure container has fixed height for proper scrolling

3. **Data Updates**: The component handles data changes gracefully

## Customization

### Adjust Batch Size
```tsx
<InfiniteScrollTable
  batchSize={100} // Load 100 rows at a time
  {...props}
/>
```

### Styling Container
The container div can be styled by targeting the wrapper element:
```css
.infinite-scroll-container {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}
```

## Troubleshooting

### Issue: Scrolling not working
Solution: Ensure the parent container has a fixed height

### Issue: Performance still poor
Solution: Reduce batch size or check for heavy render operations in cells

### Issue: Data not updating
Solution: Ensure the `data` prop is properly updated when source data changes