import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { resourceConfigs } from '../utils/resourceConfigs';

const GenericCreateModal = ({ show, onHide, resourceType, onCreate }) => {
    const [formData, setFormData] = useState({ name: '', namespace: '', specs: {} });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    const config = resourceConfigs[resourceType];

    useEffect(() => {
        if (show) {
            // Reset form when modal opens
            setFormData({ name: '', namespace: '', specs: {} });
            setError(null);
            setSuccess(false);
            setValidationErrors({});
        }
    }, [show, resourceType]);

    const handleInputChange = (field, value) => {
        if (field === 'name' || field === 'namespace') {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                specs: {
                    ...prev.specs,
                    [field]: value
                }
            }));
        }

        // Clear validation error for this field
        if (validationErrors[field]) {
            setValidationErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    const validateForm = () => {
        const errors = {};

        // Validate name
        if (!formData.name.trim()) {
            errors.name = 'Name is required';
        }

        // Validate required spec fields
        if (config) {
            config.fields.forEach(field => {
                if (field.required && !formData.specs[field.key]) {
                    errors[field.key] = `${field.label} is required`;
                }
            });
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreate = async () => {
        if (!validateForm()) {
            setError('Please fill in all required fields');
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            await onCreate(formData);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onHide();
            }, 1500);
        } catch (err) {
            setError(err.message || 'Failed to create resource');
        } finally {
            setLoading(false);
        }
    };

    const renderField = (field) => {
        const value = formData.specs[field.key] || '';
        const hasError = validationErrors[field.key];
        
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
                            handleInputChange(field.key, newValue);
                        }}
                        placeholder={field.placeholder}
                        required={field.required}
                        isInvalid={hasError}
                    />
                );
            
            case 'number':
                return (
                    <Form.Control
                        type="number"
                        value={value}
                        onChange={(e) => handleInputChange(field.key, parseInt(e.target.value) || '')}
                        placeholder={field.placeholder}
                        required={field.required}
                        isInvalid={hasError}
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
                            handleInputChange(field.key, newValue);
                        }}
                        placeholder={field.placeholder}
                        required={field.required}
                        isInvalid={hasError}
                    />
                );
            
            case 'select':
                return (
                    <Form.Select
                        value={value}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        required={field.required}
                        isInvalid={hasError}
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
                        onChange={(e) => handleInputChange(field.key, e.target.checked)}
                    />
                );
            
            default:
                return (
                    <Form.Control
                        type="text"
                        value={value}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        isInvalid={hasError}
                    />
                );
        }
    };

    if (!config) return null;

    return (
        <Modal show={show} onHide={onHide} size="lg" backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>
                    ➕ Create New {config.displayName}
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
                        {config.displayName} created successfully!
                    </Alert>
                )}

                <Form>
                    {/* Basic metadata */}
                    <div className="mb-4">
                        <h6 className="text-muted">📋 Basic Information</h6>
                        
                        <Form.Group className="mb-3">
                            <Form.Label>
                                Name <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder={`Enter ${config.displayName.toLowerCase()} name`}
                                required
                                isInvalid={validationErrors.name}
                            />
                            {validationErrors.name && (
                                <Form.Control.Feedback type="invalid">
                                    {validationErrors.name}
                                </Form.Control.Feedback>
                            )}
                            <Form.Text className="text-muted">
                                Must be a valid Kubernetes resource name (lowercase, alphanumeric, hyphens)
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Namespace</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.namespace}
                                onChange={(e) => handleInputChange('namespace', e.target.value)}
                                placeholder="Leave empty for cluster-scoped resources"
                            />
                            <Form.Text className="text-muted">
                                Optional. Most Kube-OVN resources are cluster-scoped.
                            </Form.Text>
                        </Form.Group>
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
                            {validationErrors[field.key] && (
                                <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                                    {validationErrors[field.key]}
                                </Form.Control.Feedback>
                            )}
                            {field.placeholder && !validationErrors[field.key] && (
                                <Form.Text className="text-muted">
                                    {field.placeholder}
                                </Form.Text>
                            )}
                        </Form.Group>
                    ))}
                </Form>
            </Modal.Body>
            
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={loading}>
                    Cancel
                </Button>
                <Button variant="success" onClick={handleCreate} disabled={loading}>
                    {loading ? (
                        <>
                            <Spinner size="sm" className="me-2" />
                            Creating...
                        </>
                    ) : (
                        <>
                            ➕ Create {config.displayName}
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default GenericCreateModal;
