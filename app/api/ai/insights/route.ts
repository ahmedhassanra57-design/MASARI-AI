import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

interface SpendingPattern {
  category: string
  amount: number
  frequency: number
  trend: 'increasing' | 'decreasing' | 'stable'
  percentage: number
}

interface PersonalizedInsight {
  id: string
  type: 'warning' | 'suggestion' | 'achievement' | 'prediction'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  actionable: boolean
  action?: string
  savings?: number
  category?: string
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") || "month"

    // Get current and previous period data
    const now = new Date()
    let currentStart: Date, currentEnd: Date, prevStart: Date, prevEnd: Date

    switch (period) {
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3)
        currentStart = new Date(now.getFullYear(), quarter * 3, 1)
        currentEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0)
        prevStart = new Date(now.getFullYear(), (quarter - 1) * 3, 1)
        prevEnd = new Date(now.getFullYear(), quarter * 3, 0)
        break
      case "year":
        currentStart = new Date(now.getFullYear(), 0, 1)
        currentEnd = new Date(now.getFullYear(), 11, 31)
        prevStart = new Date(now.getFullYear() - 1, 0, 1)
        prevEnd = new Date(now.getFullYear() - 1, 11, 31)
        break
      default: // month
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1)
        currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        prevEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    }

    // Fetch data for analysis
    const [currentExpenses, prevExpenses, currentIncome, prevIncome] = await Promise.all([
      prisma.expense.findMany({
        where: {
          userId: session.user.id,
          date: { gte: currentStart, lte: currentEnd },
        },
      }),
      prisma.expense.findMany({
        where: {
          userId: session.user.id,
          date: { gte: prevStart, lte: prevEnd },
        },
      }),
      prisma.income.findMany({
        where: {
          userId: session.user.id,
          date: { gte: currentStart, lte: currentEnd },
        },
      }),
      prisma.income.findMany({
        where: {
          userId: session.user.id,
          date: { gte: prevStart, lte: prevEnd },
        },
      }),
    ])

    // Analyze spending patterns
    const insights = await generatePersonalizedInsights({
      currentExpenses,
      prevExpenses,
      currentIncome,
      prevIncome,
      period,
    })

    return NextResponse.json({ insights, period })
  } catch (error) {
    console.error("[AI_INSIGHTS]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function generatePersonalizedInsights({
  currentExpenses,
  prevExpenses,
  currentIncome,
  prevIncome,
  period,
}: {
  currentExpenses: any[]
  prevExpenses: any[]
  currentIncome: any[]
  prevIncome: any[]
  period: string
}): Promise<PersonalizedInsight[]> {
  const insights: PersonalizedInsight[] = []

  // Calculate totals
  const currentExpenseTotal = currentExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  const prevExpenseTotal = prevExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  const currentIncomeTotal = currentIncome.reduce((sum, inc) => sum + inc.amount, 0)
  const prevIncomeTotal = prevIncome.reduce((sum, inc) => sum + inc.amount, 0)

  // Analyze spending by category
  const currentByCategory = groupByCategory(currentExpenses)
  const prevByCategory = groupByCategory(prevExpenses)

  // 1. Spending Trend Analysis
  const expenseChange = prevExpenseTotal > 0 ? ((currentExpenseTotal - prevExpenseTotal) / prevExpenseTotal) * 100 : 0
  
  if (expenseChange > 20) {
    insights.push({
      id: 'spending-increase',
      type: 'warning',
      title: 'Spending Spike Detected',
      description: `Your spending increased by ${expenseChange.toFixed(1)}% compared to last ${period}. This is significantly higher than usual.`,
      impact: 'high',
      actionable: true,
      action: 'Review your recent expenses and identify areas to cut back',
    })
  } else if (expenseChange < -15) {
    insights.push({
      id: 'spending-decrease',
      type: 'achievement',
      title: 'Great Job Saving!',
      description: `You've reduced your spending by ${Math.abs(expenseChange).toFixed(1)}% this ${period}. Keep up the excellent work!`,
      impact: 'high',
      actionable: false,
      savings: prevExpenseTotal - currentExpenseTotal,
    })
  }

  // 2. Category-specific insights
  for (const [category, currentAmount] of Object.entries(currentByCategory)) {
    const prevAmount = prevByCategory[category] || 0
    const categoryChange = prevAmount > 0 ? ((currentAmount - prevAmount) / prevAmount) * 100 : 0
    const categoryPercentage = currentExpenseTotal > 0 ? (currentAmount / currentExpenseTotal) * 100 : 0

    // High spending category
    if (categoryPercentage > 30) {
      insights.push({
        id: `high-spending-${category}`,
        type: 'suggestion',
        title: `${category} Dominates Your Budget`,
        description: `${category} accounts for ${categoryPercentage.toFixed(1)}% of your spending. Consider ways to optimize this category.`,
        impact: 'medium',
        actionable: true,
        action: `Look for alternatives or negotiate better rates for ${category}`,
        category,
      })
    }

    // Rapidly increasing category
    if (categoryChange > 50 && currentAmount > 100) {
      insights.push({
        id: `increasing-${category}`,
        type: 'warning',
        title: `${category} Spending Surge`,
        description: `Your ${category} expenses increased by ${categoryChange.toFixed(1)}% this ${period}.`,
        impact: 'medium',
        actionable: true,
        action: `Review recent ${category} purchases and set a budget limit`,
        category,
      })
    }
  }

  // 3. Income vs Expenses Analysis
  const savingsRate = currentIncomeTotal > 0 ? ((currentIncomeTotal - currentExpenseTotal) / currentIncomeTotal) * 100 : 0
  
  if (savingsRate < 10 && currentIncomeTotal > 0) {
    insights.push({
      id: 'low-savings-rate',
      type: 'warning',
      title: 'Low Savings Rate',
      description: `You're only saving ${savingsRate.toFixed(1)}% of your income. Financial experts recommend saving at least 20%.`,
      impact: 'high',
      actionable: true,
      action: 'Create a budget plan to increase your savings rate',
    })
  } else if (savingsRate > 30) {
    insights.push({
      id: 'excellent-savings',
      type: 'achievement',
      title: 'Excellent Savings Rate!',
      description: `You're saving ${savingsRate.toFixed(1)}% of your income. This puts you ahead of most people!`,
      impact: 'high',
      actionable: false,
    })
  }

  // 4. Budget Optimization Suggestions
  const budgetOptimizations = generateBudgetOptimizations(currentByCategory, currentIncomeTotal)
  insights.push(...budgetOptimizations)

  // 5. Predictive Insights
  if (currentExpenses.length > 0) {
    const avgDailySpending = currentExpenseTotal / new Date().getDate()
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
    const projectedMonthlySpending = avgDailySpending * daysInMonth

    if (projectedMonthlySpending > currentIncomeTotal * 0.8) {
      insights.push({
        id: 'overspending-prediction',
        type: 'prediction',
        title: 'Overspending Risk',
        description: `Based on current trends, you might spend $${projectedMonthlySpending.toFixed(2)} this month, which is ${((projectedMonthlySpending / currentIncomeTotal) * 100).toFixed(1)}% of your income.`,
        impact: 'high',
        actionable: true,
        action: 'Reduce discretionary spending for the rest of the month',
      })
    }
  }

  return insights.slice(0, 8) // Limit to 8 most important insights
}

