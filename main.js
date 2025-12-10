// /src/main.js
import { LocalStorageGateway } from './storage/LocalStorageGateway.js';
import { FinanceModel } from './model/FinanceModel.js';
import { FinanceView } from './view/FinanceView.js';
import { FinanceController } from './controller/FinanceController.js';

const root = document.getElementById('app');
const storage = new LocalStorageGateway();
const model = new FinanceModel(storage);
const view = new FinanceView(root);
new FinanceController(model, view);
