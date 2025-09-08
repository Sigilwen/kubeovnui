import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert } from 'react-bootstrap';

const ConfirmDeleteModal = ({ show, onHide, objectData, objectType, onConfirm, isDeleting }) => {
    const [confirmText, setConfirmText] = useState('');
    const [isConfirmEnabled, setIsConfirmEnabled] = useState(false);
    
    // Reset confirmation when modal opens/closes
    useEffect(() => {
        if (show) {
            setConfirmText('');
            setIsConfirmEnabled(false);
        }
    }, [show]);
    
    // Update button state when text changes
    useEffect(() => {
        setIsConfirmEnabled(confirmText === 'DELETE');
    }, [confirmText]);
    
    if (!objectData) return null;

    const getWarningMessage = () => {
        if (objectType === 'subnet') {
            return (
                <div>
                    <p>This will permanently delete the subnet <strong>{objectData.metadata?.name}</strong>.</p>
                    <p className="text-warning">⚠️ Any pods or services using this subnet may be affected.</p>
                </div>
            );
        } else {
            return (
                <div>
                    <p>This will permanently delete the VPC NAT Gateway <strong>{objectData.metadata?.name}</strong>.</p>
                    <p className="text-warning">⚠️ This may affect external connectivity for the associated subnet.</p>
                </div>
            );
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered backdrop="static">
            <Modal.Header closeButton className="bg-danger text-white">
                <Modal.Title>
                    🗑️ Confirm Deletion
                </Modal.Title>
            </Modal.Header>
            
            <Modal.Body>
                <Alert variant="danger" className="mb-3">
                    <strong>This action cannot be undone!</strong>
                </Alert>
                
                {getWarningMessage()}
                
                <div className="bg-light p-3 rounded mt-3">
                    <h6>Object Details:</h6>
                    <div><strong>Name:</strong> {objectData.metadata?.name}</div>
                    <div><strong>Type:</strong> {objectType === 'subnet' ? 'Subnet' : 'VPC NAT Gateway'}</div>
                    {objectType === 'subnet' && objectData.spec && (
                        <div><strong>CIDR:</strong> {objectData.spec.cidrBlock}</div>
                    )}
                    {objectType === 'gateway' && objectData.spec && (
                        <div><strong>LAN IP:</strong> {objectData.spec.lanIp}</div>
                    )}
                </div>
                
                <div className="mt-4 p-3 bg-warning bg-opacity-10 rounded">
                    <strong>Type "DELETE" below to confirm:</strong>
                    <div className="position-relative">
                        <input 
                            type="text" 
                            className={`form-control mt-2 ${confirmText === 'DELETE' ? 'border-success' : ''}`}
                            placeholder="Type DELETE to confirm"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            autoFocus
                        />
                        {confirmText === 'DELETE' && (
                            <span className="position-absolute end-0 top-50 translate-middle-y me-2 text-success">
                                ✓
                            </span>
                        )}
                    </div>
                    {isConfirmEnabled && (
                        <small className="text-success mt-1 d-block">
                            ✓ Ready to delete - click the button below
                        </small>
                    )}
                </div>
            </Modal.Body>
            
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={isDeleting}>
                    Cancel
                </Button>
                <Button 
                    variant="danger" 
                    onClick={onConfirm} 
                    disabled={!isConfirmEnabled || isDeleting}
                >
                    {isDeleting ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Deleting...
                        </>
                    ) : (
                        <>
                            🗑️ Delete Permanently
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ConfirmDeleteModal;
