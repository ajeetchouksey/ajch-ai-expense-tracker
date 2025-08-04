import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from './ErrorFallback';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/simple-theme.css'
import ModernApp from './ModernApp.tsx'

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <ModernApp />
  </ErrorBoundary>
);
