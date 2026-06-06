import { useUnitsCatalog } from '../../hooks/useUnitsCatalog';

/** Подгружает справочник единиц с API после входа. */
export default function UnitsCatalogBootstrap({ children }) {
  useUnitsCatalog();
  return children;
}
