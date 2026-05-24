import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Product,
  Review,
  Agrodealer,
  Agrovet,
} from "../../types";
import { useAuth } from "../../context/AuthContext";
import { calculateDistance } from "../../services/geolocationService";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { EmptyState } from "../../components/feedback/EmptyState";
import { ProductGridV2 } from "../../components/marketplace/ProductGridV2";
import StarRating from "../../components/StarRating";
import ReviewSection from "../../components/ReviewSection";

interface VendorPageProps {
  vendors: (Agrodealer | Agrovet)[];
  products: Product[];
  reviews: Review[];
  onAddReview: (r: Omit<Review, "id" | "date">) => void;
  onProductClick: (p: Product) => void;
  onAddToCart: (p: Product, qty: number) => void;
}

/**
 * VendorPage — `/v/:vendorId` route.
 * Cover + overlapping avatar + verified badge + tabs (Products / Reviews / About).
 * Implements DESIGN_SPEC §9.1.4.
 */
export function VendorPage({
  vendors,
  products,
  reviews,
  onAddReview,
  onProductClick,
  onAddToCart,
}: VendorPageProps) {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const { location: userLocation } = useAuth();

  const vendor = vendors.find((v) => v.id === vendorId);

  const vendorProducts = React.useMemo(
    () => (vendor ? products.filter((p) => p.vendor.id === vendor.id) : []),
    [products, vendor]
  );
  const vendorReviews = React.useMemo(
    () => (vendor ? reviews.filter((r) => r.vendorId === vendor.id) : []),
    [reviews, vendor]
  );

  const avgRating =
    vendorReviews.length > 0
      ? vendorReviews.reduce((s, r) => s + r.rating, 0) / vendorReviews.length
      : vendor?.rating ?? 0;

  const distanceKm = React.useMemo(() => {
    if (userLocation && vendor?.coords) {
      return calculateDistance(
        userLocation.lat,
        userLocation.lon,
        vendor.coords.lat,
        vendor.coords.lon
      );
    }
    return null;
  }, [userLocation, vendor?.coords]);

  if (!vendor) {
    return (
      <EmptyState
        className="py-20"
        title="Vendor not found"
        body="This vendor may have removed their profile, or the link is incorrect."
        action={
          <Button variant="primary" onClick={() => navigate("/")}>
            Back to marketplace
          </Button>
        }
      />
    );
  }

  const hasWhatsapp =
    vendor.whatsappConfig?.enabled &&
    !!vendor.whatsappConfig.phoneNumber;
  const initials = vendor.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto w-full max-w-7xl">
      {/* Cover */}
      <div className="relative h-32 w-full bg-brand-600 sm:h-40">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-700 to-brand-500 opacity-80" />
      </div>

      {/* Header */}
      <div className="relative -mt-12 px-4">
        <div className="flex items-end gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-xl border-4 border-bg bg-brand-700 text-2xl font-semibold text-white shadow-sm sm:h-24 sm:w-24">
            {initials}
          </div>
          <div className="mb-1 flex-1">
            <h1 className="flex items-center gap-2 text-xl font-semibold text-fg sm:text-2xl">
              {vendor.name}
              {vendor.kycStatus === "Verified" ? (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white" aria-label="Verified">
                  <CheckIcon />
                </span>
              ) : null}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              <StarRating rating={avgRating} />
              <span>{vendorReviews.length} reviews</span>
              {vendor.location ? <span>· {vendor.location}</span> : null}
              {distanceKm !== null ? (
                <span>· {distanceKm.toFixed(1)} km away</span>
              ) : null}
              {vendor.operatingHours ? (
                <span>· Open {vendor.operatingHours}</span>
              ) : null}
            </div>
            {vendor.specialties && vendor.specialties.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {vendor.specialties.slice(0, 4).map((s) => (
                  <Badge key={s} variant="outline">
                    {s}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {hasWhatsapp ? (
            <Button
              variant="primary"
              size="md"
              onClick={() =>
                window.open(
                  `https://wa.me/${vendor.whatsappConfig!.phoneNumber.replace(/\D/g, "")}`,
                  "_blank"
                )
              }
              className="flex-1 sm:flex-none"
            >
              <WhatsAppIcon /> Message on WhatsApp
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate("/")}
            className={hasWhatsapp ? "" : "flex-1 sm:flex-none"}
          >
            <ArrowLeftIcon /> Back
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="products" className="mt-6 w-full">
        <TabsList className="mx-4">
          <TabsTrigger value="products">Products ({vendorProducts.length})</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({vendorReviews.length})</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4">
          <ProductGridV2
            products={vendorProducts}
            onProductClick={onProductClick}
            onAddToCart={onAddToCart}
            onVendorClick={() => {}}
          />
        </TabsContent>

        <TabsContent value="reviews" className="mt-4 px-4">
          <ReviewSection
            reviews={vendorReviews}
            vendorId={vendor.id}
            onAddReview={onAddReview}
          />
        </TabsContent>

        <TabsContent value="about" className="mt-4 space-y-3 px-4">
          {vendor.businessDescription ? (
            <p className="text-sm leading-relaxed text-fg">
              {vendor.businessDescription}
            </p>
          ) : (
            <p className="text-sm text-muted">No description yet.</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {vendor.location ? (
              <InfoRow label="Location" value={vendor.location} />
            ) : null}
            {vendor.phone ? (
              <InfoRow label="Phone" value={vendor.phone} />
            ) : null}
            {vendor.operatingHours ? (
              <InfoRow label="Hours" value={vendor.operatingHours} />
            ) : null}
            {vendor.email ? (
              <InfoRow label="Email" value={vendor.email} />
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-0.5 text-sm text-fg">{value}</div>
    </div>
  );
}

function CheckIcon() { return (<svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 6 9 17l-5-5" /></svg>); }
function ArrowLeftIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M19 12H5M12 19l-7-7 7-7" /></svg>); }
function WhatsAppIcon() { return (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden><path d="M20.5 3.5A11.5 11.5 0 0 0 2.4 17.2L1 23l5.9-1.4A11.5 11.5 0 1 0 20.5 3.5Zm-8.5 18a9.5 9.5 0 0 1-4.8-1.3l-.3-.2-3.5.9.9-3.4-.2-.4A9.5 9.5 0 1 1 12 21.5Z" /></svg>); }
