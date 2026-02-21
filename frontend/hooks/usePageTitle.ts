import { useEffect } from 'react';

const BASE_TITLE = 'Root | Federated RAG Intelligence';

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | Root` : BASE_TITLE;
    return () => { document.title = BASE_TITLE; };
  }, [title]);
}
