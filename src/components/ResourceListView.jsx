import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Spinner, Alert, Badge, Form, InputGroup } from 'react-bootstrap';
import { resourceConfigs, getDisplayColumns, getCellValue } from '../utils/resourceConfigs';
import { API_BASE_URL } from '../config/api';

const ResourceListView = ({ resourceType, onEdit, onDelete, onCreate }) => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');

    const config = resourceConfigs[resourceType];

    useEffect(() => {
        fetchResources();
    }, [resourceType]);

    const fetchResources = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${API_BASE_URL}/${resourceType}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${resourceType}: ${response.statusText}`);
            }
            const data = await response.json();
            setResources(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Filter and sort resources
    const filteredAndSortedResources = resources
        .filter(resource => 
            resource.metadata.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (resource.spec && Object.values(resource.spec).some(val => 
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            ))
        )
        .sort((a, b) => {
            let aVal, bVal;
            
            if (sortField === 'name') {
                aVal = a.metadata.name;
                bVal = b.metadata.name;
            } else if (sortField === 'created') {
                aVal = new Date(a.metadata.creationTimestamp);
                bVal = new Date(b.metadata.creationTimestamp);
            } else {
                aVal = a.spec?.[sortField] || '';
                bVal = b.spec?.[sortField] || '';
            }
            
            if (sortDirection === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getSortIcon = (field) => {
        if (sortField !== field) return '↕️';
        return sortDirection === 'asc' ? '↑' : '↓';
    };

    if (!config) {
        return (
            <Alert variant="warning">
                Configuration not found for resource type: {resourceType}
            </Alert>
        );
    }

    return (
        <Card className="shadow">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                <div>
                    <h4 className="mb-0">
                        {config.icon} {config.displayName}s
                    </h4>
                </div>
                <div className="d-flex align-items-center gap-3">
                    {onCreate && (
                        <Button 
                            variant="success" 
                            size="sm"
                            onClick={() => onCreate(resourceType)}
                        >
                            ➕ Create New
                        </Button>
                    )}
                    <Badge bg="light" text="dark" className="fs-6">
                        {resources.length} items
                    </Badge>
                </div>
            </Card.Header>
            
            <Card.Body>
                {/* Search and controls */}
                <div className="row mb-3">
                    <div className="col-md-6">
                        <InputGroup>
                            <InputGroup.Text>🔍</InputGroup.Text>
                            <Form.Control
                                type="text"
                                placeholder={`Search ${config.displayName.toLowerCase()}s...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </div>
                    <div className="col-md-6 d-flex justify-content-end align-items-center">
                        <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={fetchResources}
                            disabled={loading}
                        >
                            {loading ? <Spinner size="sm" /> : '🔄 Refresh'}
                        </Button>
                    </div>
                </div>

                {/* Error state */}
                {error && (
                    <Alert variant="danger" dismissible onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Loading state */}
                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <div className="mt-2">Loading {config.displayName.toLowerCase()}s...</div>
                    </div>
                ) : (
                    <>
                        {/* Results table */}
                        <div className="table-responsive">
                            <Table striped hover>
                                <thead className="table-dark">
                                    <tr>
                                        <th 
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleSort('name')}
                                        >
                                            Name {getSortIcon('name')}
                                        </th>
                                        {config.fields
                                            .filter(f => f.required || ['cidrBlock', 'gateway', 'vpc', 'subnet', 'lanIp', 'type'].includes(f.key))
                                            .map(field => (
                                                <th 
                                                    key={field.key}
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => handleSort(field.key)}
                                                >
                                                    {field.label} {getSortIcon(field.key)}
                                                </th>
                                            ))}
                                        <th 
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleSort('created')}
                                        >
                                            Created {getSortIcon('created')}
                                        </th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAndSortedResources.map(resource => (
                                        <tr key={resource.metadata.name}>
                                            <td>
                                                <strong>{resource.metadata.name}</strong>
                                                {resource.metadata.namespace && (
                                                    <div className="text-muted small">
                                                        ns: {resource.metadata.namespace}
                                                    </div>
                                                )}
                                            </td>
                                            {config.fields
                                                .filter(f => f.required || ['cidrBlock', 'gateway', 'vpc', 'subnet', 'lanIp', 'type'].includes(f.key))
                                                .map(field => (
                                                    <td key={field.key}>
                                                        {getCellValue(resource, field)}
                                                    </td>
                                                ))}
                                            <td>
                                                <small className="text-muted">
                                                    {new Date(resource.metadata.creationTimestamp).toLocaleString()}
                                                </small>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline-primary"
                                                        onClick={() => onEdit(resource, resourceType)}
                                                    >
                                                        ✏️
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline-danger"
                                                        onClick={() => onDelete(resource, resourceType)}
                                                    >
                                                        🗑️
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>

                        {/* Empty state */}
                        {filteredAndSortedResources.length === 0 && !loading && (
                            <div className="text-center py-5">
                                <div className="text-muted">
                                    {searchTerm ? (
                                        <>
                                            <h5>No {config.displayName.toLowerCase()}s found matching "{searchTerm}"</h5>
                                            <Button variant="link" onClick={() => setSearchTerm('')}>
                                                Clear search
                                            </Button>
                                        </>
                                    ) : (
                                        <h5>No {config.displayName.toLowerCase()}s found</h5>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Results summary */}
                        {filteredAndSortedResources.length > 0 && (
                            <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                                <small className="text-muted">
                                    Showing {filteredAndSortedResources.length} of {resources.length} {config.displayName.toLowerCase()}s
                                    {searchTerm && ` matching "${searchTerm}"`}
                                </small>
                                <small className="text-muted">
                                    Sorted by {sortField} ({sortDirection === 'asc' ? 'ascending' : 'descending'})
                                </small>
                            </div>
                        )}
                    </>
                )}
            </Card.Body>
        </Card>
    );
};

export default ResourceListView;
