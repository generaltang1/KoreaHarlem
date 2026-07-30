"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { convertKrwToMinor, getCurrency, type CurrencyCode } from "@/lib/currency";
import { useCurrency } from "@/context/CurrencyContext";

export interface CartLine {
  key: string;
  productId: string;
  title: string;
  imageUrl?: string | null;
  size?: string | null;
  quantity: number;
  /** Locked unit price in cart currency minor units */
  unitPriceMinor: number;
  /** Base KRW for re-lock when currency changes */
  priceKrw: number;
  currency: CurrencyCode;
  exchangeRate: number;
}

interface CartContextValue {
  items: CartLine[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (input: {
    productId: string;
    title: string;
    imageUrl?: string | null;
    size?: string | null;
    priceKrw: number;
    quantity?: number;
  }) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotalMinor: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "kh-cart-v1";

function lineKey(productId: string, size?: string | null) {
  return `${productId}::${size ?? ""}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { currency } = useCurrency();
  const [items, setItems] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  // Re-lock displayed/payment amounts when currency changes (from base KRW).
  useEffect(() => {
    if (!hydrated) return;
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        unitPriceMinor: convertKrwToMinor(item.priceKrw, currency),
        currency: currency.code,
        exchangeRate: currency.rateToKrw,
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency.code, currency.rateToKrw, hydrated]);

  const addItem = useCallback(
    (input: {
      productId: string;
      title: string;
      imageUrl?: string | null;
      size?: string | null;
      priceKrw: number;
      quantity?: number;
    }) => {
      const qty = input.quantity ?? 1;
      const key = lineKey(input.productId, input.size);
      const unitPriceMinor = convertKrwToMinor(input.priceKrw, currency);

      setItems((prev) => {
        const existing = prev.find((item) => item.key === key);
        if (existing) {
          return prev.map((item) =>
            item.key === key
              ? { ...item, quantity: item.quantity + qty }
              : item,
          );
        }
        return [
          ...prev,
          {
            key,
            productId: input.productId,
            title: input.title,
            imageUrl: input.imageUrl,
            size: input.size,
            quantity: qty,
            unitPriceMinor,
            priceKrw: input.priceKrw,
            currency: currency.code,
            exchangeRate: currency.rateToKrw,
          },
        ];
      });
      setIsOpen(true);
    },
    [currency],
  );

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((item) => (item.key === key ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotalMinor = items.reduce(
      (sum, item) => sum + item.unitPriceMinor * item.quantity,
      0,
    );
    return {
      items,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      toggleCart: () => setIsOpen((v) => !v),
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      subtotalMinor,
    };
  }, [items, isOpen, addItem, removeItem, updateQuantity, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function useCartCurrency() {
  const { items } = useCart();
  const code = items[0]?.currency ?? "KRW";
  return getCurrency(code);
}
