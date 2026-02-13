import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/shared/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <div className="max-w-md space-y-4 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-400" />
            <h2 className="text-xl font-semibold text-slate-50">
              Что-то пошло не так
            </h2>
            <p className="text-sm text-slate-400">
              Произошла ошибка при отображении страницы. Попробуйте обновить или
              вернуться назад.
            </p>
            {this.state.error && (
              <pre className="rounded-md bg-slate-800 p-3 text-left text-xs text-slate-400 overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={this.handleReset}>
                <RotateCcw className="h-4 w-4" />
                Попробовать снова
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.assign('/')}
              >
                На главную
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
