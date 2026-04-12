import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

export default function mount(el: HTMLElement) {
  ReactDOM.createRoot(el).render(<App />);
}