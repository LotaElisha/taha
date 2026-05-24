import * as React from "react";
import { Product, CartItem, Agrodealer, Agrovet } from "../../types";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { HeroBanner } from "../../components/marketplace/HeroBanner";
import { ServiceTiles } from "../../components/marketplace/ServiceTiles";
import {
  CategoryChips,
  type CategoryValue,
} from "../../components/marketplace/CategoryChips";
import { ProductGridV2 } from "../../components/marketplace/ProductGridV2";
import PartnersSection from "../../components/PartnersSection";

interface HomeViewProps {
  products: Product[];
  filteredProducts: Product[];
  isLoading: boolean;
  selectedCategory: CategoryValue;
  onCategoryChange: (cat: CategoryValue) => void;
  onProductClick: (p: Product) => void;
  onAddToCart: (p: Product, qty: number) => void;
  onOpenScanner: () => void;
  onOpenSoilTest: () => void;
  onOpenAgronomist: () => void;
  onOpenVet: () => void;
  onOpenWarehouse: () => void;
  onLogisticsClick: () => void;
}

/**
 * HomeView — public marketplace route ("/").
 * State is owned by App.tsx; HomeView is a pure projection.
 */
export function HomeView(props: HomeViewProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  return (
    <>
      <HeroBanner
        onShop={() => {
          document
            .getElementById("marketplace")
            ?.scrollIntoView({ behavior: "smooth" });
        }}
        onScan={props.onOpenScanner}
      />
      <div id="services">
        <ServiceTiles
          onScan={props.onOpenScanner}
          onSoilTest={props.onOpenSoilTest}
          onAgronomist={props.onOpenAgronomist}
          onVet={props.onOpenVet}
          onLogistics={props.onLogisticsClick}
          onWarehouse={props.onOpenWarehouse}
        />
      </div>
      <section
        id="marketplace"
        className="mx-auto w-full max-w-7xl px-4 pt-6"
      >
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-semibold text-fg">Marketplace</h2>
          <p className="hidden text-sm text-muted sm:block">
            Quality agricultural inputs from trusted local dealers.
          </p>
        </div>
      </section>
      <CategoryChips
        value={props.selectedCategory}
        onChange={props.onCategoryChange}
        translate={(c) =>
          t(`categories.${c.toLowerCase().replace(/ /g, "")}`)
        }
      />
      <ProductGridV2
        products={props.filteredProducts}
        isLoading={props.isLoading}
        onProductClick={props.onProductClick}
        onVendorClick={(v: Agrodealer | Agrovet) =>
          navigate(`/v/${v.id}`)
        }
        onAddToCart={props.onAddToCart}
      />
      <div className="px-4 py-8">
        <PartnersSection />
      </div>
    </>
  );
}
