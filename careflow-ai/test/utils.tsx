/**
 * Test Utilities
 * 
 * Common utilities for testing React components with providers.
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Create a fresh QueryClient for each test
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface WrapperProps {
  children: ReactNode;
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  route?: string;
}

/**
 * Custom render function that wraps components with necessary providers
 */
function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { queryClient: QueryClient } {
  const { queryClient = createTestQueryClient(), route = '/', ...renderOptions } = options;

  // Set up initial route
  window.history.pushState({}, 'Test page', route);

  function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    );
  }

  const result = render(ui, { wrapper: Wrapper, ...renderOptions });

  return {
    ...result,
    queryClient,
  };
}

/**
 * Render with just QueryClient (no router)
 */
function renderWithQuery(
  ui: ReactElement,
  options: { queryClient?: QueryClient } = {}
): RenderResult & { queryClient: QueryClient } {
  const queryClient = options.queryClient || createTestQueryClient();

  function Wrapper({ children }: WrapperProps) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  const result = render(ui, { wrapper: Wrapper });

  return {
    ...result,
    queryClient,
  };
}

/**
 * Wait for query to settle (loading -> success/error)
 */
async function waitForQueryToSettle(queryClient: QueryClient): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await queryClient.getQueryCache().findAll()[0]?.promise;
}

/**
 * Create a deferred promise for testing async behavior
 */
function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render, renderWithQuery, waitForQueryToSettle, createDeferred, createTestQueryClient };
