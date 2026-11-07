import {
  CurrencyConverterConfig,
  SupportedCurrency,
  defaultExchangeRates,
  currencyConverterConfigSchema,
} from "../../shared/currencyConverter";
import { z } from "zod";
import { readPersistentStoreSetting, writePersistentStoreSetting } from "../services/persistentStoreSetting";

const storeCurrencyConfigs = new Map<number, CurrencyConverterConfig>();
const SETTING_KEY = "feature_currency_converter";

export async function getCurrencyConverterConfig(
  storeId: number
): Promise<CurrencyConverterConfig> {
  const existing = storeCurrencyConfigs.get(storeId);
  if (existing) return existing;

  const defaultConfig: CurrencyConverterConfig = {
    storeId,
    enabled: true,
    baseCurrency: "CHF",
    supportedCurrencies: ["CHF", "EUR", "USD", "DZD"],
    rates: defaultExchangeRates,
  };

  const persisted = await readPersistentStoreSetting(storeId, SETTING_KEY, defaultConfig);
  const config = { ...defaultConfig, ...persisted, storeId };
  storeCurrencyConfigs.set(storeId, config);
  return config;
}

export async function saveCurrencyConverterConfig(
  storeId: number,
  input: z.infer<typeof currencyConverterConfigSchema>
): Promise<CurrencyConverterConfig> {
  const current = await getCurrencyConverterConfig(storeId);

  const mergedRates = {
    ...current.rates,
    ...(input.rates || {}),
  } as Record<SupportedCurrency, number>;

  const updated: CurrencyConverterConfig = {
    ...current,
    enabled: input.enabled,
    baseCurrency: input.baseCurrency as SupportedCurrency,
    supportedCurrencies: input.supportedCurrencies as SupportedCurrency[],
    rates: mergedRates,
    storeId,
  };

  storeCurrencyConfigs.set(storeId, updated);
  return await writePersistentStoreSetting(storeId, SETTING_KEY, updated, "Configuration du convertisseur multi-devises isolée par boutique");
}
