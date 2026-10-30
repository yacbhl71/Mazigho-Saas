import { useState } from "react";
import { Coins, ChevronDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { SupportedCurrency } from "@shared/currencyConverter";

interface MultiCurrencyHeaderSelectorProps {
  currentCurrency: SupportedCurrency;
  onCurrencyChange: (currency: SupportedCurrency) => void;
}

export default function MultiCurrencyHeaderSelector({
  currentCurrency,
  onCurrencyChange,
}: MultiCurrencyHeaderSelectorProps) {
  const configQuery = trpc.currencyConverter.getConfig.useQuery();
  const config = configQuery.data;

  if (!config || !config.enabled || !config.supportedCurrencies) {
    return null;
  }

  const getCurrencyFlag = (curr: SupportedCurrency) => {
    switch (curr) {
      case "CHF": return "🇨🇭";
      case "EUR": return "🇪🇺";
      case "USD": return "🇺🇸";
      case "DZD": return "🇩🇿";
      case "GBP": return "🇬🇧";
      case "CAD": return "🇨🇦";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold hover:bg-slate-50 transition-colors">
        <span>{getCurrencyFlag(currentCurrency)}</span>
        <span>{currentCurrency}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-32">
        {config.supportedCurrencies.map((curr) => (
          <DropdownMenuItem
            key={curr}
            onClick={() => onCurrencyChange(curr as SupportedCurrency)}
            className="text-xs font-semibold flex items-center justify-between cursor-pointer"
          >
            <span>{getCurrencyFlag(curr as SupportedCurrency)} {curr}</span>
            {currentCurrency === curr && <span className="text-indigo-600 font-bold">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
