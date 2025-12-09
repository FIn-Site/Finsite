# MVC Architecture Diagram

## Overview
This diagram illustrates Finsite's implementation of the Model-View-Controller pattern, showing the separation of concerns and communication flow.

## Diagram

```mermaid
graph TB
    subgraph "View Layer"
        View["FinanceView<br/>(financeView.js)"]
        
        subgraph "UI Components"
            Header["Header<br/>(header.js)"]
            Sidebar["Sidebar<br/>(sidebar.js)"]
            Dashboard["Dashboard<br/>(dashboard.js)"]
            Transactions["Transactions<br/>(transactions.js)"]
            TransItem["Transaction Item<br/>(transaction-item.js)"]
            SpendChart["Spending Chart<br/>(spending-chart.js)"]
        end
    end
    
    subgraph "Controller Layer"
        Controller["FinanceController<br/>(financeController.js)"]
    end
    
    subgraph "Model Layer"
        Model["FinanceModel<br/>(financeModel.js)"]
        Storage["StorageService<br/>(storageService.js)"]
    end
    
    subgraph "External"
        User[("👤 User")]
        IDB[("IndexedDB")]
        ChartJS["Chart.js"]
    end
    
    %% User interactions
    User -->|"UI Events"| View
    
    %% View to Controller
    View -->|"User Actions"| Controller
    View -->|"Composes"| Header
    View -->|"Composes"| Sidebar
    View -->|"Composes"| Dashboard
    View -->|"Composes"| Transactions
    Transactions -->|"Uses"| TransItem
    Dashboard -->|"Uses"| SpendChart
    SpendChart -->|"Renders with"| ChartJS
    
    %% Controller orchestration
    Controller -->|"Updates State"| Model
    Controller -->|"Triggers Render"| View
    
    %% Model data flow
    Model -->|"CRUD Operations"| Storage
    Model -->|"State Changes"| Controller
    Storage -->|"Persist/Retrieve"| IDB
    
    %% View reads state
    View -.->|"Reads State"| Model
    
    style User fill:#e1f5ff
    style View fill:#4CAF50
    style Controller fill:#FF9800
    style Model fill:#2196F3
    style Storage fill:#9C27B0
    style IDB fill:#FF5722
    style ChartJS fill:#00BCD4
```

## Description

### Layer Responsibilities

**View Layer (`src/view/`)**
- **Purpose**: Render UI and handle DOM manipulation
- **Responsibilities**:
  - Compose UI components into cohesive interface
  - Bind event listeners to user interactions
  - Display data from Model
  - Call Controller methods when user takes actions
- **Key Rule**: Never modifies Model directly; always goes through Controller

**Controller Layer (`src/controller/`)**
- **Purpose**: Orchestrate application logic and coordinate between View and Model
- **Responsibilities**:
  - Handle user actions from View
  - Validate user input
  - Update Model state
  - Trigger View re-renders
  - Implement business logic (calculations, filtering, sorting)
- **Key Rule**: Doesn't directly manipulate DOM; delegates to View

**Model Layer (`src/model/`)**
- **Purpose**: Manage application state and data persistence with high-performance aggregation
- **Responsibilities**:
  - Store application state (transactions, categories, groups)
  - Provide data access methods
  - Maintain incremental aggregates for dashboard metrics (O(1) updates)
  - Interact with StorageService for persistence
  - Notify Controller of state changes
- **Key Features**:
  - **Incremental Aggregation**: Maintains running totals by time bucket and group
  - **Cached Metrics**: Pre-computed monthly/weekly stats avoid full data scans
  - **Time Bucketing**: Organizes transactions by month for efficient querying
- **Key Rule**: No UI knowledge; purely data-focused

### Communication Flow

**User Action Flow:**
1. User interacts with UI (clicks button, submits form)
2. View captures event and calls Controller method
3. Controller validates input and updates Model
4. Model persists changes via StorageService to IndexedDB
5. Controller triggers View re-render
6. View reads updated state from Model and updates DOM

**Data Read Flow:**
- View always reads current state directly from Model
- Model provides synchronous getters for UI rendering
- Controller doesn't sit between View and Model for reads

### Component Organization

**UI Components** (`src/components/`)
- Modular, reusable UI pieces
- Encapsulate DOM structure and styling
- Export creation and update functions
- Used by View layer to compose interface

## Related ADRs

- [ADR-01: Use MVC Architecture](../adr/01-use-mvc-architecture.md)
- [ADR-04: Organize UI with Modular Components](../adr/04-organize-ui-with-modular-components.md)
- [ADR-05: Use Vanilla JavaScript](../adr/05-use-vanilla-javascript.md)
