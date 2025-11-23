# README.md

## Description

Modern web GUI for managing Kube-OVN resources with topology visualisation

## Screenshots

![VPC Topology](/assets/VPC_topology.jpg)
![VPC Topology with NAT GW](/assets/VPC_topology_NATGW.jpg)
![Create VPC](/assets/New_VPC.jpg)
![List IP addresses](/assets/IP_list.jpg)
![DNAT Rule](/assets/DNAT.jpg)

## Core Architecture

This is a **Kube-OVN network management UI** built with React/Vite that provides both visual topology views and CRUD management for Kubernetes network resources. The application operates as a frontend client that communicates with a backend API server at `http://localhost:8000/api/`.

## Kubernetes deployment

Deploy this application on your Kubernetes cluster configured with [OVN CNI](<https://ovn-kubernetes.io/>). You must have Cert-manager installed with a Cluster issuer named *letsencrypt-staging*. You should adapt this for production.
An example kubernetes deployment *ovnui.yml* is available in kubernetes folder.

```bash
# Deploy OVN API & OVN UI on K8S
kubectl apply -f kubernetes/ovnui.yaml
```

### Key Architectural Patterns

**Centralized Modal System**: The app uses a sophisticated modal architecture where `App.jsx` manages all modal state (edit, create, delete) and passes handlers down to child components. This prevents modal conflicts and provides consistent UX.

**Resource Configuration System**: All Kube-OVN resources are configured via `src/utils/resourceConfigs.js`, which defines:

- Form field specifications for create/edit operations
- Display columns for table views  
- Data validation and type handling

**Dual View Pattern**:

- **Topology View**: Interactive network diagrams using ReactFlow, showing VPCs with their subnets and NAT gateways
- **List Views**: Table-based CRUD interfaces for all resource types

**Custom ReactFlow Integration**: The topology view uses isolated ReactFlow instances per VPC to avoid conflicts, with custom `TextUpdaterNode` components that support click-to-edit functionality.

## Development Commands

### Local Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run ESLint
npm run lint
```

### Backend Integration

The frontend expects a REST API server running on `http://localhost:8000/api/` with endpoints for all Kube-OVN resource types (subnets, vpcs, vpc-nat-gateways, ips, etc.).
The kubernetes deployment uses API published on my [repo](<https://github.com/Sigilwen/kubeovnapi>)

### Docker Development

```bash
# Build Docker image
docker build -t kube-ovn-ui .

# Run containerized version (nginx serving static build)
docker run -p 8080:80 kube-ovn-ui
```

## Star the Project ⭐

If you like OVNUI, please consider giving it a star on GitHub to show your support and help others discover the project.

## Resource Management System

### Adding New Resource Types

1. Add configuration to `src/utils/resourceConfigs.js` with field definitions
2. Add navigation entry to `src/components/Navigation.jsx`
3. The generic modal system will automatically handle CRUD operations

### Resource Configuration Structure

Each resource type requires:

- `displayName`: Human-readable name
- `icon`: Emoji for UI display
- `fields`: Array of field configurations with validation rules

### API Integration Pattern

All resources follow REST patterns:

- `GET /api/{resource-type}` - List resources
- `POST /api/{resource-type}` - Create resource  
- `PATCH /api/{resource-type}/{name}` - Update resource
- `DELETE /api/{resource-type}/{name}` - Delete resource

## Key Component Responsibilities

- **App.jsx**: Root component managing modal state and view routing
- **NetworkTopology.jsx**: ReactFlow-based network visualization with VPC isolation  
- **ResourceListView.jsx**: Generic table component with search/sort/filter
- **Navigation.jsx**: Dropdown-based navigation with resource groupings
- **GenericEditModal/GenericCreateModal**: Dynamic form generation from resource configs

## Technology Stack

- **Frontend**: React 19 + Vite 7 + Bootstrap 5
- **Visualization**: ReactFlow for network diagrams
- **Data Fetching**: Native fetch API (no query library complexity)
- **Styling**: Bootstrap + React-Bootstrap components
- **State Management**: React state (no external state manager)
