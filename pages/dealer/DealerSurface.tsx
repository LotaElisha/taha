import * as React from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import {
  Order,
  Product,
  Tool,
  ToolBooking,
  Agrodealer,
  Agrovet,
} from "../../types";
import { AppShell, AppBar, type NavItem } from "../../components/app-shell";
import { OfflineBanner } from "../../components/feedback/OfflineBanner";
import { Button } from "../../components/ui/button";
import { EmptyState } from "../../components/feedback/EmptyState";
import { StatusChip } from "../../components/feedback/StatusChip";
import { Badge } from "../../components/ui/badge";
import { PriceTag } from "../../components/feedback/PriceTag";
import ProductIcon from "../../components/ProductIcon";
import BusinessProfileSettings from "../../components/BusinessProfileSettings";
import { toast } from "../../components/ui/sonner";
import { useAuth } from "../../context/AuthContext";
import { DealerToday } from "./DealerToday";
import { PosRegister } from "./PosRegister";
import { useRealtime } from "../../hooks/useRealtime";
import { formatRelativeDate } from "../../lib/utils";
import { api } from "../../services/api";
import { ResponsiveDialog } from "../../components/feedback/ResponsiveDialog";


interface DealerSurfaceProps {
  vendor: Agrodealer | Agrovet;
  allProducts: Product[];
  setProducts: (next: Product[] | ((prev: Product[]) => Product[])) => void;
  orders: Order[];
  setOrders: (next: Order[] | ((prev: Order[]) => Order[])) => void;
  tools: Tool[];
  setTools: (next: Tool[] | ((prev: Tool[]) => Tool[])) => void;
  toolBookings: ToolBooking[];
  setToolBookings: (
    next: ToolBooking[] | ((prev: ToolBooking[]) => ToolBooking[])
  ) => void;
}

/**
 * DealerSurface — `/dealer/*` routed sub-app for Agrodealer + Agrovet.
 */
export function DealerSurface(p: DealerSurfaceProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [posOpen, setPosOpen] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const { updateUserAuthData } = useAuth();
  useRealtime();

  const vendorProducts = React.useMemo(
    () => p.allProducts.filter((x) => x.vendor.id === p.vendor.id),
    [p.allProducts, p.vendor.id]
  );
  const vendorOrders = React.useMemo(
    () =>
      p.orders
        .filter((o) =>
          o.items.some((i) => i.product.vendor.id === p.vendor.id)
        )
        .sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [p.orders, p.vendor.id]
  );

  const activeNavId: string = location.pathname.startsWith("/dealer/products")
    ? "products"
    : location.pathname.startsWith("/dealer/orders")
      ? "orders"
      : location.pathname.startsWith("/dealer/profile")
        ? "profile"
        : "today";

  const nav: NavItem[] = [
    { id: "today", label: "Today", icon: <HomeIcon />, onClick: () => navigate("/dealer") },
    { id: "products", label: "Products", icon: <BoxIcon />, onClick: () => navigate("/dealer/products") },
    { id: "pos", label: "POS", icon: <RegisterIcon />, fab: true, onClick: () => setPosOpen(true) },
    { id: "orders", label: "Orders", icon: <ListIcon />, onClick: () => navigate("/dealer/orders") },
    { id: "profile", label: "Profile", icon: <UserIcon />, onClick: () => navigate("/dealer/profile") },
  ];

  return (
    <AppShell
      appBar={
        <AppBar
          leading={
            <button
              type="button"
              onClick={() => navigate("/dealer")}
              className="flex items-center gap-2 px-1"
              aria-label="Today"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-700 text-white" aria-hidden>
                <LeafIcon />
              </span>
              <span className="text-base font-semibold text-fg">Mkulima · Dealer</span>
            </button>
          }
          trailing={
            <button
              type="button"
              onClick={() => setPosOpen(true)}
              className="hidden h-9 items-center gap-1 rounded-full bg-brand-600 px-3 text-xs font-medium text-white sm:inline-flex"
            >
              <RegisterIcon /> Open POS
            </button>
          }
        />
      }
      navItems={nav}
      activeNavId={activeNavId}
    >
      <OfflineBanner />
      <Routes>
        <Route index element={<Navigate to="/dealer" replace />} />
        <Route
          path="dealer"
          element={
            <DealerToday
              orders={p.orders}
              products={p.allProducts}
              onOpenPos={() => setPosOpen(true)}
            />
          }
        />
        <Route
          path="dealer/products"
          element={
            <ProductsList
              products={vendorProducts}
              onAdd={() => {
                setSelectedProduct(null);
                setFormOpen(true);
              }}
              onEdit={(prod) => {
                setSelectedProduct(prod);
                setFormOpen(true);
              }}
              onDelete={async (id) => {
                const res = await api.products.delete(id);
                if (res.success) {
                  p.setProducts((prev) => prev.filter((x) => x.id !== id));
                  toast.success("Product deleted successfully.");
                } else {
                  toast.error(res.error || "Failed to delete product.");
                }
              }}
            />
          }
        />
        <Route
          path="dealer/orders"
          element={<OrdersList orders={vendorOrders} setOrders={p.setOrders} />}
        />
        <Route
          path="dealer/profile"
          element={
            <div className="mx-auto w-full max-w-3xl px-4 py-4">
              <BusinessProfileSettings
                user={p.vendor}
                onSave={(updates) => updateUserAuthData(updates)}
              />
            </div>
          }
        />
        <Route path="*" element={<Navigate to="/dealer" replace />} />
      </Routes>

      <PosRegister
        isOpen={posOpen}
        onClose={() => setPosOpen(false)}
        vendor={p.vendor}
        vendorProducts={vendorProducts}
        setProducts={p.setProducts}
        setOrders={p.setOrders}
      />

      <ProductFormDialog
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onSave={(savedProduct) => {
          if (selectedProduct) {
            // Edit flow
            p.setProducts((prev) =>
              prev.map((x) => (x.id === savedProduct.id ? savedProduct : x))
            );
          } else {
            // Add flow
            p.setProducts((prev) => [...prev, savedProduct]);
          }
        }}
      />
    </AppShell>
  );
}

