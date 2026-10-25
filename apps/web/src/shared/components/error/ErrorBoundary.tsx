import { Component, ErrorInfo, ReactNode } from 'react';
import { i18n } from '../../i18n';
import './error-boundary.css';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?:
    | ReactNode
    | ((props: { error: Error; reset: () => void }) => ReactNode);
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Unhandled rendering error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleNavigateHome = (): void => {
    this.handleReset();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  override render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      if (typeof fallback === 'function') {
        return fallback({ error, reset: this.handleReset });
      }

      if (fallback) {
        return fallback;
      }

      return (
        <div className="error-boundary-card" role="alert">
          <div className="error-icon-box">
            <span className="material-symbols-outlined">error</span>
          </div>

          <h2 className="error-title">{i18n.t('errorBoundary.title')}</h2>
          <p className="error-desc">{i18n.t('errorBoundary.description')}</p>

          <div className="error-details-box">
            <code className="error-details-text">{error.message}</code>
          </div>

          <div className="error-actions-group">
            <button
              type="button"
              className="error-btn-primary"
              onClick={this.handleReset}
            >
              <span className="material-symbols-outlined">refresh</span>
              <span>{i18n.t('errorBoundary.retryBtn')}</span>
            </button>
            <button
              type="button"
              className="error-btn-secondary"
              onClick={this.handleNavigateHome}
            >
              <span className="material-symbols-outlined">home</span>
              <span>{i18n.t('errorBoundary.backToDashboardBtn')}</span>
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
