import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';

const EditObjectModal = ({ show, onHide, objectData, objectType, onSave, onDelete }) => {
    const [specs, setSpecs] = useState({});
    const [loading, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

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
            [field]: value
        }));
    };

    const handleSave = async () => {
        setSaving(true);
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
            setSaving(false);
        }
    };

    const renderSubnetFields = () => (
        <>
            <Form.Group className="mb-3">
                <Form.Label>CIDR Block</Form.Label>
                <Form.Control
                    type="text"
                    value={specs.cidrBlock || ''}
                    onChange={(e) => handleInputChange('cidrBlock', e.target.value)}
                    placeholder="e.g., 10.0.1.0/24"
                />
            </Form.Group>
            
            <Form.Group className="mb-3">
                <Form.Label>Gateway</Form.Label>
                <Form.Control
                    type="text"
                    value={specs.gateway || ''}
                    onChange={(e) => handleInputChange('gateway', e.target.value)}
                    placeholder="e.g., 10.0.1.1"
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Exclude IPs</Form.Label>
                <Form.Control
                    type="text"
                    value={specs.excludeIps ? specs.excludeIps.join(', ') : ''}
                    onChange={(e) => handleInputChange('excludeIps', e.target.value.split(',').map(ip => ip.trim()).filter(ip => ip))}
                    placeholder="e.g., 10.0.1.1, 10.0.1.2..10.0.1.10"
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Protocol</Form.Label>
                <Form.Select
                    value={specs.protocol || ''}
                    onChange={(e) => handleInputChange('protocol', e.target.value)}
                >
                    <option value="">Select Protocol</option>
                    <option value="IPv4">IPv4</option>
                    <option value="IPv6">IPv6</option>
                    <option value="Dual">Dual</option>
                </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>VPC</Form.Label>
                <Form.Control
                    type="text"
                    value={specs.vpc || ''}
                    onChange={(e) => handleInputChange('vpc', e.target.value)}
                    placeholder="VPC name"
                />
            </Form.Group>

            <div className="row">
                <div className="col-md-6">
                    <Form.Check
                        type="checkbox"
                        label="NAT Outgoing"
                        checked={specs.natOutgoing || false}
                        onChange={(e) => handleInputChange('natOutgoing', e.target.checked)}
                    />
                </div>
                <div className="col-md-6">
                    <Form.Check
                        type="checkbox"
                        label="Enable Load Balancer"
                        checked={specs.enableLb || false}
                        onChange={(e) => handleInputChange('enableLb', e.target.checked)}
                    />
                </div>
            </div>
        </>
    );

    const renderGatewayFields = () => (
        <>
            <Form.Group className="mb-3">
                <Form.Label>LAN IP</Form.Label>
                <Form.Control
                    type="text"
                    value={specs.lanIp || ''}
                    onChange={(e) => handleInputChange('lanIp', e.target.value)}
                    placeholder="e.g., 10.0.1.1"
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Subnet</Form.Label>
                <Form.Control
                    type="text"
                    value={specs.subnet || ''}
                    onChange={(e) => handleInputChange('subnet', e.target.value)}
                    placeholder="Subnet name"
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>VPC</Form.Label>
                <Form.Control
                    type="text"
                    value={specs.vpc || ''}
                    onChange={(e) => handleInputChange('vpc', e.target.value)}
                    placeholder="VPC name"
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>External Subnets</Form.Label>
                <Form.Control
                    type="text"
                    value={specs.externalSubnets ? specs.externalSubnets.join(', ') : ''}
                    onChange={(e) => handleInputChange('externalSubnets', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                    placeholder="External subnet names, comma separated"
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Selector</Form.Label>
                <Form.Control
                    as="textarea"
                    rows={3}
                    value={specs.selector ? specs.selector.join('\n') : ''}
                    onChange={(e) => handleInputChange('selector', e.target.value.split('\n').map(s => s.trim()).filter(s => s))}
                    placeholder="Node selectors, one per line"
                />
            </Form.Group>
        </>
    );

    if (!objectData) return null;

    return (
        <Modal show={show} onHide={onHide} size="lg" backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>
                    Edit {objectType === 'subnet' ? 'Subnet' : 'VPC NAT Gateway'}: {objectData.metadata?.name}
                </Modal.Title>
            </Modal.Header>
            
            <Modal.Body>
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
                    <div className="mb-4">
                        <h6 className="text-muted">Metadata</h6>
                        <div className="bg-light p-3 rounded">
                            <div><strong>Name:</strong> {objectData.metadata?.name}</div>
                            <div><strong>Namespace:</strong> {objectData.metadata?.namespace || 'N/A'}</div>
                            <div><strong>Created:</strong> {new Date(objectData.metadata?.creationTimestamp).toLocaleString()}</div>
                        </div>
                    </div>

                    <h6 className="text-muted mb-3">Specifications</h6>
                    {objectType === 'subnet' ? renderSubnetFields() : renderGatewayFields()}
                </Form>
            </Modal.Body>
            
            <Modal.Footer className="d-flex justify-content-between">
                <div>
                    {onDelete && (
                        <Button 
                            variant="outline-danger" 
                            onClick={() => onDelete(objectData, objectType)}
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
                            'Save Changes'
                        )}
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
};

export default EditObjectModal;
