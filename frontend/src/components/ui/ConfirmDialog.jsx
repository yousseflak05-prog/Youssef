import { AlertTriangle } from 'lucide-react';

import Modal from './Modal.jsx';
import Button from './Button.jsx';

/** Confirmation avant une action destructive (suppression, annulation). */
export default function ConfirmDialog({
  ouvert,
  onFermer,
  onConfirmer,
  titre = 'Confirmer la suppression',
  message,
  libelleConfirmation = 'Supprimer',
  chargement = false,
}) {
  return (
    <Modal
      ouvert={ouvert}
      onFermer={onFermer}
      titre={titre}
      largeur="sm"
      pied={
        <>
          <Button variante="secondaire" onClick={onFermer} disabled={chargement}>
            Annuler
          </Button>
          <Button variante="danger" onClick={onConfirmer} chargement={chargement}>
            {libelleConfirmation}
          </Button>
        </>
      }
    >
      <div className="flex gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle size={20} />
        </div>
        <p className="pt-2 text-sm leading-relaxed text-stone-600">{message}</p>
      </div>
    </Modal>
  );
}
