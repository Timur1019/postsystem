import { getProductTemplateTitle } from '../../../../../config/productCatalogTemplateRegistry';
import {
  productInfoBoolLabel,
  productInfoLabelCls,
  productInfoRowCls,
  productInfoValueCls,
} from '../../../utils/productInfoModalUi';

export default function ProductInfoAttributesCard({ t, product }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <div className={productInfoRowCls}>
        <span className={productInfoLabelCls}>{t('products.colName')}:</span>
        <span className={productInfoValueCls}>{product.name}</span>
      </div>
      <div className={productInfoRowCls}>
        <span className={productInfoLabelCls}>{t('products.colCategory')}:</span>
        <span className={productInfoValueCls}>{product.categoryName ?? '—'}</span>
      </div>
      <div className={productInfoRowCls}>
        <span className={productInfoLabelCls}>{t('products.colTemplate')}:</span>
        <span className={productInfoValueCls}>{getProductTemplateTitle(t, product) ?? '—'}</span>
      </div>
      {product.retailExtras?.clothingSizeRange || product.retailExtras?.clothingColor ? (
        <>
          <div className={productInfoRowCls}>
            <span className={productInfoLabelCls}>{t('productCatalog.clothingSizeRange')}:</span>
            <span className={productInfoValueCls}>{product.retailExtras.clothingSizeRange ?? '—'}</span>
          </div>
          <div className={productInfoRowCls}>
            <span className={productInfoLabelCls}>{t('productCatalog.clothingColor')}:</span>
            <span className={productInfoValueCls}>{product.retailExtras.clothingColor ?? '—'}</span>
          </div>
        </>
      ) : null}
      {product.retailExtras?.pharmacyDosageForm ? (
        <div className={productInfoRowCls}>
          <span className={productInfoLabelCls}>{t('productCatalog.pharmacyDosageForm')}:</span>
          <span className={productInfoValueCls}>{product.retailExtras.pharmacyDosageForm}</span>
        </div>
      ) : null}
      <div className={productInfoRowCls}>
        <span className={productInfoLabelCls}>{t('productCatalog.unit')}:</span>
        <span className={productInfoValueCls}>{product.unitOfMeasure ?? '—'}</span>
      </div>
      {product.constructionDetails ? (
        <>
          <div className={productInfoRowCls}>
            <span className={productInfoLabelCls}>{t('productCatalog.constructionStandardLength')}:</span>
            <span className={productInfoValueCls}>{product.constructionDetails.standardLength ?? '—'}</span>
          </div>
          <div className={productInfoRowCls}>
            <span className={productInfoLabelCls}>{t('productCatalog.constructionAllowCutting')}:</span>
            <span className={productInfoValueCls}>
              {productInfoBoolLabel(product.constructionDetails.allowCutting, t)}
            </span>
          </div>
        </>
      ) : null}
      <div className={productInfoRowCls}>
        <span className={productInfoLabelCls}>{t('productCatalog.unitCode')}:</span>
        <span className={productInfoValueCls}>{product.unitMeasureCode ?? '—'}</span>
      </div>
      <div className={productInfoRowCls}>
        <span className={productInfoLabelCls}>{t('productCatalog.packageCode')}:</span>
        <span className={productInfoValueCls}>{product.packageCode ?? '—'}</span>
      </div>
      <div className={productInfoRowCls}>
        <span className={productInfoLabelCls}>{t('productCatalog.soldByPiece')}:</span>
        <span className={productInfoValueCls}>
          {product.soldIndividually ? t('products.markingYes') : '—'}
        </span>
      </div>
      <div className={productInfoRowCls}>
        <span className={productInfoLabelCls}>{t('productCatalog.marked')}:</span>
        <span className={productInfoValueCls}>{productInfoBoolLabel(product.markedProduct, t)}</span>
      </div>
      <div className={productInfoRowCls}>
        <span className={productInfoLabelCls}>{t('productCatalog.active')}:</span>
        <span className={productInfoValueCls}>{productInfoBoolLabel(product.active, t)}</span>
      </div>
      <div className={productInfoRowCls}>
        <span className={productInfoLabelCls}>{t('products.colStock')}:</span>
        <span className={productInfoValueCls}>{product.stockQuantity}</span>
      </div>
      <div className={productInfoRowCls}>
        <span className={productInfoLabelCls}>{t('products.lifecycle.dispatched')}:</span>
        <span className={productInfoValueCls}>{product.stockDispatched ?? 0}</span>
      </div>
      <div className="flex items-center justify-between gap-4 pt-2 text-sm">
        <span className={productInfoLabelCls}>{t('productCatalog.vat')}:</span>
        <span className={productInfoValueCls}>
          {product.taxRate != null ? `${Number(product.taxRate).toFixed(2)} %` : '—'}
        </span>
      </div>
    </div>
  );
}
