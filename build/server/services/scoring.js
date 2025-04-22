// Optimized scoring service with memoization and performance improvements
const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

const calculateStandardDeviation = (arr) => {
  if (arr.length <= 1) return 0;
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
  const sq = arr.map(v => (v - mean) ** 2);
  return Math.sqrt(sq.reduce((s, v) => s + v, 0) / sq.length);
};

const identifyRecurringPatterns = memoize((transactions) => {
  if (transactions.length < 2) return [];
  
  // Group by amount ranges to handle slight variations
  const groups = {};
  transactions.forEach(tx => {
    const key = `amt_${Math.round(tx.amount / 10) * 10}`;
    (groups[key] || (groups[key] = [])).push(tx);
  });
  
  const patterns = [];
  Object.values(groups).forEach(group => {
    if (group.length < 2) return;
    
    // Pre-calculate dates once
    const dates = group.map(tx => new Date(tx.date).getTime());
    dates.sort((a, b) => a - b);
    
    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      intervals.push(Math.round((dates[i] - dates[i - 1]) / 86400000));
    }
    
    const avgInt = intervals.reduce((s, v) => s + v, 0) / intervals.length;
    let freq = 'irregular';
    
    if (avgInt >= 25 && avgInt <= 35) freq = 'monthly';
    else if (avgInt >= 12 && avgInt <= 16) freq = 'semimonthly';
    else if (avgInt >= 10 && avgInt <= 18) freq = 'biweekly';
    else if (avgInt >= 5 && avgInt <= 9) freq = 'weekly';
    
    const avgAmt = group.reduce((s, tx) => s + tx.amount, 0) / group.length;
    const std = calculateStandardDeviation(intervals);
    
    if (std / avgInt < 0.25 || group.length >= 3) {
      patterns.push({ frequency: freq, averageAmount: avgAmt });
    }
  });
  
  return patterns;
});

const getCreditScore = memoize((prefi) => {
  const offers = prefi.Offers || [];
  const scores = offers.map(o => Number(o.Score)).filter(n => !isNaN(n));
  return scores.length ? Math.max(...scores) : 0;
});

const scoreCreditScore = memoize((prefi) => {
  const cs = getCreditScore(prefi);
  if (cs >= 800) return 5;
  if (cs >= 720) return 4;
  if (cs >= 650) return 3;
  if (cs >= 600) return 2;
  return 1;
});

const scoreDTI = memoize((prefi) => {
  const dti = prefi.DataEnhance?.DebtToIncome || 0;
  if (dti < 0.15) return 5;
  if (dti < 0.20) return 4;
  if (dti <= 0.35) return 3;
  if (dti <= 0.45) return 2;
  return 1;
});

const getDelinquencyInfo = memoize((prefi, plaid) => {
  const lateDates = [];
  let major = false;
  
  const items = (plaid.report?.items) || plaid.items || [];
  
  // Use a single loop to process all transactions
  const allTransactions = [];
  items.forEach(item => {
    (item.accounts || []).forEach(acct => {
      (acct.transactions || []).forEach(tx => allTransactions.push(tx));
    });
  });
  
  allTransactions.forEach(tx => {
    const cats = (tx.category || []).map(c => c.toLowerCase());
    const m = (tx.merchant_name || '').toLowerCase();
    
    if (cats.includes('bank fees') || /late fee/i.test(m)) {
      lateDates.push(new Date(tx.date));
    }
    
    if (/charge[- ]off|repossession|bankruptcy/i.test(tx.original_description || '')) {
      major = true;
      lateDates.push(new Date(tx.date));
    }
  });
  
  const now = Date.now();
  const twoYr = now - 2 * 31557600000;
  const times = lateDates.map(d => d.getTime()).sort();
  const yrsSince = times.length ? (now - times[times.length - 1]) / 31557600000 : Infinity;
  const count2 = lateDates.filter(d => d.getTime() >= twoYr).length;
  
  return {
    yearsSinceLastLate: yrsSince,
    hasMajorDelinquency: major,
    lateCountLast2Years: count2,
    multipleRecentLates: count2 > 2,
    oneMajorDelinquency: major
  };
});

const scoreAdverseHistory = memoize((prefi, plaid) => {
  const info = getDelinquencyInfo(prefi, plaid);
  
  if (info.yearsSinceLastLate >= 5 && !info.hasMajorDelinquency) return 5;
  if (!info.hasMajorDelinquency && info.yearsSinceLastLate >= 2) return 4;
  if (info.lateCountLast2Years <= 2) return 3;
  if (info.multipleRecentLates || info.oneMajorDelinquency) return 2;
  return 1;
});

