# System Context Diagram

## Overview
This diagram shows Finsite's position within its environment, including external systems, user interactions, and data boundaries.

## Diagram

```mermaid
graph TB
    subgraph "User's Browser Environment"
        User[("👤 User")]
        
        subgraph "Finsite Application"
            App["Finsite Web App<br/>(MVC Architecture)"]
        end
        
        subgraph "Browser APIs"
            IDB["IndexedDB<br/>(Client Storage)"]
            DOM["DOM APIs<br/>(Rendering)"]
        end
        
        subgraph "External Libraries"
            ChartJS["Chart.js<br/>(Visualization)"]
            DateFNS["date-fns<br/>(Date Handling)"]
        end
    end
    
    User -->|"Interacts with"| App
    App -->|"Reads/Writes Data"| IDB
    App -->|"Manipulates UI"| DOM
    App -->|"Renders Charts"| ChartJS
    App -->|"Formats Dates"| DateFNS
    DOM -->|"Displays UI"| User
    
    style User fill:#e1f5ff
    style App fill:#4CAF50
    style IDB fill:#FF9800
    style ChartJS fill:#2196F3
    style DateFNS fill:#9C27B0
    style DOM fill:#FFC107
```

## Description

**Finsite** is a fully client-side personal finance application that runs entirely in the user's browser with no backend server.

### Key Boundaries

**User Interactions:**
- User interacts with the application through the web UI
- All interactions are immediate (no network requests)
- Data never leaves the user's browser

**Data Storage:**
- All financial data stored locally in IndexedDB
- No cloud sync or external database connections
- Privacy-focused: user owns their data completely

**External Dependencies:**
- **Chart.js**: For rendering financial charts and graphs
- **date-fns**: For date parsing and formatting
- **DOM APIs**: For UI rendering and manipulation

### Security & Privacy

- **No Server**: Application has no backend; all logic runs client-side
- **No Network Calls**: After initial page load, no data transmitted
- **Local Storage Only**: IndexedDB keeps all data in browser
- **User Control**: User can export, clear, or backup data at any time

## Related ADRs

- [ADR-01: Use MVC Architecture](../adr/01-use-mvc-architecture.md)
- [ADR-02: Choose IndexedDB for Storage](../adr/02-choose-indexeddb-for-storage.md)
- [ADR-03: Adopt Chart.js for Visualization](../adr/03-adopt-chartjs-for-visualization.md)
- [ADR-05: Use Vanilla JavaScript](../adr/05-use-vanilla-javascript.md)
