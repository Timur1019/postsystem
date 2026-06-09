import { useWeightEntryModal } from '../hooks/useWeightEntryModal';
import WeightEntryModalBody from './weight-entry/WeightEntryModalBody';
import '../../../styles/shared/weight-entry-modal.css';

export default function WeightEntryModal(props) {
  const w = useWeightEntryModal(props);
  if (!w.open || !w.product) return null;
  return <WeightEntryModalBody w={w} />;
}