const estimateEmploymentYears = memoize((plaid) => {
  const dates = [];
  const items = (plaid.report?.items) || plaid.items || [];
  
  // Use a single loop to process all transactions
  const allTransactions = [];
  items.forEach(item => {
    (item.accounts || []).forEach(acct => {
      (acct.transactions || []).forEach(tx => allTransactions.push(tx));
    });
  });
  
  allTransactions.forEach(tx => {
    const cats = (tx.category || []).map(c => c.toLowerCase());
    const det = (tx.credit_category?.detailed || '').toLowerCase();
    
    if (cats.includes('payroll') || /salary/i.test(det)) {
      dates.push(new Date(tx.date));
    }
  });
  
  if (dates.length < 2) return 0;
  dates.sort((a, b) => a - b);
  return (dates[dates.length - 1] - dates[0]) / 31557600000;
});

const isSelfEmployed = memoize((plaid) => {
  const items = (plaid.report?.items) || plaid.items || [];
  
  // Use a single loop to process all transactions
  const allTransactions = [];
  items.forEach(item => {
    (item.accounts || []).forEach(acct => {
      (acct.transactions || []).forEach(tx => allTransactions.push(tx));
    });
  });
  
  return allTransactions.some(tx => 
    (tx.credit_category?.primary || '').toLowerCase() === 'income' && 
    !(tx.category || []).map(c => c.toLowerCase()).includes('payroll')
  );
});

const isRetired = memoize((prefi, plaid) => {
  const assets = prefi.DataPerfection?.Assets?.Retirement || 0;
  
  const items = (plaid.report?.items) || plaid.items || [];
  
  // Use a single loop to process all transactions
  const allTransactions = [];
  items.forEach(item => {
    (item.accounts || []).forEach(acct => {
      (acct.transactions || []).forEach(tx => allTransactions.push(tx));
    });
  });
  
  const hasInc = allTransactions.some(tx => 
    (tx.credit_category?.primary || '').toLowerCase() === 'income'
  );
  
  return assets > 0 && !hasInc;
});

const scoreEmploymentHistory = memoize((prefi, plaid) => {
  const yrs = estimateEmploymentYears(plaid);
  
  if (yrs >= 4) return 5;
  if (yrs >= 1) return 4;
  if (isSelfEmployed(plaid)) return 3;
  if (isRetired(prefi, plaid)) return 2;
  return 1;
});

const scoreHousingStatus = memoize((plaid) => {
  const rentCats = new Set(['rent', 'mortgage']);
  const dates = [];
  
  const items = (plaid.report?.items) || plaid.items || [];
  
  // Use a single loop to process all transactions
  const allTransactions = [];
  items.forEach(item => {
    (item.accounts || []).forEach(acct => {
      (acct.transactions || []).forEach(tx => allTransactions.push(tx));
    });
  });
  
  allTransactions.forEach(tx => {
    if ((tx.category || []).map(c => c.toLowerCase()).some(c => rentCats.has(c))) {
      dates.push(new Date(tx.date));
    }
  });
  
  if (!dates.length) return 3;
  dates.sort((a, b) => a - b);
  
  let gaps = 0;
  for (let i = 1; i < dates.length; i++) {
    if ((dates[i] - dates[i - 1]) / 86400000 > 35) gaps++;
  }
  
  if (gaps === 0) return 5;
  if (gaps === 1) return 3;
  return 1;
});

const scoreSpendingBehaviorBayesian = memoize((plaid) => {
  const disc = new Set(['travel', 'shops', 'entertainment']);
  
  const items = (plaid.report?.items) || plaid.items || [];
  
  let total = 0;
  let discAmt = 0;
  
  // Use a single loop to process all transactions
  const allTransactions = [];
  items.forEach(item => {
    (item.accounts || []).forEach(acct => {
      (acct.transactions || []).forEach(tx => allTransactions.push(tx));
    });
  });
  
  allTransactions.forEach(tx => {
    if (typeof tx.amount === 'number' && tx.amount > 0) {
      total += tx.amount;
      if (disc.has((tx.credit_category?.primary || '').toLowerCase())) {
        discAmt += tx.amount;
      }
    }
  });
  
  const ratio = total ? discAmt / total : 0;
  
  if (ratio < 0.2) return 5;
  if (ratio < 0.4) return 4;
  if (ratio < 0.6) return 3;
  if (ratio < 0.8) return 2;
  return 1;
});

