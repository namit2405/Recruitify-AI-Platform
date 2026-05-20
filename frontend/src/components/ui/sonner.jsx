'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

const Toaster = ({ ...props }) => {
    const { theme = 'system' } = useTheme();

    return (
        <Sonner
            theme={theme}
            className="toaster group"
            toastOptions={{
                style: {
                    background: 'var(--normal-bg)',
                    color: 'var(--normal-text)',
                    border: '1px solid var(--normal-border)',
                    fontWeight: 500,
                }
            }}
            {...props}
        />
    );
};

export { Toaster };
