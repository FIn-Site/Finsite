// /src/main.js
import { FinanceModel } from './modelv1.js';
import { FinanceView } from './viewv1.js';
import { FinanceController } from './controllerv1.js';

const root = document.getElementById('app');

// Model now talks to IndexedDB internally
const model = new FinanceModel();

// View is exactly your v1 Manual Transaction Entry UI
const view = new FinanceView(root);

// Controller wires them together
const controller = new FinanceController(model, view);

// Kick off async load from IndexedDB
controller.init();
