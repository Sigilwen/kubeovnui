import { useState, useEffect, useCallback } from "react";
import ReactFlow, { MiniMap, Controls, Background, ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";
import { Card, Row, Col, Spinner } from "react-bootstrap";
import TextUpdaterNode from './TextUpdaterNode';
import EditObjectModal from './components/EditObjectModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import { API_BASE_URL } from './config/api';

const nodeTypes = { textUpdater: TextUpdaterNode };

// Separate component for each VPC topology to avoid ReactFlow instance conflicts
const VpcTopologyCard = ({ vpc, subnets, routers, onObjectEdit }) => {
    // Generate a unique key for this VPC to force ReactFlow re-mount
    const [uniqueKey] = useState(() => `${vpc.metadata.name}-${Math.random().toString(36).substr(2, 9)}`);
    
    const buildTopology = useCallback(() => {
        const nodes = [];
        const edges = [];
        
        // Add VPC NAT Gateways (these ARE the routers for this VPC)
        const vpcGateways = routers.filter((r) => r.spec && r.spec.vpc === vpc.metadata.name);
        
        vpcGateways.forEach((gateway, index) => {
            const gatewayId = `${vpc.metadata.name}::gateway::${gateway.metadata.name}`;
            nodes.push({
                id: gatewayId,
                type: 'textUpdater',
                data: { 
                    label: `🛠 NAT Gateway: ${gateway.metadata.name}`,
                    info: `LAN IP: ${gateway.spec.lanIp || 'N/A'}`,
                    onClick: onObjectEdit,
                    originalObject: gateway,
                    objectType: 'gateway'
                },
                position: { x: index * 250 + 100, y: 80 },
                style: {
                    background: "#f0f9ff",
                    border: "2px solid #38bdf8",
                    borderRadius: 12,
                    padding: 10,
                    minWidth: 180,
                },
            });
        });

        // Filter subnets that belong to this VPC only
        const vpcSubnets = subnets.filter((s) => s.spec && s.spec.vpc === vpc.metadata.name);
        
        vpcSubnets.forEach((subnet, index) => {
            const subnetId = `${vpc.metadata.name}::subnet::${subnet.metadata.name}`;
            nodes.push({
                id: subnetId,
                type: 'textUpdater',
                data: { 
                    label: `🌐 Subnet: ${subnet.metadata.name}`, 
                    info: `CIDR: ${subnet.spec.cidrBlock}`,
                    onClick: onObjectEdit,
                    originalObject: subnet,
                    objectType: 'subnet'
                },
                position: { x: index * 200 + 50, y: 250 },
                style: {
                    background: "#fefce8",
                    border: "2px solid #facc15",
                    borderRadius: 12,
                    padding: 10,
                    minWidth: 150,
                },
            });

            // Connect subnet to its associated NAT gateways
            vpcGateways.forEach((gateway, gatewayIndex) => {
                const gatewayId = `${vpc.metadata.name}::gateway::${gateway.metadata.name}`;
                // Connect if this gateway is specifically for this subnet
                if (gateway.spec.subnet === subnet.metadata.name) {
                    edges.push({
                        id: `${vpc.metadata.name}::edge::${gateway.metadata.name}-${subnet.metadata.name}`,
                        source: gatewayId,
                        target: subnetId,
                        animated: true,
                        style: { stroke: "#38bdf8", strokeWidth: 2 },
                        label: 'Connected'
                    });
                }
            });
        });

        return { nodes, edges };
    }, [vpc, subnets, routers, onObjectEdit]);

    const { nodes, edges } = buildTopology();
    const actualSubnetCount = subnets.filter((s) => s.spec && s.spec.vpc === vpc.metadata.name).length;
    const gatewayCount = routers.filter((r) => r.spec && r.spec.vpc === vpc.metadata.name).length;

    return (
        <Col lg={6} xl={4} className="mb-4">
            <Card className="shadow border-0 h-100">
                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                    <strong>VPC: {vpc.metadata.name}</strong>
                    <small>
                        {actualSubnetCount} subnet(s), {gatewayCount} gateway(s)
                    </small>
                </Card.Header>
                <Card.Body className="p-0" style={{ height: "450px" }}>
                    <div style={{ width: '100%', height: '100%' }}>
                        <ReactFlowProvider key={uniqueKey}>
                            <ReactFlow 
                                nodes={nodes} 
                                edges={edges} 
                                nodeTypes={nodeTypes} 
                                fitView
                                fitViewOptions={{ padding: 0.1 }}
                                minZoom={0.5}
                                maxZoom={2}
                                defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                                proOptions={{ hideAttribution: true }}
                            >
                                <Background variant="dots" gap={12} size={1} color="#f1f1f1" />
                            </ReactFlow>
                        </ReactFlowProvider>
                    </div>
                </Card.Body>
            </Card>
        </Col>
    );
};

const NetworkTopology = () => {
    const [vpcs, setVpcs] = useState([]);
    const [subnets, setSubnets] = useState([]);
    const [routers, setRouters] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingObject, setEditingObject] = useState(null);
    const [editingObjectType, setEditingObjectType] = useState(null);
    
    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingObject, setDeletingObject] = useState(null);
    const [deletingObjectType, setDeletingObjectType] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchTopologyData();
    }, []);

    const fetchTopologyData = async () => {
        try {
            const [vpcsRes, subnetsRes, routersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/vpcs`),
                fetch(`${API_BASE_URL}/subnets`),
                fetch(`${API_BASE_URL}/vpc-nat-gateways`),
            ]);

            const [vpcsData, subnetsData, routersData] = await Promise.all([
                vpcsRes.json(),
                subnetsRes.json(),
                routersRes.json(),
            ]);

            setVpcs(vpcsData);
            setSubnets(subnetsData);
            setRouters(routersData);

        } catch (error) {
            console.error("Error fetching topology data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Handle object editing
    const handleObjectEdit = (objectData, objectType) => {
        setEditingObject(objectData);
        setEditingObjectType(objectType);
        setShowModal(true);
    };

    // API patch function
    const handleSaveObject = async (objectData, updatedSpecs) => {
        const endpoint = editingObjectType === 'subnet' 
            ? `${API_BASE_URL}/subnets/${objectData.metadata.name}` 
            : `${API_BASE_URL}/vpc-nat-gateways/${objectData.metadata.name}`;
        
        const patchData = {
            spec: updatedSpecs
        };

        const response = await fetch(endpoint, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(patchData)
        });

        if (!response.ok) {
            throw new Error(`Failed to update ${editingObjectType}: ${response.statusText}`);
        }

        // Refresh data after successful update
        await fetchTopologyData();
    };

    // Handle delete request (opens confirmation modal)
    const handleObjectDelete = (objectData, objectType) => {
        setDeletingObject(objectData);
        setDeletingObjectType(objectType);
        setShowModal(false); // Close edit modal
        setShowDeleteModal(true); // Open delete confirmation
    };

    // Handle confirmed delete
    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        
        try {
            const endpoint = deletingObjectType === 'subnet' 
                ? `${API_BASE_URL}/subnets/${deletingObject.metadata.name}` 
                : `${API_BASE_URL}/vpc-nat-gateways/${deletingObject.metadata.name}`;
            
            const response = await fetch(endpoint, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to delete ${deletingObjectType}: ${response.statusText} - ${errorText}`);
            }

            // Refresh data after successful deletion
            await fetchTopologyData();
            
            // Close modal
            setShowDeleteModal(false);
            setDeletingObject(null);
            setDeletingObjectType(null);
            
        } catch (error) {
            console.error('Delete error:', error);
            alert(`Failed to delete ${deletingObjectType}: ${error.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div className="container-fluid mt-4">
            <h2 className="mb-4 text-center">Kube-OVN Network Topology</h2>
            <Row>
                {vpcs.map((vpc) => (
                    <VpcTopologyCard 
                        key={vpc.metadata.name}
                        vpc={vpc} 
                        subnets={subnets} 
                        routers={routers}
                        onObjectEdit={handleObjectEdit}
                    />
                ))}
            </Row>
            {vpcs.length === 0 && (
                <div className="text-center mt-5">
                    <h4 className="text-muted">No VPCs found</h4>
                    <p className="text-muted">Check your API connection or create some VPCs.</p>
                </div>
            )}
            
            <EditObjectModal
                show={showModal}
                onHide={() => setShowModal(false)}
                objectData={editingObject}
                objectType={editingObjectType}
                onSave={handleSaveObject}
                onDelete={handleObjectDelete}
            />
            
            <ConfirmDeleteModal
                show={showDeleteModal}
                onHide={() => setShowDeleteModal(false)}
                objectData={deletingObject}
                objectType={deletingObjectType}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
            />
        </div>
    );
};

export default NetworkTopology;
