"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { openShopAuthPanel } from "@/lib/shopAuthPanel";

/** Reexport por si quieres abrir el panel de cuenta desde otro sitio. */
export { openShopAuthPanel } from "@/lib/shopAuthPanel";

export function useShopFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<Array<string | number>>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  const isLoggedIn = (): boolean => {
    if (typeof window === "undefined") return false;
    return Boolean(localStorage.getItem("shop_token"));
  };

  /** Mensaje + abrir drawer de login/registro en el Header (vía evento global). */
  const requireAuthForFavorites = useCallback((): boolean => {
    if (typeof window === "undefined") return false;
    if (localStorage.getItem("shop_token")) return true;
    toast.error("Inicia sesión para agregar favoritos");
    openShopAuthPanel();
    return false;
  }, []);

  const fetchFavorites = async () => {
    if (!isLoggedIn()) {
      setFavoriteIds([]);
      setLoadingFavorites(false);
      return;
    }

    try {
      const response = await api.get('/shop/favorites');
      const data = response.data?.data || response.data || [];
      const ids = Array.isArray(data)
        ? data
            .map((item: any) => item.product?.id ?? item.product_id ?? item.id ?? null)
            .filter((value) => value !== null)
        : [];
      setFavoriteIds(ids);
    } catch (error) {
      setFavoriteIds([]);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const toggleFavorite = async (productId: string | number): Promise<boolean> => {
    if (!isLoggedIn()) {
      throw new Error('NOT_LOGGED_IN');
    }

    const numId = Number(productId);
    const wasFavorite = favoriteIds.includes(numId);

    // --- ACTUALIZACIÓN OPTIMISTA ---
    // Cambiamos el estado localmente de inmediato para que el usuario no espere
    setFavoriteIds(prev => 
      wasFavorite ? prev.filter(id => id !== numId) : [...prev, numId]
    );

    try {
      await api.post('/shop/favorites', { product_id: productId });
      return !wasFavorite;
    } catch (error) {
      // Si la API falla, revertimos el cambio para que el corazón vuelva a su estado real
      setFavoriteIds(prev => 
        wasFavorite ? [...prev, numId] : prev.filter(id => id !== numId)
      );
      console.error('Error toggling favorite:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  return {
    favoriteIds,
    loadingFavorites,
    isLoggedIn,
    requireAuthForFavorites,
    fetchFavorites,
    toggleFavorite,
  };
}
