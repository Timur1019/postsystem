import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { useTenantScope } from '../../../hooks/useTenantScope';
import { categoryApi } from '../../../api/category.api';
import { canManageCatalog } from '../constants';

export function useCategoriesPage() {
  const { user } = useAuthStore();
  const { tenantKey, tenantReady } = useTenantScope();
  const manage = canManageCatalog(user?.role);

  const [createOpen, setCreateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [deleteCategory, setDeleteCategory] = useState(null);
  const [rowMenu, setRowMenu] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(14);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: tenantKey('categories'),
    queryFn: () => categoryApi.getAll().then((r) => r.data),
    enabled: tenantReady,
  });

  useEffect(() => {
    if (!rowMenu) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setRowMenu(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rowMenu]);

  const total = categories.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageRows = useMemo(() => {
    const start = page * pageSize;
    return categories.slice(start, start + pageSize);
  }, [categories, page, pageSize]);

  const openCreate = () => {
    setEditCategory(null);
    setCreateOpen(true);
  };

  const closeModal = () => {
    setCreateOpen(false);
    setEditCategory(null);
  };

  const onModalSaved = () => {
    setCreateOpen(false);
    setEditCategory(null);
  };

  const openEdit = (category) => {
    setCreateOpen(false);
    setEditCategory(category);
    setRowMenu(null);
  };

  const openDelete = (category) => {
    setDeleteCategory(category);
    setRowMenu(null);
  };

  const toggleRowMenu = (category, rect) => {
    setRowMenu((cur) => (cur?.category?.id === category.id ? null : { category, rect }));
  };

  return {
    manage,
    categories,
    isLoading,
    pageRows,
    page,
    pageSize,
    total,
    totalPages,
    setPage,
    setPageSize,
    createOpen,
    editCategory,
    deleteCategory,
    setDeleteCategory,
    rowMenu,
    setRowMenu,
    openCreate,
    closeModal,
    onModalSaved,
    openEdit,
    openDelete,
    toggleRowMenu,
    modalOpen: createOpen || !!editCategory,
    modalCategory: editCategory,
  };
}
