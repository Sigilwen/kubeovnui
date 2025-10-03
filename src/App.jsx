import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';
import NetworkTopology from "./NetworkTopology";
import VpcDetailView from './components/VpcDetailView';
import Navigation from './components/Navigation';
import ResourceListView from './components/ResourceListView';
import GenericEditModal from './components/GenericEditModal';
import GenericCreateModal from './components/GenericCreateModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import { API_BASE_URL } from './config/api';

function App() {
  const [currentView, setCurrentView] = useState('topology');
  const [selectedVpc, setSelectedVpc] = useState(null);
  
  // Modal state for resource management
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingObject, setEditingObject] = useState(null);
  const [editingResourceType, setEditingResourceType] = useState(null);
  const [creatingResourceType, setCreatingResourceType] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle edit request
  const handleEdit = (objectData, resourceType) => {
    setEditingObject(objectData);
    setEditingResourceType(resourceType);
    setShowEditModal(true);
  };

  // Handle create request
  const handleCreate = (resourceType) => {
    setCreatingResourceType(resourceType);
    setShowCreateModal(true);
  };

  // Handle delete request (opens confirmation modal)
  const handleDelete = (objectData, resourceType) => {
    setEditingObject(objectData);
    setEditingResourceType(resourceType);
    setShowEditModal(false); // Close edit modal if open
    setShowDeleteModal(true);
  };

  // Handle save (PATCH)
  const handleSave = async (objectData, updatedSpecs) => {
    const endpoint = `${API_BASE_URL}/${editingResourceType}/${objectData.metadata.name}`;
    
    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ spec: updatedSpecs })
    });

    if (!response.ok) {
      throw new Error(`Failed to update ${editingResourceType}: ${response.statusText}`);
    }
  };

  // Handle create (POST)
  const handleCreateResource = async (formData) => {
    const endpoint = `${API_BASE_URL}/${creatingResourceType}`;
    
    const createBody = {
      name: formData.name,
      namespace: formData.namespace || undefined,
      spec: formData.specs
    };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create ${creatingResourceType}: ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  };

  // Handle confirmed delete
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    
    try {
      const endpoint = `${API_BASE_URL}/${editingResourceType}/${editingObject.metadata.name}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete ${editingResourceType}: ${response.statusText} - ${errorText}`);
      }

      // Close modal
      setShowDeleteModal(false);
      setEditingObject(null);
      setEditingResourceType(null);
      
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Failed to delete ${editingResourceType}: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle VPC detail navigation
  const handleVpcDetail = (vpcName) => {
    setSelectedVpc(vpcName);
    setCurrentView('vpc-detail');
  };

  const handleBackToTopology = () => {
    setSelectedVpc(null);
    setCurrentView('topology');
  };

  const renderCurrentView = () => {
    if (currentView === 'topology') {
      return <NetworkTopology onVpcClick={handleVpcDetail} />;
    } else if (currentView === 'vpc-detail' && selectedVpc) {
      return (
        <VpcDetailView 
          vpcName={selectedVpc}
          onBack={handleBackToTopology}
        />
      );
    } else {
      return (
        <div className="container-fluid mt-4">
          <ResourceListView 
            resourceType={currentView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreate={handleCreate}
          />
        </div>
      );
    }
  };

  return (
    <div className="App">
      <Navigation 
        currentView={currentView} 
        onViewChange={setCurrentView}
      />
      
      {renderCurrentView()}
      
      {/* Generic create modal for all resources */}
      <GenericCreateModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        resourceType={creatingResourceType}
        onCreate={handleCreateResource}
      />
      
      {/* Generic edit modal for all resources */}
      <GenericEditModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        objectData={editingObject}
        resourceType={editingResourceType}
        onSave={handleSave}
        onDelete={handleDelete}
      />
      
      {/* Generic delete confirmation modal */}
      <ConfirmDeleteModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        objectData={editingObject}
        objectType={editingResourceType}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default App
