import { useState, useEffect, useCallback } from "react";
import ReactFlow, { MiniMap, Controls, Background, ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";
import { Button, Card, Row, Col, Spinner, Badge } from "react-bootstrap";
import TextUpdaterNode from '../TextUpdaterNode';
import EditObjectModal from './EditObjectModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { API_BASE_URL } from '../config/api';

const nodeTypes = { textUpdater: TextUpdaterNode };

const VpcDetailView = ({ vpcName, onBack, onObjectEdit }) => {
    const [vpc, setVpc] = useState(null);
    const [subnets, setSubnets] = useState([]);
    const [routers, setRouters] = useState([]);
    const [pods, setPods] = useState([]);
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
        if (vpcName) {
            fetchVpcData();
        }
    }, [vpcName]);

    const fetchVpcData = async () => {
        try {
            const [vpcsRes, subnetsRes, routersRes, ipsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/vpcs`),
                fetch(`${API_BASE_URL}/subnets`),
                fetch(`${API_BASE_URL}/vpc-nat-gateways`),
                fetch(`${API_BASE_URL}/ips`),
            ]);

            const [vpcsData, subnetsData, routersData, ipsData] = await Promise.all([
                vpcsRes.json(),
                subnetsRes.json(),
                routersRes.json(),
                ipsRes.json().catch(() => []),
            ]);

            // Find the specific VPC
            const targetVpc = Array.isArray(vpcsData) ? vpcsData.find(v => v.metadata.name === vpcName) : null;
            setVpc(targetVpc);
            setSubnets(Array.isArray(subnetsData) ? subnetsData : []);
            setRouters(Array.isArray(routersData) ? routersData : []);
            setPods(Array.isArray(ipsData) ? ipsData : []);

        } catch (error) {
            console.error("Error fetching VPC data:", error);
        } finally {
            setLoading(false);
        }
    };

    const buildTopology = useCallback(() => {
        if (!vpc) return { nodes: [], edges: [] };

        const nodes = [];
        const edges = [];
        
        // Add VPC NAT Gateways
        const vpcGateways = routers.filter((r) => r.spec && r.spec.vpc === vpc.metadata.name);
        
        // Filter subnets that belong to this VPC
        const vpcSubnets = subnets.filter((s) => s.spec && s.spec.vpc === vpc.metadata.name);
        
        // Filter IPs/pods that belong to subnets in this VPC
        const vpcPods = Array.isArray(pods) ? pods.filter((p) => {
            const podSubnet = p.spec?.subnet;
            const hasPodName = p.spec?.podName;
            return hasPodName && vpcSubnets.some(subnet => subnet.metadata.name === podSubnet);
        }) : [];

        // Add VPC NAT Gateways
        vpcGateways.forEach((gateway, index) => {
            const gatewayId = `gateway::${gateway.metadata.name}`;
            nodes.push({
                id: gatewayId,
                type: 'textUpdater',
                data: { 
                    label: `🛠 NAT Gateway: ${gateway.metadata.name}`,
                    info: `LAN IP: ${gateway.spec.lanIp || 'N/A'}`,
                    onClick: handleObjectEdit,
                    originalObject: gateway,
                    objectType: 'gateway'
                },
                position: { x: index * 300 + 150, y: 100 },
                style: {
                    background: "#f0f9ff",
                    border: "2px solid #38bdf8",
                    borderRadius: 12,
                    padding: 10,
                    minWidth: 200,
                },
            });
        });

        // Add subnets
        vpcSubnets.forEach((subnet, index) => {
            const subnetId = `subnet::${subnet.metadata.name}`;
            nodes.push({
                id: subnetId,
                type: 'textUpdater',
                data: { 
                    label: `🌐 Subnet: ${subnet.metadata.name}`, 
                    info: `CIDR: ${subnet.spec.cidrBlock}`,
                    onClick: handleObjectEdit,
                    originalObject: subnet,
                    objectType: 'subnet'
                },
                position: { x: index * 250 + 100, y: 300 },
                style: {
                    background: "#fefce8",
                    border: "2px solid #facc15",
                    borderRadius: 12,
                    padding: 10,
                    minWidth: 180,
                },
            });

            // Connect subnet to its associated NAT gateways
            vpcGateways.forEach((gateway) => {
                const gatewayId = `gateway::${gateway.metadata.name}`;
                if (gateway.spec.subnet === subnet.metadata.name) {
                    edges.push({
                        id: `edge::${gateway.metadata.name}-${subnet.metadata.name}`,
                        source: gatewayId,
                        target: subnetId,
                        animated: true,
                        style: { stroke: "#38bdf8", strokeWidth: 2 },
                        label: 'Connected'
                    });
                }
            });
        });
        
        // Add pods connected to subnets
        vpcPods.forEach((pod, podIndex) => {
            const podSubnet = pod.spec?.subnet;
            const podIp = pod.spec?.ipAddress || 'N/A';
            const podName = pod.spec?.podName || pod.metadata.name;
            const podNamespace = pod.spec?.namespace || 'default';
            
            const podId = `pod::${podName}`;
            nodes.push({
                id: podId,
                type: 'textUpdater',
                data: { 
                    label: `📦 ${podName}`,
                    info: `IP: ${podIp} | NS: ${podNamespace}`,
                    onClick: null, // No edit functionality for pods
                    originalObject: pod,
                    objectType: 'pod'
                },
                position: { 
                    x: (podIndex % 6) * 180 + 50, // 6 pods per row for larger view
                    y: 500 + Math.floor(podIndex / 6) * 100
                },
                style: {
                    background: "#f0fdf4",
                    border: "2px solid #22c55e",
                    borderRadius: 8,
                    padding: 8,
                    minWidth: 160,
                    fontSize: '12px'
                },
            });
            
            // Connect pod to its subnet
            if (podSubnet) {
                const subnetId = `subnet::${podSubnet}`;
                const subnetExists = vpcSubnets.some(s => s.metadata.name === podSubnet);
                if (subnetExists) {
                    edges.push({
                        id: `edge::pod-${podName}-${podSubnet}`,
                        source: subnetId,
                        target: podId,
                        animated: false,
                        style: { stroke: "#22c55e", strokeWidth: 1, strokeDasharray: '2,2' },
                        label: 'Pod'
                    });
                }
            }
        });

        return { nodes, edges };
    }, [vpc, subnets, routers, pods]);

    // Handle object editing
    const handleObjectEdit = (objectData, objectType) => {
        setEditingObject(objectData);
        setEditingObjectType(objectType);
        setShowModal(true);
    };

    // API patch function
    const handleSaveObject = async (objectData, updatedSpecs) => {
        let endpoint;
        switch (editingObjectType) {
            case 'subnet':
                endpoint = `${API_BASE_URL}/subnets/${objectData.metadata.name}`;
                break;
            case 'gateway':
                endpoint = `${API_BASE_URL}/vpc-nat-gateways/${objectData.metadata.name}`;
                break;
            default:
                endpoint = `${API_BASE_URL}/vpc-nat-gateways/${objectData.metadata.name}`;
        }
        
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
        await fetchVpcData();
    };

    // Handle delete request
    const handleObjectDelete = (objectData, objectType) => {
        setDeletingObject(objectData);
        setDeletingObjectType(objectType);
        setShowModal(false);
        setShowDeleteModal(true);
    };

    // Handle confirmed delete
    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        
        try {
            let endpoint;
            switch (deletingObjectType) {
                case 'subnet':
                    endpoint = `${API_BASE_URL}/subnets/${deletingObject.metadata.name}`;
                    break;
                case 'gateway':
                    endpoint = `${API_BASE_URL}/vpc-nat-gateways/${deletingObject.metadata.name}`;
                    break;
                default:
                    endpoint = `${API_BASE_URL}/vpc-nat-gateways/${deletingObject.metadata.name}`;
            }
            
            const response = await fetch(endpoint, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to delete ${deletingObjectType}: ${response.statusText} - ${errorText}`);
            }

            // Refresh data after successful deletion
            await fetchVpcData();
            
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

    if (!vpc) {
        return (
            <div className="container-fluid mt-4">
                <div className="d-flex align-items-center mb-4">
                    <Button variant="outline-secondary" onClick={onBack} className="me-3">
                        ← Back to Topology
                    </Button>
                    <h2 className="text-danger mb-0">VPC "{vpcName}" not found</h2>
                </div>
            </div>
        );
    }

    const { nodes, edges } = buildTopology();
    const subnetCount = subnets.filter((s) => s.spec && s.spec.vpc === vpc.metadata.name).length;
    const gatewayCount = routers.filter((r) => r.spec && r.spec.vpc === vpc.metadata.name).length;
    const podCount = Array.isArray(pods) ? pods.filter((p) => {
        const podSubnet = p.spec?.subnet;
        const hasPodName = p.spec?.podName;
        return hasPodName && subnets.some(s => s.spec && s.spec.vpc === vpc.metadata.name && s.metadata.name === podSubnet);
    }).length : 0;

    return (
        <div className="container-fluid mt-4">
            {/* Header with back button and VPC info */}
            <Row className="mb-4">
                <Col>
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                            <Button variant="outline-secondary" onClick={onBack} className="me-3">
                                ← Back to Topology
                            </Button>
                            <div>
                                <h2 className="mb-1">🏢 VPC: {vpc.metadata.name}</h2>
                                <div>
                                    <Badge bg="primary" className="me-2">{subnetCount} Subnet(s)</Badge>
                                    <Badge bg="info" className="me-2">{gatewayCount} Gateway(s)</Badge>
                                    <Badge bg="success">{podCount} Pod(s)</Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Full-screen topology view */}
            <Row>
                <Col xs={12}>
                    <Card className="shadow border-0">
                        <Card.Body className="p-0" style={{ height: "80vh" }}>
                            <div style={{ width: '100%', height: '100%' }}>
                                <ReactFlowProvider>
                                    <ReactFlow 
                                        nodes={nodes} 
                                        edges={edges} 
                                        nodeTypes={nodeTypes} 
                                        fitView
                                        fitViewOptions={{ padding: 0.1 }}
                                        minZoom={0.3}
                                        maxZoom={3}
                                        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                                        proOptions={{ hideAttribution: true }}
                                    >
                                        <Background variant="dots" gap={12} size={1} color="#f1f1f1" />
                                        <Controls />
                                        <MiniMap />
                                    </ReactFlow>
                                </ReactFlowProvider>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            
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

export default VpcDetailView;