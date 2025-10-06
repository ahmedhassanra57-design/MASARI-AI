"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "@/components/overview"
import { RecentTransactions } from "@/components/recent-transactions"
import { BudgetProgress } from "@/components/budget-progress"
import { AddTransactionDialog } from "@/components/add-transaction-dialog"
import { AIInsights } from "@/components/ai-insights"
import { BudgetOptimizer } from "@/components/budget-optimizer"
import { ResponsiveDemo } from "@/components/responsive-demo"
import { DollarSign, CreditCard, Wallet, BarChart3, Settings, Sparkles, Receipt } from "lucide-react"
import { UserNav } from "@/components/layout/user-nav"
import { useDevice } from "@/hooks/use-device"
import { MobileDashboard } from "@/components/mobile/mobile-dashboard"

interface DashboardData {
  balance: number
  income: number
  expenses: number
  savingsRate: number
  incomeChange: number
  expensesChange: number
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    balance: 0,
    income: 0,
    expenses: 0,
    savingsRate: 0,
    incomeChange: 0,
    expensesChange: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshTransactions, setRefreshTransactions] = useState(0)
  const device = useDevice()

  const handleTransactionAdded = () => {
    setRefreshTransactions((prev) => prev + 1)
  }

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard/summary")
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [refreshTransactions])

  // Mobile Layout for phones
  if (device.isMobile) {
    return <MobileDashboard />
  }

  // Dynamic layout calculations based on device
  const getCardCols = () => {
    if (device.isMobile) return "grid-cols-1"
    if (device.isTablet) return "grid-cols-2"
    return "grid-cols-4"
  }

  const getMainCols = () => {
    if (device.isMobile) return "grid-cols-1"
    if (device.isTablet) return "grid-cols-1"
    return "grid-cols-7"
  }

  const getContentSpacing = () => {
    if (device.isMobile) return "gap-3 p-3"
    if (device.isTablet) return "gap-4 p-4"
    return "gap-6 p-6"
  }

  const getHeaderHeight = () => {
    if (device.isMobile) return "h-12"
    if (device.isTablet) return "h-14"
    return "h-16"
  }

  const getBottomPadding = () => {
    if (device.isMobile) return "pb-20"
    if (device.isTablet) return "pb-16"
    return "pb-6"
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Dynamic Header */}
      <header className={`sticky top-0 z-50 flex ${getHeaderHeight()} items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6 safe-area-inset-top transition-all duration-300`}>
        <Link href="/" className="flex items-center gap-2 font-semibold touch-manipulation">
          <Wallet className={`${device.isMobile ? 'h-4 w-4' : device.isTablet ? 'h-5 w-5' : 'h-6 w-6'} transition-all duration-300`} />
          <span className={`${device.isMobile ? 'text-xs' : device.isTablet ? 'text-sm' : 'text-base'} transition-all duration-300`}>
            {device.isMobile ? 'MA$ARI' : 'MA$ARI-AI'}
          </span>
        </Link>
        <nav className="ml-auto flex gap-2">
          {!device.isMobile && (
            <Button variant="outline" size="sm" asChild className="touch-manipulation transition-all duration-300">
              <Link href="/simple-settings">
              <Settings className="mr-2 h-4 w-4" />
                {device.isTablet ? 'Settings' : 'Settings'}
            </Link>
          </Button>
          )}
          <div className={device.isMobile ? "block" : "hidden"}>
            <UserNav />
          </div>
        </nav>
      </header>
      
      <div className="flex flex-1">
        {/* Dynamic Desktop Sidebar */}
        <aside className={`${device.isDesktop ? 'flex' : 'hidden'} w-48 flex-col border-r bg-background transition-all duration-300`}>
          <nav className="flex flex-1 flex-col gap-2 px-2 py-4">
            {[
              { href: "/", icon: Wallet, label: "Dashboard" },
              { href: "/income", icon: DollarSign, label: "Income" },
              { href: "/expenses", icon: CreditCard, label: "Expenses" },
              { href: "/budgets", icon: BarChart3, label: "Budgets" },
              { href: "/receipts", icon: Receipt, label: "Receipts" },
              { href: "/reports", icon: BarChart3, label: "Reports" },
              { href: "/ai-assistant", icon: Sparkles, label: "AI Assistant" }
            ].map((item) => (
              <Button key={item.href} variant="ghost" className="justify-start touch-manipulation transition-all duration-200" asChild>
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
              </Link>
            </Button>
            ))}
          </nav>
        </aside>

        {/* Dynamic Mobile Bottom Navigation */}
        {(device.isMobile || device.isTablet) && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t safe-area-inset-bottom transition-all duration-300">
            <nav className={`flex justify-around ${device.isMobile ? 'py-1 px-2' : 'py-2 px-4'}`}>
              {[
                { href: "/", icon: Wallet, label: "Home" },
                { href: "/income", icon: DollarSign, label: "Income" },
                { href: "/expenses", icon: CreditCard, label: "Expenses" },
                { href: "/budgets", icon: BarChart3, label: "Budget" },
                { href: "/reports", icon: BarChart3, label: "Reports" }
              ].map((item) => (
                <Button 
                  key={item.href}
                  variant="ghost" 
                  size="sm" 
                  asChild 
                  className={`flex-col h-auto ${device.isMobile ? 'py-2 px-1 min-w-[60px]' : 'py-3 px-2 min-w-[80px]'} touch-manipulation transition-all duration-200`}
                >
                  <Link href={item.href}>
                    <item.icon className={`${device.isMobile ? 'h-4 w-4' : 'h-5 w-5'} transition-all duration-200`} />
                    <span className={`${device.isMobile ? 'text-xs' : 'text-sm'} mt-1 transition-all duration-200`}>
                      {item.label}
                    </span>
                  </Link>
                </Button>
              ))}
            </nav>
          </div>
        )}

        {/* Dynamic Main Content */}
        <main className={`flex flex-1 flex-col ${getContentSpacing()} ${getBottomPadding()} transition-all duration-300`}>
          {/* Dynamic Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className={`${device.isMobile ? 'text-lg' : device.isTablet ? 'text-xl' : 'text-3xl'} font-semibold transition-all duration-300`}>
              Dashboard
            </h1>
            <div className="flex gap-2">
              <AddTransactionDialog onTransactionAdded={handleTransactionAdded} />
              {device.isMobile && (
                <Button variant="outline" size="sm" asChild className="touch-manipulation">
                  <Link href="/simple-settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </Button>
              )}
                </div>
                </div>
          {/* Dynamic Cards Grid */}
          <div className={`grid gap-4 ${getCardCols()} transition-all duration-300`}>
            {[
              { title: "Total Balance", value: dashboardData.balance, change: dashboardData.incomeChange, icon: DollarSign },
              { title: "Monthly Income", value: dashboardData.income, change: dashboardData.incomeChange, icon: Wallet },
              { title: "Monthly Expenses", value: dashboardData.expenses, change: dashboardData.expensesChange, icon: CreditCard },
              { title: "Savings Rate", value: dashboardData.savingsRate, change: null, icon: BarChart3, isPercentage: true }
            ].map((card, index) => (
              <Card key={index} className="card-hover touch-manipulation transition-all duration-300">
                <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${device.isMobile ? 'pb-2' : 'pb-3'}`}>
                  <CardTitle className={`${device.isMobile ? 'text-xs' : 'text-sm'} font-medium transition-all duration-300`}>
                    {card.title}
                  </CardTitle>
                  <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
                <CardContent className={`${device.isMobile ? 'py-2' : 'py-3'} transition-all duration-300`}>
                  <div className={`${device.isMobile ? 'text-lg' : device.isTablet ? 'text-xl' : 'text-2xl'} font-bold transition-all duration-300`}>
                    {loading ? "Loading..." : 
                      card.isPercentage ? `${card.value.toFixed(1)}%` : `$${card.value.toFixed(2)}`
                    }
                </div>
                  {card.change !== null && (
                    <p className={`${device.isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground transition-all duration-300`}>
                      {loading ? "" : `${card.change >= 0 ? '+' : ''}${card.change.toFixed(1)}% from last month`}
                </p>
                  )}
                  {card.isPercentage && (
                    <p className={`${device.isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground transition-all duration-300`}>
                  {loading ? "" : "Based on current month data"}
                </p>
                  )}
              </CardContent>
            </Card>
            ))}
          </div>

          {/* Dynamic Overview and Transactions Section */}
          <div className={`grid gap-4 ${getMainCols()} transition-all duration-300`}>
            <Card className={`${device.isDesktop ? 'col-span-4' : 'col-span-1'} transition-all duration-300`}>
              <CardHeader>
                <CardTitle className={`${device.isMobile ? 'text-base' : device.isTablet ? 'text-lg' : 'text-xl'} transition-all duration-300`}>
                  Overview
                </CardTitle>
                <CardDescription className={`${device.isMobile ? 'text-xs' : 'text-sm'} transition-all duration-300`}>
                  Your income and expenses over time.
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview />
              </CardContent>
            </Card>
            <Card className={`${device.isDesktop ? 'col-span-3' : 'col-span-1'} transition-all duration-300`}>
              <CardHeader>
                <CardTitle className={`${device.isMobile ? 'text-base' : device.isTablet ? 'text-lg' : 'text-xl'} transition-all duration-300`}>
                  Recent Transactions
                </CardTitle>
                <CardDescription className={`${device.isMobile ? 'text-xs' : 'text-sm'} transition-all duration-300`}>
                  Your latest financial activities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentTransactions refreshKey={refreshTransactions} />
              </CardContent>
            </Card>
          </div>

          {/* Dynamic Budget Progress and Quick Actions */}
          <div className={`grid gap-4 ${getMainCols()} transition-all duration-300`}>
            <Card className={`${device.isDesktop ? 'col-span-4' : 'col-span-1'} transition-all duration-300`}>
              <CardHeader>
                <CardTitle className={`${device.isMobile ? 'text-base' : device.isTablet ? 'text-lg' : 'text-xl'} transition-all duration-300`}>
                  Budget Progress
                </CardTitle>
                <CardDescription className={`${device.isMobile ? 'text-xs' : 'text-sm'} transition-all duration-300`}>
                  Track your spending against budget limits.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BudgetProgress />
              </CardContent>
            </Card>
            <Card className={`${device.isDesktop ? 'col-span-3' : 'col-span-1'} transition-all duration-300`}>
              <CardHeader>
                <CardTitle className={`${device.isMobile ? 'text-base' : device.isTablet ? 'text-lg' : 'text-xl'} transition-all duration-300`}>
                  Quick Actions
                </CardTitle>
                <CardDescription className={`${device.isMobile ? 'text-xs' : 'text-sm'} transition-all duration-300`}>
                  Common tasks and shortcuts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {[
                    { href: "/income", icon: DollarSign, label: "Add Income" },
                    { href: "/expenses", icon: CreditCard, label: "Add Expense" },
                    { href: "/receipts", icon: Receipt, label: "Scan Receipt" }
                  ].map((action) => (
                    <Button 
                      key={action.href}
                      variant="outline" 
                      className={`justify-start touch-manipulation ${device.isMobile ? 'h-12' : 'h-10'} transition-all duration-200`} 
                      asChild
                    >
                      <Link href={action.href}>
                        <action.icon className="mr-2 h-4 w-4" />
                        {action.label}
                    </Link>
                  </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Dynamic AI Features Section */}
          <div className={`grid gap-4 ${device.isMobile ? 'grid-cols-1' : 'grid-cols-2'} transition-all duration-300`}>
            <AIInsights period="month" refreshKey={refreshTransactions} />
            <BudgetOptimizer period="month" refreshKey={refreshTransactions} />
          </div>

          {/* Responsive Design Demo */}
          {process.env.NODE_ENV === 'development' && (
            <ResponsiveDemo />
          )}

          {/* Device Info Debug (remove in production) */}
          {process.env.NODE_ENV === 'development' && (
            <Card className="mt-4 opacity-50">
              <CardHeader>
                <CardTitle className="text-sm">Device Debug Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs space-y-1">
                  <p>Screen: {device.screenWidth}x{device.screenHeight}</p>
                  <p>Device: {device.isMobile ? 'Mobile' : device.isTablet ? 'Tablet' : 'Desktop'}</p>
                  <p>OS: {device.isIOS ? 'iOS' : device.isAndroid ? 'Android' : 'Other'}</p>
                  <p>Touch: {device.isTouchDevice ? 'Yes' : 'No'}</p>
                  <p>Orientation: {device.orientation}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}
