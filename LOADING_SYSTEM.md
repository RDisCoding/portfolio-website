# Loading System Documentation

## Overview

This document explains the new loading system implemented for the portfolio website.

## How It Works

### 1. **Loading Screen Appears FIRST**

- The loading screen is shown immediately when:
  - The website is initially loaded
  - User navigates between pages
  - Content is being fetched from Sanity CMS

### 2. **Dark Themed Loading Screen**

- Background: Translucent black (`rgba(0, 0, 0, 0.95)`) with backdrop blur
- Matches the website's dark theme
- Large, prominent loading content:
  - 5xl heading "Loading"
  - Animated progress bar (4px height)
  - Large percentage display (2xl font)

### 3. **Progress Bar Animation**

- Starts at 0% when loading begins
- Smoothly progresses to simulate content loading
- Reaches 100% when content is fully loaded
- Features a shimmer effect for visual appeal

### 4. **Smart Loading State Management**

- **ClientWrapper Component**: Global loading state provider
  - Wraps entire application
  - Provides `useLoading()` hook for any component
  - Automatically shows loading on route changes
- **Page Components**: Control loading based on data fetching
  - Call `setLoading(true)` before fetching data
  - Call `setLoading(false)` after data is loaded

### 5. **Smooth Transitions**

- Content fades in after loading completes
- Loading screen fades out smoothly
- No jarring transitions

## Components

### LoadingScreen.tsx

- Full-screen overlay with high z-index (9999)
- Dark translucent background
- Animated progress bar with shimmer effect
- Large, visible percentage counter

### ClientWrapper.tsx

- Provides loading context to all components
- Manages global loading state
- Handles route change detection
- Hides content while loading (opacity: 0)
- Shows content after loading (opacity: 1)

### ScrollToTop.tsx

- Scroll-to-top button at bottom-right
- Appears after scrolling 300px down
- Smooth scroll animation
- Purple theme matching the design

## Usage in Pages

```tsx
"use client";
import { useLoading } from "@/app/components/ClientWrapper";

export default function YourPage() {
  const { setLoading } = useLoading();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Show loading screen
      try {
        const result = await fetchYourData();
        setYourData(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false); // Hide loading screen
      }
    };
    fetchData();
  }, []);

  return <div>Your content</div>;
}
```

## Features

✅ Loading screen appears BEFORE content loads
✅ Dark theme with translucent background
✅ Large, visible loading content
✅ Animated progress bar (0-100%)
✅ Smooth fade transitions
✅ Automatic route change detection
✅ Manual loading control via `useLoading()` hook
✅ Scroll-to-top button
✅ No more old LoadingBar component

## Removed Components

- ❌ LoadingBar.tsx (old top bar) - No longer used
- ✅ LoadingScreen.tsx (new full-screen) - Active
- ✅ LoadingContext.tsx - Integrated into ClientWrapper
