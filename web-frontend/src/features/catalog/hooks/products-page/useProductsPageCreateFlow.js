import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  isUniversalStoreType,
  listTemplatesForBusinessType,
  resolveBusinessTypeForTemplates,
} from '../../../../config/productCatalogTemplateRegistry';

export function useProductsPageCreateFlow({ t, activeStores }) {
  const [editProduct, setEditProduct] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createStore, setCreateStore] = useState(null);
  const [createTemplateCode, setCreateTemplateCode] = useState(null);
  const [createAdvancedMode, setCreateAdvancedMode] = useState(false);
  const [createUniversalMode, setCreateUniversalMode] = useState(false);

  const defaultTemplateForStore = (store) => {
    const templates = listTemplatesForBusinessType(store.businessType);
    return templates[0]?.code ?? null;
  };

  const resetCreateFlow = () => {
    setShowCreate(false);
    setCreateStore(null);
    setCreateTemplateCode(null);
    setCreateAdvancedMode(false);
    setCreateUniversalMode(false);
  };

  const startCreateFlow = (store) => {
    setCreateStore(store);
    if (isUniversalStoreType(store.businessType)) {
      setCreateTemplateCode(null);
      setCreateAdvancedMode(false);
      setCreateUniversalMode(true);
    } else {
      setCreateUniversalMode(false);
      setCreateAdvancedMode(false);
      setCreateTemplateCode(defaultTemplateForStore(store));
    }
    setShowCreate(true);
  };

  const handleAddProduct = () => {
    if (activeStores.length === 0) {
      toast.error(t('productTemplates.noStoresHint'));
      return;
    }
    resetCreateFlow();
    startCreateFlow(activeStores[0]);
  };

  const handleCreateStoreChange = (store) => {
    if (!createStore || !store || store.id === createStore.id) return;
    const prevUniversal = isUniversalStoreType(createStore.businessType);
    const nextUniversal = isUniversalStoreType(store.businessType);
    setCreateStore(store);

    if (prevUniversal && nextUniversal) return;

    if (nextUniversal) {
      setCreateTemplateCode(null);
      setCreateAdvancedMode(false);
      setCreateUniversalMode(true);
      return;
    }

    const prevType = resolveBusinessTypeForTemplates(createStore.businessType);
    const nextType = resolveBusinessTypeForTemplates(store.businessType);
    if (prevUniversal || prevType !== nextType) {
      setCreateTemplateCode(defaultTemplateForStore(store));
      setCreateAdvancedMode(false);
      setCreateUniversalMode(false);
      if (!prevUniversal) toast(t('productTemplates.storeTypeChanged'));
    }
  };

  const handleCreateTemplateChange = (value) => {
    if (value === '__advanced__') {
      setCreateTemplateCode(null);
      setCreateAdvancedMode(true);
      setCreateUniversalMode(false);
      return;
    }
    setCreateTemplateCode(value);
    setCreateAdvancedMode(false);
    setCreateUniversalMode(false);
  };

  const closeCatalogModal = () => {
    if (editProduct) {
      setEditProduct(null);
    } else {
      resetCreateFlow();
    }
  };

  const catalogModalKey =
    editProduct?.id
    ?? `new-${createStore?.id ?? 'x'}-${createUniversalMode ? 'universal' : createTemplateCode ?? 'advanced'}-${createAdvancedMode ? 'adv' : 'tpl'}`;

  return {
    editProduct,
    setEditProduct,
    showCreate,
    createStore,
    createTemplateCode,
    createAdvancedMode,
    createUniversalMode,
    handleAddProduct,
    handleCreateStoreChange,
    handleCreateTemplateChange,
    closeCatalogModal,
    resetCreateFlow,
    catalogModalKey,
  };
}
