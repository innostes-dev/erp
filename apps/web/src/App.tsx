import { useState } from 'react'
import { Button, type ButtonProps } from '@innostes/ui'
import { Sparkles, Send, Trash2, ArrowRight, CheckCircle2 } from 'lucide-react'

// Custom wrapper component demonstrating usage of exported ButtonProps
function CustomActionButton(props: ButtonProps) {
  return <Button variant="primary" {...props} />
}

export function App() {
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const handleAsyncAction = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-8 flex flex-col items-center justify-center font-sans">
      <div className="max-w-3xl w-full bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg">
              <Sparkles className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Design System Showcase</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Testing <code className="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400">@innostes/ui</code> Button Component &amp; <code className="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400">ButtonProps</code>
              </p>
            </div>
          </div>
        </div>

        {/* Interactive State Demo */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Interactive Test
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <CustomActionButton
              size="lg"
              leftIcon={<Sparkles className="w-4 h-4" />}
              onClick={() => setCount((c) => c + 1)}
            >
              Clicked {count} times
            </CustomActionButton>

            <Button
              variant="secondary"
              size="lg"
              isLoading={isLoading}
              onClick={handleAsyncAction}
            >
              {isLoading ? 'Processing...' : 'Simulate Async Action'}
            </Button>
          </div>
        </div>

        {/* Button Variants Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Button Variants
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive" leftIcon={<Trash2 className="w-4 h-4" />}>
              Delete
            </Button>
            <Button variant="link">Link Button</Button>
          </div>
        </div>

        {/* Button Sizes Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Button Sizes &amp; Icons
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" size="sm" leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}>
              Small
            </Button>
            <Button variant="primary" size="default" rightIcon={<Send className="w-4 h-4" />}>
              Default
            </Button>
            <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
              Large
            </Button>
            <Button variant="outline" size="icon" aria-label="Icon only">
              <Sparkles className="w-4 h-4" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default App
