import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

interface BudgetRecommendation {
  category: string
  currentSpending: number
  recommendedBudget: number
  potentialSavings: number
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") || "month"

    // Get current period data
    const now = new Date()
    let currentStart: Date, currentEnd: Date

    switch (period) {
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3)
        currentStart = new Date(now.getFullYear(), quarter * 3, 1)
        currentEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0)
        break
      case "year":
        currentStart = new Date(now.getFullYear(), 0, 1)
        currentEnd = new Date(now.getFullYear(), 11, 31)
        break
      default: // month
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1)
        currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    }

    // Get historical data for better analysis (last 6 months)
    const historicalStart = new Date(now.getFullYear(), now.getMonth() - 6, 1)

    const [currentExpenses, currentIncome, historicalExpenses] = await Promise.all([
      prisma.expense.findMany({
        where: {
          userId: session.user.id,
          date: { gte: currentStart, lte: currentEnd },
        },
      }),
      prisma.income.findMany({
        where: {
          userId: session.user.id,
          date: { gte: currentStart, lte: currentEnd },
        },
      }),
      prisma.expense.findMany({
        where: {
          userId: session.user.id,
          date: { gte: historicalStart, lte: currentEnd },
        },
      }),
    ])

    const recommendations = generateBudgetRecommendations({
      currentExpenses,
      currentIncome,
      historicalExpenses,
      period,
    })

    const totalPotentialSavings = recommendations.reduce(
      (sum, rec) => sum + Math.max(0, rec.potentialSavings),
      0
    )

    return NextResponse.json({
      recommendations,
      totalPotentialSavings,
      period,
    })
  } catch (error) {
    console.error("[BUDGET_OPTIMIZER]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateBudgetRecommendations({
  currentExpenses,
  currentIncome,
  historicalExpenses,
  period,
}: {
  currentExpenses: any[]
  currentIncome: any[]
  historicalExpenses: any[]
  period: string
}): BudgetRecommendation[] {
  const recommendations: BudgetRecommendation[] = []
  
  // Calculate current totals
  const currentIncomeTotal = currentIncome.reduce((sum, inc) => sum + inc.amount, 0)
  const currentExpenseTotal = currentExpenses.reduce((sum, exp) => sum + exp.amount, 0)

  // Group current expenses by category
  const currentByCategory = groupByCategory(currentExpenses)
  
  // Group historical expenses by category and month for trend analysis
  const historicalByCategory = groupHistoricalByCategory(historicalExpenses)

  // Ideal budget allocations (50/30/20 rule as baseline)
  const idealNeeds = currentIncomeTotal * 0.5
  const idealWants = currentIncomeTotal * 0.3
  const idealSavings = currentIncomeTotal * 0.2

  // Categories typically considered "needs" vs "wants"
  const needsCategories = [
    'groceries', 'utilities', 'rent', 'mortgage', 'transportation', 
    'insurance', 'healthcare', 'childcare', 'debt payments'
  ]
  
  const wantsCategories = [
    'entertainment', 'dining out', 'shopping', 'hobbies', 'travel',
    'subscriptions', 'gifts', 'personal care'
  ]

  // Analyze each category
  for (const [category, currentAmount] of Object.entries(currentByCategory)) {
    const historicalData = historicalByCategory[category] || []
    const avgHistorical = historicalData.length > 0 
      ? historicalData.reduce((sum, amount) => sum + amount, 0) / historicalData.length
      : currentAmount

    const isNeed = needsCategories.some(need => 
      category.toLowerCase().includes(need.toLowerCase())
    )
    const isWant = wantsCategories.some(want => 
      category.toLowerCase().includes(want.toLowerCase())
    )

    let recommendedBudget = currentAmount
    let reasoning = ""
    let confidence: 'high' | 'medium' | 'low' = 'medium'

    // High confidence recommendations
    if (currentAmount > avgHistorical * 1.5 && historicalData.length >= 3) {
      // Spending significantly above historical average
      recommendedBudget = avgHistorical * 1.2
      reasoning = `Spending is 50% above your historical average. Recommend reducing to 20% above average.`
      confidence = 'high'
    } else if (isWant && currentAmount > currentIncomeTotal * 0.05) {
      // Want category taking up >5% of income
      recommendedBudget = Math.min(currentAmount * 0.8, currentIncomeTotal * 0.05)
      reasoning = `This discretionary category could be optimized to free up funds for savings.`
      confidence = 'high'
    } else if (isNeed && currentAmount > currentIncomeTotal * 0.15) {
      // Single need category taking up >15% of income
      recommendedBudget = currentAmount * 0.9
      reasoning = `This essential category is taking a large portion of income. Look for cost-saving opportunities.`
      confidence = 'medium'
    } else if (historicalData.length >= 4) {
      // Medium confidence based on trends
      const trend = calculateTrend(historicalData)
      if (trend > 0.1) {
        // Increasing trend
        recommendedBudget = avgHistorical * 1.1
        reasoning = `Spending trend is increasing. Setting budget slightly above historical average.`
        confidence = 'medium'
      } else if (trend < -0.1) {
        // Decreasing trend
        recommendedBudget = currentAmount * 0.95
        reasoning = `You've been reducing spending in this category. Continue the positive trend.`
        confidence = 'high'
      } else {
        // Stable trend
        recommendedBudget = avgHistorical
        reasoning = `Spending is stable. Budget set to historical average.`
        confidence = 'medium'
      }
    } else {
      // Low confidence - not enough data
      if (currentAmount > currentIncomeTotal * 0.1) {
        recommendedBudget = currentAmount * 0.9
        reasoning = `Limited historical data. Suggesting 10% reduction as starting point.`
        confidence = 'low'
      } else {
        continue // Skip small categories with low confidence
      }
    }

    // Only include recommendations that make sense
    if (Math.abs(currentAmount - recommendedBudget) > 10) {
      recommendations.push({
        category,
        currentSpending: currentAmount,
        recommendedBudget: Math.max(0, recommendedBudget),
        potentialSavings: currentAmount - recommendedBudget,
        confidence,
        reasoning,
      })
    }
  }

  // Add overall budget structure recommendations
  const totalNeeds = Object.entries(currentByCategory)
    .filter(([category]) => needsCategories.some(need => 
      category.toLowerCase().includes(need.toLowerCase())
    ))
    .reduce((sum, [, amount]) => sum + amount, 0)

  const totalWants = Object.entries(currentByCategory)
    .filter(([category]) => wantsCategories.some(want => 
      category.toLowerCase().includes(want.toLowerCase())
    ))
    .reduce((sum, [, amount]) => sum + amount, 0)

  // If needs are too high, suggest optimization
  if (totalNeeds > idealNeeds && currentIncomeTotal > 0) {
    recommendations.push({
      category: "Essential Expenses",
      currentSpending: totalNeeds,
      recommendedBudget: idealNeeds,
      potentialSavings: totalNeeds - idealNeeds,
      confidence: 'high',
      reasoning: `Essential expenses exceed 50% of income. Focus on reducing fixed costs and finding alternatives.`,
    })
  }

  // If wants are too high, suggest cuts
  if (totalWants > idealWants && currentIncomeTotal > 0) {
    recommendations.push({
      category: "Discretionary Spending",
      currentSpending: totalWants,
      recommendedBudget: idealWants,
      potentialSavings: totalWants - idealWants,
      confidence: 'high',
      reasoning: `Discretionary spending exceeds 30% of income. Consider reducing non-essential purchases.`,
    })
  }

  // Sort by potential savings (highest first) and limit to top recommendations
  return recommendations
    .sort((a, b) => Math.abs(b.potentialSavings) - Math.abs(a.potentialSavings))
    .slice(0, 6)
}