const scoreRepaymentBehaviorBayesian = memoize((prefi, plaid) => {
  const n = getDelinquencyInfo(prefi, plaid).lateCountLast2Years;
  
  if (!n) return 5;
  if (n <= 2) return 4;
  if (n <= 4) return 3;
  if (n <= 6) return 2;
  return 1;
});

const scoreBehavioralIndicatorsBayesian = memoize((plaid) => {
  const avg = computeAverageMonthlyIncome(plaid);
  
  const items = (plaid.report?.items) || plaid.items || [];
  
  let waste = 0;
  
  // Use a single loop to process all transactions
  const allTransactions = [];
  items.forEach(item => {
    (item.accounts || []).forEach(acct => {
      (acct.transactions || []).forEach(tx => allTransactions.push(tx));
    });
  });
  
  allTransactions.forEach(tx => {
    if (typeof tx.amount === 'number' && tx.amount > 0 && avg && tx.amount > avg * 0.2) {
      waste++;
    }
  });
  
  if (!waste) return 5;
  if (waste <= 2) return 3;
  return 1;
});

// Process all transactions in a single pass for better performance
const processAllTransactions = (plaid) => {
  const items = (plaid.report?.items) || plaid.items || [];
  const accountTransactionLog = {};
  const allDates = [];
  const allIncome = [];
  
  items.forEach(item => {
    (item.accounts || []).forEach(acct => {
      const id = acct.account_id || acct.id || `Account-${Math.random().toString(36).slice(2)}`;
      const name = acct.name || acct.official_name || acct.mask || id;
      
      accountTransactionLog[id] = {
        name,
        income_transactions: []
      };
      
      (acct.transactions || []).forEach(tx => {
        const txDate = new Date(tx.date);
        allDates.push(txDate);
        
        const cats = (tx.category || []).map(c => c.toLowerCase());
        const det = (tx.credit_category?.detailed || '').toLowerCase();
        
        if (tx.amount < 0 || (cats.includes('income') || cats.includes('payroll') || /salary|income/i.test(det))) {
          const amount = Math.abs(tx.amount);
          
          const incomeTx = {
            date: txDate,
            amount,
            description: tx.name || tx.original_description || tx.merchant_name || 'Unknown'
          };
          
          accountTransactionLog[id].income_transactions.push(incomeTx);
          allIncome.push(incomeTx);
        }
      });
    });
  });
  
  return { accountTransactionLog, allDates, allIncome };
};

const computeAverageMonthlyIncome = memoize((plaid) => {
  const { accountTransactionLog, allDates, allIncome } = processAllTransactions(plaid);
  
  if (allDates.length < 2) return 0;
  
  allDates.sort((a, b) => a - b);
  const firstDate = allDates[0];
  const lastDate = allDates[allDates.length - 1];
  const monthsSpan = (lastDate - firstDate) / (30 * 24 * 60 * 60 * 1000);
  
  const totalIncome = allIncome.reduce((sum, tx) => sum + tx.amount, 0);
  
  const patterns = identifyRecurringPatterns(allIncome);
  let patternTotal = 0;
  
  patterns.forEach(p => {
    let multiplier = 1;
    if (p.frequency === 'weekly') multiplier = 4.33;
    else if (p.frequency === 'biweekly') multiplier = 2.17;
    else if (p.frequency === 'semimonthly') multiplier = 2;
    
    patternTotal += p.averageAmount * multiplier;
  });
  
  // If we have patterns, use that as our estimate
  if (patternTotal > 0) {
    return patternTotal;
  }
  
  // Otherwise, use simple average if we have at least 2 months of data
  if (monthsSpan >= 2) {
    return totalIncome / monthsSpan;
  }
  
  return 0;
});

const scoreIncome = memoize((prefi, plaid) => {
  const monthlyHeuristic = computeAverageMonthlyIncome(plaid) || 0;
  const staticAnnual = prefi.DataPerfection?.Income?.Personal || 0;
  const staticMonthly = staticAnnual / 12;
  const inc = Math.max(monthlyHeuristic, staticMonthly);
  
  if (inc >= 100000 / 12) return 5;
  if (inc >= 75000 / 12) return 4;
  if (inc >= 50000 / 12) return 3;
  if (inc >= 35000 / 12) return 2;
  return 1;
});

