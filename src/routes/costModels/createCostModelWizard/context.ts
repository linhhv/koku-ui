/* eslint-disable @typescript-eslint/no-unused-vars */
import type { MetricHash } from 'api/metrics';
import React from 'react';
import { getAccountCurrency } from 'utils/localStorage';

export const defaultCostModelContext = {
  apiError: null,
  checked: {},
  clearQuery: () => null,
  createError: null,
  createProcess: false,
  createSuccess: false,
  currencyUnits: getAccountCurrency(),
  dataFetched: false,
  description: '',
  dirtyName: false,
  distribution: '',
  distributePlatformUnallocated: true,
  distributeWorkersUnallocated: true,
  error: null,
  fetchSources: (type: string, query: any, page: number, perPage: number) => null,
  filterName: '',
  goToAddPL: (value?: boolean) => null,
  isDiscount: false,
  handleMarkupDiscountChange: (...args: any[]) => null,
  handleDistributionChange: (...args: any[]) => null,
  handleDistributePlatformUnallocatedChange: (...args: any[]) => null,
  handleDistributeWorkersUnallocatedChange: (...args: any[]) => null,
  handleSignChange: (...args: any[]) => null,
  loading: false,
  markup: '',
  metricsHash: {} as MetricHash,
  name: '',
  onClose: () => null,
  onCurrencyChange: (value: string) => null,
  onDescChange: (value: string) => null,
  onFilterChange: (value: string) => null,
  onPageChange: (_evt, value: number) => null,
  onPerPageChange: (_evt, value: number) => null,
  onTypeChange: (value: string) => null,
  onNameChange: (value: string) => null,
  onSourceSelect: (...args: any[]) => null,
  page: 1,
  perPage: 10,
  priceListPagination: {
    page: 1,
    perPage: 4,
    onPerPageSet: (_evt, perPage: number) => null,
    onPageSet: (_evt, page: number) => null,
  },
  query: {},
  step: 1,
  setSources: (value: any) => null,
  sources: [],
  submitTiers: (tiers: any) => null,
  tiers: [],
  total: 0,
  type: '',
};

export const CostModelContext = React.createContext(defaultCostModelContext);
