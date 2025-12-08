/**
 * Main application entry point
 * Initializes and coordinates all MVC components
 */
import { FinSiteModel } from './model/financeModel.js';
import { FinSiteView } from './view/financeView.js';
import { FinSiteController } from './controller/financeContoller.js';

/**
 * Initialize the chat application
 * Sets up MVC components and establishes their connections
 */
async function initializeApp() {
  console.log('🚀 Initialize FinSite...');

  try {
    // 1) Create model & view
    const model = new FinSiteModel();
    const view = new FinSiteView();

    // 2) Render the view shell into #app
    view.render('#app');

    // 3) Create controller and wire it to model & view
    const controller = new FinSiteController(model, view);

    // 4) Let controller initialize model (storage) and push state to view
    await controller.init();

    console.log('✅ FinSite initialization complete!');
  } catch (error) {
    console.error('❌ Error during initialization:', error);
    const appRoot = document.querySelector('#app');
    if (appRoot) {
      appRoot.innerHTML = `<h1 style="color: white; text-align: center; margin-top: 50px;">Error: ${
        error.message}</h1>`;
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
  });
} else {
  initializeApp();
}