const getDebitsAndTotal = memoize((plaid) => {
  const allDebits = [];
  let totalDebits = 0;
  
  const items = (plaid.report?.items) || plaid.items || [];
  
  // Use a single loop to process all transactions
  const allTransactions = [];
  const accountNames = {};
  
  items.forEach(item => {
    (item.accounts || []).forEach(acct => {
      const acctName = acct.name || acct.official_name || acct.mask || 'Unknown Account';
      const acctId = acct.account_id || acct.id;
      accountNames[acctId] = acctName;
      
      (acct.transactions || []).forEach(tx => {
        tx.accountId = acctId;
        allTransactions.push(tx);
      });
    });
  });
  
  allTransactions.forEach(tx => {
    if (tx.amount > 0) {
      allDebits.push({
        date: new Date(tx.date),
        account: accountNames[tx.accountId],
        desc: tx.name || tx.original_description || tx.merchant_name || 'Unknown',
        amount: tx.amount
      });
      
      totalDebits += tx.amount;
    }
  });
  
  allDebits.sort((a, b) => b.amount - a.amount);
  
  return { allDebits, totalDebits };
});

const calculateScores = (prefi, plaid) => {
  // Calculate core scores
  const creditScore = scoreCreditScore(prefi);
  const incomeScore = scoreIncome(prefi, plaid);
  const employmentScore = scoreEmploymentHistory(prefi, plaid);
  const dtiScore = scoreDTI(prefi);
  const adverseScore = scoreAdverseHistory(prefi, plaid);
  const housingScore = scoreHousingStatus(plaid);
  
  const coreScore = creditScore + incomeScore + employmentScore + dtiScore + adverseScore + housingScore;
  
  // Calculate bayesian scores
  const spendingScore = scoreSpendingBehaviorBayesian(plaid);
  const repaymentScore = scoreRepaymentBehaviorBayesian(prefi, plaid);
  const behavioralScore = scoreBehavioralIndicatorsBayesian(plaid);
  
  const bayesianScore = spendingScore + repaymentScore + behavioralScore;
  
  // Calculate total score
  const totalScore = coreScore + bayesianScore;
  
  // Get monthly income
  const monthlyHeuristic = computeAverageMonthlyIncome(plaid) || 0;
  const staticAnnual = prefi.DataPerfection?.Income?.Personal || 0;
  const staticMonthly = staticAnnual / 12;
  const monthlyIncome = Math.max(monthlyHeuristic, staticMonthly);
  
  // Get simple monthly income (total deposits ÷ 24)
  const { allIncome } = processAllTransactions(plaid);
  const totalIncome = allIncome.reduce((sum, tx) => sum + tx.amount, 0);
  const simpleMonthlyIncome = totalIncome / 24;
  
  // Get personal information
  const name = prefi.DataPerfection?.Name?.Full || '';
  const emails = prefi.DataPerfection?.Emails || [];
  const phones = prefi.DataPerfection?.Phones || [];
  
  // Get raw values for details
  const rawCreditScore = getCreditScore(prefi);
  const dti = prefi.DataEnhance?.DebtToIncome || 0;
  const employmentYears = estimateEmploymentYears(plaid);
  const delinquencyInfo = getDelinquencyInfo(prefi, plaid);
  
  return {
    coreScore,
    bayesianScore,
    totalScore,
    simpleMonthlyIncome,
    name,
    emails,
    phones,
    details: {
      rawCreditScore,
      dti,
      employmentYears,
      lateCountLast2Years: delinquencyInfo.lateCountLast2Years,
      hasMajorDelinquency: delinquencyInfo.hasMajorDelinquency,
      
      // Sub-scores
      creditScore,
      incomeScore,
      employmentScore,
      dtiScore,
      adverseScore,
      housingScore,
      spendingScore,
      repaymentScore,
      behavioralScore,
      
      // Income details
      monthlyIncome,
      staticAnnual,
      heuristicMonthlyIncome: monthlyHeuristic
    }
  };
};

const getAccountTransactionLog = (plaid) => {
  const { accountTransactionLog } = processAllTransactions(plaid);
  return accountTransactionLog;
};

module.exports = {
  calculateScores,
  getCreditScore,
  scoreCreditScore,
  scoreIncome,
  scoreEmploymentHistory,
  scoreDTI,
  scoreAdverseHistory,
  scoreHousingStatus,
  scoreSpendingBehaviorBayesian,
  scoreRepaymentBehaviorBayesian,
  scoreBehavioralIndicatorsBayesian,
  computeAverageMonthlyIncome,
  getDebitsAndTotal,
  getDelinquencyInfo,
  identifyRecurringPatterns,
  getAccountTransactionLog
};
