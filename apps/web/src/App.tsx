import { useState } from 'react'
import {
  Button,
  ButtonGroup,
  IconButton,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  SplitButton,
  Input,
  Textarea,
  Checkbox,
  RadioGroup,
  RadioItem,
  Switch,
  Select,
} from '@innostes/ui'
import {
  Sparkles,
  Trash2,
  CheckCircle2,
  Mail,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Copy,
  Download,
} from 'lucide-react'

export function App() {
  // Form State
  const [textVal, setTextVal] = useState('John Doe')
  const [clearableVal, setClearableVal] = useState('Search query...')
  const [textareaVal, setTextareaVal] = useState('Internal ERP audit notes for Q3 financial report.')
  const [rememberMe, setRememberMe] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState('credit_card')
  const [currency, setCurrency] = useState('USD')
  const [splitSaved, setSplitSaved] = useState(false)

  const selectOptions = [
    { value: 'USD', label: 'USD - United States Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'INR', label: 'INR - Indian Rupee' },
  ]

  return (
    <div className="min-h-screen bg-background text-navy p-6 md:p-12 flex flex-col items-center justify-center font-sans">
      <div className="max-w-5xl w-full bg-surface rounded-2xl shadow-xl border border-border p-6 md:p-10 space-y-10">
        
        {/* Header */}
        <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="p-3 bg-primary-light text-primary rounded-xl border border-primary-subtle shadow-2xs">
              <Sparkles className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-navy">Innostes ERP Component Showcase</h1>
              <p className="text-slate text-sm">
                Category 1 (Form Controls) &amp; Category 2 (Actions) powered by <code className="bg-primary-light text-primary px-2 py-0.5 rounded font-mono text-xs font-semibold">@innostes/ui</code>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <SplitButton
              variant="primary"
              onClick={() => setSplitSaved(true)}
              options={[
                { label: 'Save as Draft', onClick: () => alert('Saved as Draft!'), leftIcon: <Edit /> },
                { label: 'Save & Export PDF', onClick: () => alert('Exporting PDF...'), leftIcon: <Download /> },
                { label: 'Duplicate Order', onClick: () => alert('Duplicated!'), leftIcon: <Copy /> },
                { label: 'Delete Draft', onClick: () => alert('Deleted!'), destructive: true, leftIcon: <Trash2 /> },
              ]}
            >
              {splitSaved ? 'Saved Successfully ✓' : 'Save Invoice'}
            </SplitButton>
          </div>
        </div>

        {/* Category 1: Form Controls & Inputs Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h2 className="text-base font-bold text-navy flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-primary-light text-primary rounded-full text-xs font-mono">Category 1</span>
              <span>Form Controls &amp; Inputs (`components/forms/`)</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input with Label & Left Icon */}
            <Input
              label="Full Name"
              required
              leftIcon={<Mail />}
              value={textVal}
              onChange={(e) => setTextVal(e.target.value)}
              hint="Enter employee full name as shown on legal documents."
            />

            {/* Clearable Search Input */}
            <Input
              label="Quick Search"
              leftIcon={<Search />}
              clearable
              value={clearableVal}
              onChange={(e) => setClearableVal(e.target.value)}
              onClear={() => setClearableVal('')}
              hint="Click clear button (X) to reset search filter."
            />

            {/* Currency Input with Prefix */}
            <Input
              label="Unit Price"
              prefixText="$"
              defaultValue="1,250.00"
              placeholder="0.00"
              hint="Specify unit amount before tax calculation."
            />

            {/* Error State Input */}
            <Input
              label="Tax Identification Number (TIN)"
              required
              defaultValue="INVALID_TIN_99"
              error="Tax ID must be 9 digits format (XX-XXXXXXX)."
            />

            {/* Accessible Select Dropdown */}
            <Select
              label="Base Currency"
              required
              options={selectOptions}
              value={currency}
              onValueChange={(val) => setCurrency(val as string)}
              hint="Select transaction ledger currency."
            />

            {/* Switch Toggle */}
            <div className="space-y-3 pt-1">
              <Switch
                label="System Email Notifications"
                checked={notifications}
                onCheckedChange={(val) => setNotifications(val)}
                hint="Receive automated email alerts on invoice approvals."
              />
            </div>
          </div>

          {/* Textarea */}
          <Textarea
            label="Internal Notes"
            rows={3}
            maxLength={200}
            showCount
            value={textareaVal}
            onChange={(e) => setTextareaVal(e.target.value)}
            hint="Notes are visible internally to finance auditors."
          />

          {/* Checkboxes & Radio Group Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Checkboxes */}
            <div className="space-y-3 bg-background p-4 rounded-xl border border-border">
              <div className="text-xs font-bold text-navy uppercase tracking-wider">Checkboxes</div>
              <Checkbox
                label="Remember session on this device"
                checked={rememberMe}
                onCheckedChange={(chk) => setRememberMe(Boolean(chk))}
              />
              <Checkbox
                label="Bulk Select Invoices (Indeterminate State)"
                indeterminate
                hint="Some items in table are selected."
              />
              <Checkbox
                label="Agree to Terms & Conditions"
                error="You must accept terms to proceed."
              />
            </div>

            {/* Radio Options (Card Style) */}
            <div className="space-y-3 bg-background p-4 rounded-xl border border-border">
              <div className="text-xs font-bold text-navy uppercase tracking-wider">Payment Method (Card Radio)</div>
              <RadioGroup value={paymentMethod} onValueChange={(val) => setPaymentMethod(val as string)}>
                <RadioItem
                  card
                  value="credit_card"
                  label="Credit / Debit Card"
                  description="Instant payment via Stripe gateway."
                />
                <RadioItem
                  card
                  value="bank_wire"
                  label="Bank Wire Transfer"
                  description="2-3 business days processing."
                />
              </RadioGroup>
            </div>
          </div>
        </div>

        {/* Category 2: Buttons & Actions Section */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h2 className="text-base font-bold text-navy flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-primary-light text-primary rounded-full text-xs font-mono">Category 2</span>
              <span>Buttons &amp; Actions (`components/actions/`)</span>
            </h2>
          </div>

          {/* Button Variants */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate uppercase tracking-wider">Button Variants &amp; States</div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" leftIcon={<CheckCircle2 className="w-4 h-4" />}>
                Primary Button
              </Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive" leftIcon={<Trash2 className="w-4 h-4" />}>
                Destructive
              </Button>
              <Button variant="primary" isLoading>
                Loading...
              </Button>
            </div>
          </div>

          {/* Button Group & Icon Buttons & Dropdown Menu */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Button Group */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate uppercase tracking-wider">Button Group</div>
              <ButtonGroup>
                <Button variant="outline">Day</Button>
                <Button variant="primary">Week</Button>
                <Button variant="outline">Month</Button>
              </ButtonGroup>
            </div>

            {/* Icon Buttons */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate uppercase tracking-wider">Icon Buttons</div>
              <div className="flex items-center gap-2">
                <IconButton icon={<Filter className="w-4 h-4" />} aria-label="Filter" variant="outline" />
                <IconButton icon={<Download className="w-4 h-4" />} aria-label="Download" variant="secondary" />
                <IconButton icon={<Edit className="w-4 h-4" />} aria-label="Edit" variant="ghost" />
                <IconButton icon={<Trash2 className="w-4 h-4" />} aria-label="Delete" variant="destructive" />
              </div>
            </div>

            {/* Dropdown Menu */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate uppercase tracking-wider">Dropdown Menu</div>
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button variant="outline" rightIcon={<MoreVertical className="w-4 h-4" />}>
                    Row Actions
                  </Button>
                } />
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Record Options</DropdownMenuLabel>
                  <DropdownMenuItem leftIcon={<Edit />} rightShortcut="⌘E">
                    Edit Record
                  </DropdownMenuItem>
                  <DropdownMenuItem leftIcon={<Copy />} rightShortcut="⌘C">
                    Duplicate Item
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem leftIcon={<Trash2 />} destructive rightShortcut="⌘D">
                    Delete Item
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default App
