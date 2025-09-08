import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { resourceConfigs } from '../utils/resourceConfigs';

const GenericEditModal = ({ show, onHide, objectData, resourceType, onSave, onDelete }) => {
    const [specs, setSpecs] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const config = resourceConfigs[resourceType];

    useEffect(() => {
        if (objectData && objectData.spec) {
            setSpecs({ ...objectData.spec });
            setError(null);
            setSuccess(false);
        }
    }, [objectData]);

    const handleInputChange = (field, value) => {
        setSpecs(prev => ({
            ...prev,
            [field.key]: value
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        
        try {
            await onSave(objectData, specs);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onHide();
            }, 1500);
        } catch (err) {
            setError(err.message || 'Failed to save changes');
        } finally {
            setLoading(false);
        }
    };

    const renderField = (field) => {
        const value = specs[field.key] || '';
        
        switch (field.type) {
            case 'text':
                return (
                    <Form.Control
                        type="text"
                        value={field.isArray && Array.isArray(value) ? value.join(', ') : value}
                        onChange={(e) => {
                            const newValue = field.isArray 
                                ? e.target.value.split(',').map(v => v.trim()).filter(v => v)
                                : e.target.value;
                            handleInputChange(field, newValue);
                        }}
                        placeholder={field.placeholder}
                        required={field.required}
                    />
                );
            
            case 'number':
                return (
                    <Form.Control
                        type="number"
                        value={value}
                        onChange={(e) => handleInputChange(field, parseInt(e.target.value) || '')}
                        placeholder={field.placeholder}
                        required={field.required}
                    />
                );
            
            case 'textarea':
                return (
                    <Form.Control
                        as="textarea"
                        rows={field.rows || 3}
                        value={field.isArray && Array.isArray(value) ? value.join('\\n') : value}
                        onChange={(e) => {
                            const newValue = field.isArray 
                                ? e.target.value.split('\\n').map(v => v.trim()).filter(v => v)
                                : e.target.value;
                            handleInputChange(field, newValue);
                        }}
                        placeholder={field.placeholder}
                        required={field.required}
                    />
                );
            
            case 'select':
                return (
                    <Form.Select
                        value={value}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        required={field.required}
                    >
                        <option value="">Select {field.label}</option>
                        {field.options?.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </Form.Select>
                );
            
            case 'checkbox':
                return (
                    <Form.Check
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(e) => handleInputChange(field, e.target.checked)}
                    />
                );
            
            default:
                return (
                    <Form.Control
                        type="text"
                        value={value}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                    />
                );
        }
    };

    if (!objectData || !config) return null;

    return (
        <Modal show={show} onHide={onHide} size="lg" backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>
                    {config.icon} Edit {config.displayName}: {objectData.metadata?.name}
                </Modal.Title>
            </Modal.Header>
            
            <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {error && (
                    <Alert variant="danger" dismissible onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}
                
                {success && (
                    <Alert variant="success">
                        Changes saved successfully!
                    </Alert>
                )}

                <Form>
                    {/* Metadata section */}
                    <div className="mb-4">
                        <h6 className="text-muted">📋 Metadata</h6>
                        <div className="bg-light p-3 rounded">
                            <div><strong>Name:</strong> {objectData.metadata?.name}</div>
                            <div><strong>Namespace:</strong> {objectData.metadata?.namespace || 'N/A'}</div>
                            <div><strong>Created:</strong> {new Date(objectData.metadata?.creationTimestamp).toLocaleString()}</div>
                            <div><strong>Resource Version:</strong> {objectData.metadata?.resourceVersion}</div>
                        </div>
                    </div>

                    {/* Spec fields */}
                    <h6 className="text-muted mb-3">⚙️ Specifications</h6>
                    {config.fields.map(field => (
                        <Form.Group key={field.key} className="mb-3">
                            <Form.Label>
                                {field.label}
                                {field.required && <span className="text-danger"> *</span>}
                            </Form.Label>
                            {renderField(field)}
                            {field.placeholder && (
                                <Form.Text className="text-muted">
                                    {field.placeholder}
                                </Form.Text>
                            )}
                        </Form.Group>
                    ))}
                    
                    {/* Status section (read-only) */}
                    {objectData.status && Object.keys(objectData.status).length > 0 && (
                        <div className="mt-4">
                            <h6 className="text-muted">📊 Status (Read-only)</h6>
                            <div className="bg-light p-3 rounded">
                                {Object.entries(objectData.status).map(([key, value]) => (
                                    <div key={key} className="row mb-1">
                                        <div className="col-4 text-muted">{key}:</div>
                                        <div className="col-8">
                                            <small>{
                                                Array.isArray(value) ? value.join(', ') :
                                                typeof value === 'object' ? JSON.stringify(value) :
                                                String(value)
                                            }</small>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Form>
            </Modal.Body>
            
            <Modal.Footer className="d-flex justify-content-between">
                <div>
                    {onDelete && (
                        <Button 
                            variant="outline-danger" 
                            onClick={() => onDelete(objectData, resourceType)}
                            disabled={loading}
                        >
                            🗑️ Delete
                        </Button>
                    )}
                </div>
                <div>
                    <Button variant="secondary" onClick={onHide} disabled={loading} className="me-2">
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSave} disabled={loading}>
                        {loading ? (
                            <>
                                <Spinner size="sm" className="me-2" />
                                Saving...
                            </>
                        ) : (
                            '💾 Save Changes'
                        )}
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
};

export default GenericEditModal;
