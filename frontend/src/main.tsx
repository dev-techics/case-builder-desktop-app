// main.tsx
import ReactDom from 'react-dom/client';
import { Provider } from 'react-redux';
import './index.css';
import React from 'react';
import { pdfjs } from 'react-pdf';
import store from './app/store';
import { initAuth } from './features/auth/utils/authState';

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

initAuth().then(async () => {
  // router imported AFTER store is populated — loaders now see correct state
  const { RouterProvider } = await import('react-router-dom');
  const { router } = await import('./routes/router');

  ReactDom.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </React.StrictMode>
  );
});