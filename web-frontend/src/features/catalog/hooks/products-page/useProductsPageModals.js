import { useState } from 'react';
import toast from 'react-hot-toast';

export function useProductsPageModals({ t, selectedIds }) {
  const [stockProduct, setStockProduct] = useState(null);
  const [bulkVatOpen, setBulkVatOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [receiveProduct, setReceiveProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [infoProductId, setInfoProductId] = useState(null);
  const [infoTab, setInfoTab] = useState('details');

  const openBulkVat = () => {
    if (selectedIds.size === 0) {
      toast.error(t('products.bulkVat.noneSelected'));
      return;
    }
    setBulkVatOpen(true);
  };

  const openBulkDelete = () => {
    if (selectedIds.size === 0) {
      toast.error(t('products.bulkDelete.noneSelected'));
      return;
    }
    setBulkDeleteOpen(true);
  };

  return {
    stockProduct,
    setStockProduct,
    bulkVatOpen,
    setBulkVatOpen,
    bulkDeleteOpen,
    setBulkDeleteOpen,
    importOpen,
    setImportOpen,
    exportOpen,
    setExportOpen,
    receiveProduct,
    setReceiveProduct,
    deleteProduct,
    setDeleteProduct,
    infoProductId,
    setInfoProductId,
    infoTab,
    setInfoTab,
    openBulkVat,
    openBulkDelete,
  };
}