function groupByCategory(transactions: any[]): Record<string, number> {
  return transactions.reduce((acc, transaction) => {
    acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount
    return acc
  }, {} as Record<string, number>)
}

function groupHistoricalByCategory(transactions: any[]): Record<string, number[]> {
  const monthlyData: Record<string, Record<string, number>> = {}
  
  transactions.forEach(transaction => {
    const monthKey = `${transaction.date.getFullYear()}-${transaction.date.getMonth()}`
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {}
    }
    monthlyData[monthKey][transaction.category] = 
      (monthlyData[monthKey][transaction.category] || 0) + transaction.amount
  })

  const result: Record<string, number[]> = {}
  Object.values(monthlyData).forEach(monthData => {
    Object.entries(monthData).forEach(([category, amount]) => {
      if (!result[category]) {
        result[category] = []
      }
      result[category].push(amount)
    })
  })

  return result
}

function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0
  
  const n = values.length
  const sumX = (n * (n - 1)) / 2
  const sumY = values.reduce((sum, val) => sum + val, 0)
  const sumXY = values.reduce((sum, val, index) => sum + (index * val), 0)
  const sumX2 = values.reduce((sum, _, index) => sum + (index * index), 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const avgY = sumY / n
  
  return avgY > 0 ? slope / avgY : 0 // Return relative trend
} 