/* ----------------------------- Products list ----------------------------- */
function ProductsList({
  products,
  onDelete,
  onAdd,
  onEdit,
}: {
  products: Product[];
  onDelete: (id: string) => void;
  onAdd: () => void;
  onEdit: (product: Product) => void;
}) {
  if (products.length === 0) {
    return (
      <EmptyState
        className="py-16"
        title="No products listed yet"
        body="Add your first SKU so farmers can find it on the marketplace."
        action={<Button variant="primary" onClick={onAdd}>+ Add product</Button>}
      />
    );
  }
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-fg">Products</h1>
        <Button variant="primary" size="sm" onClick={onAdd}>+ Add product</Button>
      </div>
      <ul className="flex flex-col gap-2">
        {products.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-3 rounded-md border border-border bg-surface p-3"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700">
              <ProductIcon category={p.category} className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-fg">{p.name}</p>
                {!!(p.isFeatured || p.is_featured) && (
                  <Badge variant="default" className="bg-brand-100 text-brand-800 text-[10px] py-0 px-1">Featured</Badge>
                )}
              </div>
              <p className="text-xs text-muted">{p.category}</p>
              <div className="mt-1 flex items-center gap-2">
                {p.stock <= 0 ? (
                  <Badge variant="danger">Out of stock</Badge>
                ) : p.stock < 10 ? (
                  <Badge variant="warning">Low · {p.stock}</Badge>
                ) : (
                  <Badge variant="default">Stock {p.stock}</Badge>
                )}
                <PriceTag value={p.price} size="sm" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onEdit(p)}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(p.id)}
                className="text-xs font-medium text-muted hover:text-danger"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------- Product Form Dialog -------------------------- */
interface ProductFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSave: (savedProduct: Product) => void;
}

