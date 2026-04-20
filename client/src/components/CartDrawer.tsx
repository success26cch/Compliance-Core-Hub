import { useCart, type CartItem } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function CartDrawer() {
  const { items, removeItem, updateQuantity, clearCart, isOpen, setIsOpen, itemCount, monthlyTotal, oneTimeTotal } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [checkingOut, setCheckingOut] = useState(false);

  const subscriptionItems = items.filter(i => i.interval === "month");
  const oneTimeItems = items.filter(i => !i.interval);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    setCheckingOut(true);
    try {
      const cartItems = items.map(item => ({
        productId: item.id,
        name: item.name,
        unitAmount: item.unitAmount,
        currency: item.currency,
        interval: item.interval || null,
        quantity: item.quantity,
        mode: item.interval ? "subscription" : "payment",
      }));

      const res = await apiRequest("POST", "/api/stripe/checkout-cart", { items: cartItems });
      const data = await res.json();

      if (data.url) {
        clearCart();
        window.location.href = data.url;
      } else {
        toast({ title: "Checkout Error", description: data.message || "Unable to start checkout", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Checkout Error", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setCheckingOut(false);
    }
  };

  const formatAmount = (cents: number) => {
    return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="flex flex-col w-full sm:max-w-md" data-testid="cart-drawer">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Your Cart
            {itemCount > 0 && (
              <Badge variant="secondary" className="ml-auto" data-testid="badge-cart-count">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground" data-testid="text-cart-empty">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Your cart is empty</p>
              <p className="text-sm mt-1">Browse our plans and services to get started.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {subscriptionItems.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Monthly Subscriptions
                  </h3>
                  <div className="space-y-3">
                    {subscriptionItems.map(item => (
                      <CartItemRow key={item.id} item={item} onRemove={removeItem} onUpdateQuantity={updateQuantity} formatAmount={formatAmount} />
                    ))}
                  </div>
                </div>
              )}

              {subscriptionItems.length > 0 && oneTimeItems.length > 0 && <Separator />}

              {oneTimeItems.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    One-Time Purchases
                  </h3>
                  <div className="space-y-3">
                    {oneTimeItems.map(item => (
                      <CartItemRow key={item.id} item={item} onRemove={removeItem} onUpdateQuantity={updateQuantity} formatAmount={formatAmount} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t pt-4 space-y-4">
            <div className="space-y-2">
              {monthlyTotal > 0 && (
                <div className="flex justify-between text-sm" data-testid="text-monthly-total">
                  <span className="text-muted-foreground">Monthly Total</span>
                  <span className="font-semibold">{formatAmount(monthlyTotal)}/mo</span>
                </div>
              )}
              {oneTimeTotal > 0 && (
                <div className="flex justify-between text-sm" data-testid="text-onetime-total">
                  <span className="text-muted-foreground">One-Time Total</span>
                  <span className="font-semibold">{formatAmount(oneTimeTotal)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold" data-testid="text-cart-total">
                <span>Due Today</span>
                <span>{formatAmount(monthlyTotal + oneTimeTotal)}</span>
              </div>
              {monthlyTotal > 0 && (
                <p className="text-xs text-muted-foreground">
                  Subscriptions renew monthly. Cancel anytime.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={checkingOut}
                data-testid="button-checkout"
              >
                {checkingOut ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                {isAuthenticated ? "Proceed to Checkout" : "Sign In to Checkout"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={clearCart}
                data-testid="button-clear-cart"
              >
                Clear Cart
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function CartItemRow({
  item,
  onRemove,
  onUpdateQuantity,
  formatAmount,
}: {
  item: CartItem;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, qty: number) => void;
  formatAmount: (cents: number) => string;
}) {
  const isSubscription = !!item.interval;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30" data-testid={`cart-item-${item.id}`}>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium truncate">{item.name}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-semibold text-primary">
            {formatAmount(item.unitAmount * item.quantity)}
            {isSubscription && <span className="text-muted-foreground font-normal">/mo</span>}
          </span>
          {item.quantity > 1 && (
            <span className="text-xs text-muted-foreground">
              ({formatAmount(item.unitAmount)} each)
            </span>
          )}
        </div>
        <Badge variant="secondary" className="mt-1 text-xs">
          {item.category}
        </Badge>
      </div>

      <div className="flex items-center gap-1">
        {!isSubscription && (
          <>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              data-testid={`button-decrease-${item.id}`}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="text-sm font-medium w-6 text-center" data-testid={`text-qty-${item.id}`}>
              {item.quantity}
            </span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              data-testid={`button-increase-${item.id}`}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </>
        )}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onRemove(item.id)}
          data-testid={`button-remove-${item.id}`}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export function CartTrigger() {
  const { setIsOpen, itemCount } = useCart();

  return (
    <Button
      size="icon"
      variant="ghost"
      className="relative"
      onClick={() => setIsOpen(true)}
      data-testid="button-cart-trigger"
    >
      <ShoppingCart className="w-5 h-5" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold" data-testid="badge-cart-trigger-count">
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      )}
    </Button>
  );
}
