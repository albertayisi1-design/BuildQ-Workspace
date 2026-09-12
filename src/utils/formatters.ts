import { HealthStatus, Project } from '../types';

export const formatCurrency = (amount: number, currencySymbol: string = 'C$'): string => {
  if (isNaN(amount) || amount === null || amount === undefined) return `${currencySymbol}0`;
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-CA', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(abs);
  return isNegative ? `-${currencySymbol}${formatted}` : `${currencySymbol}${formatted}`;
};

export const formatCurrencyCompact = (amount: number, currencySymbol: string = 'C$'): string => {
  if (isNaN(amount) || amount === null || amount === undefined) return `${currencySymbol}0`;
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    return `${sign}${currencySymbol}${(abs / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}${currencySymbol}${(abs / 1_000).toFixed(0)}K`;
  }
  return `${sign}${currencySymbol}${abs.toLocaleString()}`;
};

export const formatNumber = (num: number, decimals: number = 0): string => {
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('en-CA', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(num);
};

export const formatPercent = (val: number, decimals: number = 1): string => {
  if (isNaN(val)) return '0%';
  return `${val.toFixed(decimals)}%`;
};

export const formatDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const calculateProjectHealth = (
  project: Project,
  actualCost: number,
  forecastCost: number,
  amberThreshold: number = 5,
  redThreshold: number = 10
): HealthStatus => {
  if (project.status === 'Planning' || project.status === 'Closed') {
    return 'GREY';
  }
  if (project.status === 'Completed') {
    return 'GREEN';
  }
  if (project.status === 'On Hold') {
    return 'AMBER';
  }

  const budget = project.approved_budget;
  if (budget <= 0) return 'GREEN';

  // Cost variance percentage based on forecast or actual
  const costToEvaluate = forecastCost > actualCost ? forecastCost : actualCost;
  const variancePct = ((costToEvaluate - budget) / budget) * 100;

  // Check schedule delay: if today is past planned completion and progress < 100
  const now = new Date();
  const plannedEnd = new Date(project.planned_completion);
  const isOverdue = now > plannedEnd && (project.progress || 0) < 95;

  if (variancePct > redThreshold || (isOverdue && variancePct > 0)) {
    return 'RED';
  }
  if (variancePct > amberThreshold || isOverdue) {
    return 'AMBER';
  }
  return 'GREEN';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0 || isNaN(bytes)) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${val.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