export function ProductFormDialog({
  isOpen,
  onClose,
  product,
  onSave,
}: ProductFormDialogProps) {
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState<Product["category"]>("Seeds");
  const [price, setPrice] = React.useState("");
  const [stock, setStock] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [barcode, setBarcode] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [isFeatured, setIsFeatured] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (product) {
      setName(product.name || "");
      setCategory(product.category || "Seeds");
      setPrice(product.price ? String(product.price) : "");
      setStock(product.stock !== undefined ? String(product.stock) : "");
      setDescription(product.description || "");
      setBarcode(product.barcode || "");
      setImageUrl(product.imageUrl || product.image_url || "");
      setIsFeatured(!!(product.isFeatured || product.is_featured));
    } else {
      setName("");
      setCategory("Seeds");
      setPrice("");
      setStock("");
      setDescription("");
      setBarcode("");
      setImageUrl("");
      setIsFeatured(false);
    }
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Product name is required.");
      return;
    }
    if (!price || Number(price) < 0) {
      toast.error("Please enter a valid price.");
      return;
    }
    if (!stock || Number(stock) < 0) {
      toast.error("Please enter a valid stock amount.");
      return;
    }

    setSubmitting(true);
    const payload = {
      name: name.trim(),
      category,
      price: Number(price),
      stock: Number(stock),
      description: description.trim() || undefined,
      barcode: barcode.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      image_url: imageUrl.trim() || undefined,
      isFeatured,
      is_featured: isFeatured,
    };

    try {
      if (product) {
        // Edit mode
        const res = await api.products.update(product.id, payload);
        if (res.success && res.data) {
          toast.success("Product updated successfully.");
          onSave(res.data);
          onClose();
        } else {
          toast.error(res.error || "Failed to update product.");
        }
      } else {
        // Add mode
        const res = await api.products.create(payload);
        if (res.success && res.data) {
          toast.success("Product added successfully.");
          onSave(res.data);
          onClose();
        } else {
          toast.error(res.error || "Failed to add product.");
        }
      }
    } catch (err) {
      toast.error("An unexpected error occurred.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={product ? "Edit Product" : "Add Product"}
      description={product ? "Update your product details in the catalog." : "List a new product in the marketplace."}
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2 text-left">
        <div>
          <label htmlFor="prod-name" className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
            Product Name <span className="text-danger">*</span>
          </label>
          <input
            id="prod-name"
            type="text"
            required
            placeholder="e.g. Premium Maize Seeds"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:border-brand-500 focus:outline-none"
            disabled={submitting}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="prod-price" className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
              Price (TZS) <span className="text-danger">*</span>
            </label>
            <input
              id="prod-price"
              type="number"
              required
              min="0"
              placeholder="e.g. 15000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:border-brand-500 focus:outline-none"
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="prod-stock" className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
              Stock <span className="text-danger">*</span>
            </label>
            <input
              id="prod-stock"
              type="number"
              required
              min="0"
              placeholder="e.g. 50"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:border-brand-500 focus:outline-none"
              disabled={submitting}
            />
          </div>
        </div>

        <div>
          <label htmlFor="prod-category" className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
            Category <span className="text-danger">*</span>
          </label>
          <select
            id="prod-category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value as Product["category"])}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:border-brand-500 focus:outline-none"
            disabled={submitting}
          >
            <option value="Seeds">Seeds</option>
            <option value="Fertilizers">Fertilizers</option>
            <option value="Pesticides">Pesticides</option>
            <option value="Tools">Tools</option>
            <option value="Animal Medicine">Animal Medicine</option>
            <option value="Agrovet Services">Agrovet Services</option>
          </select>
        </div>

        <div>
          <label htmlFor="prod-image" className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
            Image URL
          </label>
          <input
            id="prod-image"
            type="text"
            placeholder="e.g. https://picsum.photos/seed/maize/300/300"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:border-brand-500 focus:outline-none"
            disabled={submitting}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="prod-barcode" className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
              Barcode / SKU
            </label>
            <input
              id="prod-barcode"
              type="text"
              placeholder="e.g. 61511000"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:border-brand-500 focus:outline-none"
              disabled={submitting}
            />
          </div>
          <div className="flex items-center pt-5">
            <input
              id="prod-featured"
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
              disabled={submitting}
            />
            <label htmlFor="prod-featured" className="ml-2 text-sm font-medium text-fg">
              Featured on homepage
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="prod-desc" className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
            Description
          </label>
          <textarea
            id="prod-desc"
            rows={3}
            placeholder="Provide a detailed description of the product, crop advice, application rates, etc."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:border-brand-500 focus:outline-none"
            disabled={submitting}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Saving..." : "Save Product"}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}

/* ------------------------------ Orders list ----------------------------- */
function OrdersList({
  orders,
  setOrders,
}: {
  orders: Order[];
  setOrders: (next: Order[] | ((prev: Order[]) => Order[])) => void;
}) {
  if (orders.length === 0) {
    return (
      <EmptyState
        className="py-16"
        title="No orders yet"
        body="When farmers buy your products you'll see them here."
      />
    );
  }
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-4">
      <h1 className="mb-3 text-xl font-semibold text-fg">Orders</h1>
      <ul className="flex flex-col gap-2">
        {orders.map((o) => (
          <li
            key={o.id}
            className="rounded-md border border-border bg-surface p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-fg">
                #{o.id.slice(-6)} · {o.items.length} item
                {o.items.length === 1 ? "" : "s"}
              </p>
              <StatusChip status={mapStatus(o.status)} />
            </div>
            <p className="mt-0.5 text-xs text-muted">
              {formatRelativeDate(o.date)} · {o.channel === "pos" ? "POS sale" : "Online"}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <PriceTag value={o.total} size="sm" />
              {o.status === "Processing" ? (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() =>
                    setOrders((prev) =>
                      prev.map((x) =>
                        x.id === o.id ? { ...x, status: "Shipped" } : x
                      )
                    )
                  }
                >
                  Confirm
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function mapStatus(s: Order["status"]) {
  switch (s) {
    case "Processing":
      return "processing" as const;
    case "Shipped":
      return "shipped" as const;
    case "Delivered":
      return "delivered" as const;
    case "Cancelled":
      return "cancelled" as const;
    case "Completed":
      return "completed" as const;
    default:
      return "pending" as const;
  }
}

/* --------------------------------- icons --------------------------------- */
function HomeIcon() { return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2Z" /></svg>); }
function BoxIcon() { return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>); }
function RegisterIcon() { return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="3" width="18" height="14" rx="2" /><path d="M3 17v4h18v-4M7 8h10M7 12h6" /></svg>); }
function ListIcon() { return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>); }
function UserIcon() { return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>); }
function LeafIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M11 20A7 7 0 0 1 4 13c0-4 3-9 11-11-1 5-1 9-3 12s-5 4-7 4Z" /><path d="M2 22c2-3 5-6 9-9" /></svg>); }
