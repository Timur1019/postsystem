import PosCatalogPanel from '../PosCatalogPanel';
import PosOrderPanel from '../PosOrderPanel';
import PosPaymentFlow from '../PosPaymentFlow';
import PosRegisterFooter from '../PosRegisterFooter';

export default function PosRegisterWorkspace({
  posPane,
  searchInputRef,
  catalog,
  payOpen,
  onClosePayment,
  cart,
  checkout,
  shiftIsOpen,
  onReturn,
  onDiscount,
  onCheckout,
}) {
  const {
    storeId,
    search,
    setSearch,
    handleSearchEnter,
    categories,
    categoriesLoading,
    selectedCategoryId,
    handleSelectCategory,
    searchActive,
    catalogBrowse,
    setCatalogBrowse,
    products,
    productsLoading,
    productsLoadingMore,
    productsHasMore,
    fetchMoreProducts,
    addProductToCart,
    viewMode,
  } = catalog;

  const {
    items,
    total,
    selectedLineId,
    setSelectedLineId,
    handleQtyDelta,
    updateUnitPrice,
    updateDiscountPercent,
    removeItem,
    clearCart,
    discountTotal,
  } = cart;

  const { checkoutMutation, handleConfirmPayment } = checkout;

  return (
    <div
      className={`cashier-register__split cashier-register__split--pane cashier-register__split--${posPane}`}
    >
      <div className="cashier-register__workspace">
        <div className="cashier-register__stage">
          <div className="cashier-register__catalog-col">
            <PosCatalogPanel
              ref={searchInputRef}
              search={search}
              onSearchChange={setSearch}
              onSearchEnter={handleSearchEnter}
              scanDisabled={!storeId}
              categories={categories}
              categoriesLoading={categoriesLoading}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={handleSelectCategory}
              searchActive={searchActive}
              catalogBrowse={catalogBrowse}
              onBrowseChange={setCatalogBrowse}
              products={products}
              productsLoading={productsLoading}
              productsLoadingMore={productsLoadingMore}
              productsHasMore={Boolean(productsHasMore)}
              onLoadMoreProducts={() => fetchMoreProducts()}
              onAddProduct={addProductToCart}
              viewMode={viewMode}
            />
          </div>

          <div className="cashier-register__order-col">
            <PosOrderPanel
              variant="register"
              showTotalsFoot={payOpen}
              items={items}
              total={total}
              selectedLineId={selectedLineId}
              onSelectLine={setSelectedLineId}
              onQtyDelta={handleQtyDelta}
              onUpdatePrice={updateUnitPrice}
              onUpdateDiscountPercent={updateDiscountPercent}
              onRemove={removeItem}
            />
          </div>

          <aside
            className={`cashier-register__actions-col${payOpen ? ' cashier-register__actions-col--pay' : ''}`}
          >
            {payOpen ? (
              <PosPaymentFlow
                open
                onClose={onClosePayment}
                total={total}
                isPending={checkoutMutation.isPending}
                onConfirm={handleConfirmPayment}
              />
            ) : (
              <PosRegisterFooter
                items={items}
                total={total}
                discountTotal={discountTotal}
                onReturn={onReturn}
                onClear={clearCart}
                canClear={items.length > 0}
                onDiscount={onDiscount}
                onCheckout={onCheckout}
                checkoutDisabled={
                  items.length === 0 || checkoutMutation.isPending || !shiftIsOpen
                }
              />
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