function groupByCategory(transactions: any[]): Record<string, number> {
  return transactions.reduce((acc, transaction) => {
    acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount
    return acc
  }, {} as Record<string, number>)
}

function generateBudgetOptimizations(categorySpending: Record<string, number>, income: number): PersonalizedInsight[] {
  const optimizations: PersonalizedInsight[] = []
  const totalSpending = Object.values(categorySpending).reduce((sum, amount) => sum + amount, 0)

  // Suggest budget allocations based on 50/30/20 rule
  const needs = income * 0.5 // 50% for needs
  const wants = income * 0.3 // 30% for wants
  const savings = income * 0.2 // 20% for savings

  // Categories typically considered "needs"
  const needsCategories = ['groceries', 'utilities', 'rent', 'transportation', 'insurance', 'healthcare']
  const needsSpending = Object.entries(categorySpending)
    .filter(([category]) => needsCategories.some(need => category.toLowerCase().includes(need)))
    .reduce((sum, [, amount]) => sum + amount, 0)

  if (needsSpending > needs) {
    optimizations.push({
      id: 'needs-overspending',
      type: 'suggestion',
      title: 'Essential Expenses Too High',
      description: `Your essential expenses ($${needsSpending.toFixed(2)}) exceed the recommended 50% of income ($${needs.toFixed(2)}).`,
      impact: 'high',
      actionable: true,
      action: 'Look for ways to reduce fixed costs like subscriptions or negotiate bills',
      savings: needsSpending - needs,
    })
  }

  // Find highest spending categories for optimization
  const sortedCategories = Object.entries(categorySpending)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  sortedCategories.forEach(([category, amount], index) => {
    if (amount > income * 0.15 && index < 2) { // If category is >15% of income
      optimizations.push({
        id: `optimize-${category}`,
        type: 'suggestion',
        title: `Optimize ${category} Spending`,
        description: `${category} is your ${index === 0 ? 'highest' : 'second highest'} expense at $${amount.toFixed(2)}. Consider setting a budget limit.`,
        impact: 'medium',
        actionable: true,
        action: `Set a monthly budget of $${(amount * 0.85).toFixed(2)} for ${category}`,
        category,
        savings: amount * 0.15,
      })
    }
  })

  return optimizations
} 