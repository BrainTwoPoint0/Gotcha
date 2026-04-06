import { useCallback } from 'react';
import { useGotchaContext } from '../components/GotchaProvider';

/**
 * Hook to programmatically open/close a specific Gotcha widget.
 * The corresponding <Gotcha elementId="..."> must be mounted for the modal to render.
 */
export function useGotchaTrigger(elementId: string) {
  const { activeModalId, openModal, closeModal } = useGotchaContext();

  const open = useCallback(() => openModal(elementId), [openModal, elementId]);
  const close = useCallback(() => closeModal(), [closeModal]);

  return {
    open,
    close,
    isOpen: activeModalId === elementId,
  };
}
