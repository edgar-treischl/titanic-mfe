import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App.tsx';
import './src/index.css';

export default function mount(el: HTMLElement) {
  ReactDOM.createRoot(el).render(React.createElement(App));
}
