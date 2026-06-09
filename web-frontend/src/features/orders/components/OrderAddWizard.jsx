import { createPortal } from 'react-dom';
import { useOrderAddWizard } from '../hooks/useOrderAddWizard';
import OrderAddWizardDetails from './wizard/OrderAddWizardDetails';
import OrderAddWizardSelectStore from './wizard/OrderAddWizardSelectStore';

export default function OrderAddWizard({ open, onClose, stores, onCreated }) {
  const w = useOrderAddWizard({ open, onClose, stores, onCreated });

  if (!open) return null;

  const node =
    w.step === 'store' ? (
      <OrderAddWizardSelectStore
        stores={stores.filter((s) => s.active)}
        value={w.storeId}
        onChange={w.setStoreId}
        onCancel={w.handleCancel}
        onNext={w.handleStoreNext}
      />
    ) : (
      <OrderAddWizardDetails
        storeName={w.storeName}
        onCancel={w.handleCancel}
        onBack={w.handleBack}
        creatorEmail={w.creatorEmail}
        couriers={w.couriers}
        form={w.form}
        setForm={w.setForm}
        canSubmit={w.canSubmit}
        onSubmit={w.handleSubmit}
        submitting={w.submitting}
      />
    );

  return createPortal(node, document.body);
}
