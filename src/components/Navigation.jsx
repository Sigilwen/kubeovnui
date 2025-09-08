import React from 'react';
import { Navbar, Nav, NavDropdown } from 'react-bootstrap';

const Navigation = ({ currentView, onViewChange }) => {
    const resourceGroups = {
        'Network Topology': [
            { key: 'topology', label: '🗺️ Network Topology', description: 'Visual network diagram' }
        ],
        'Core Resources': [
            { key: 'vpcs', label: '🏢 VPCs', description: 'Virtual Private Clouds' },
            { key: 'subnets', label: '🌐 Subnets', description: 'Network subnets' },
            { key: 'vpc-nat-gateways', label: '🛠️ NAT Gateways', description: 'VPC NAT gateways' }
        ],
        'IP Management': [
            { key: 'ips', label: '📋 IPs', description: 'IP addresses' },
            { key: 'ippools', label: '🏊 IP Pools', description: 'IP address pools' }
        ],
        'Load Balancing': [
            { key: 'switch-lb-rules', label: '⚖️ Switch LB Rules', description: 'Switch load balancer rules' },
            { key: 'vips', label: '🎯 VIPs', description: 'Virtual IP addresses' }
        ],
        'Security & QoS': [
            { key: 'security-groups', label: '🔒 Security Groups', description: 'Network security groups' },
            { key: 'qos-policies', label: '⚡ QoS Policies', description: 'Quality of Service policies' }
        ],
        'Network Rules': [
            { key: 'iptables-dnat-rules', label: '↗️ DNAT Rules', description: 'Destination NAT rules' },
            { key: 'iptables-snat-rules', label: '↖️ SNAT Rules', description: 'Source NAT rules' },
            { key: 'iptables-fip-rules', label: '🌍 FIP Rules', description: 'Floating IP rules' },
            { key: 'ovn-dnat-rules', label: '📡 OVN DNAT', description: 'OVN DNAT rules' },
            { key: 'ovn-snat-rules', label: '📶 OVN SNAT', description: 'OVN SNAT rules' },
            { key: 'ovn-fips', label: '🌐 OVN FIPs', description: 'OVN floating IPs' }
        ],
        'External & Advanced': [
            { key: 'iptables-eips', label: '🌍 External IPs', description: 'External IP addresses' },
            { key: 'ovn-eips', label: '🗺️ OVN EIPs', description: 'OVN external IPs' },
            { key: 'provider-networks', label: '🌉 Provider Networks', description: 'Provider network configurations' },
            { key: 'vpc-dnses', label: '🔍 VPC DNS', description: 'VPC DNS configurations' },
            { key: 'vlans', label: '🔗 VLANs', description: 'VLAN configurations' }
        ]
    };

    return (
        <Navbar bg="dark" variant="dark" expand="lg" className="mb-0">
            <div className="container-fluid">
                <Navbar.Brand href="#" onClick={() => onViewChange('topology')}>
                    🔧 Kube-OVN Manager
                </Navbar.Brand>
                
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        {Object.entries(resourceGroups).map(([groupName, resources]) => (
                            <NavDropdown 
                                key={groupName} 
                                title={groupName} 
                                id={`nav-dropdown-${groupName.toLowerCase().replace(' ', '-')}`}
                                className="me-3"
                            >
                                {resources.map(resource => (
                                    <NavDropdown.Item 
                                        key={resource.key}
                                        active={currentView === resource.key}
                                        onClick={() => onViewChange(resource.key)}
                                        className="d-flex flex-column align-items-start py-2"
                                    >
                                        <div className="fw-bold">{resource.label}</div>
                                        <small className="text-muted">{resource.description}</small>
                                    </NavDropdown.Item>
                                ))}
                                {groupName !== 'Network Topology' && (
                                    <>
                                        <NavDropdown.Divider />
                                        <NavDropdown.Item 
                                            onClick={() => onViewChange('topology')}
                                            className="text-primary"
                                        >
                                            ← Back to Topology
                                        </NavDropdown.Item>
                                    </>
                                )}
                            </NavDropdown>
                        ))}
                    </Nav>
                    
                    <Nav>
                        <Nav.Link className="text-light">
                            Current: <span className="text-info">{
                                Object.values(resourceGroups).flat()
                                    .find(r => r.key === currentView)?.label || '🗺️ Network Topology'
                            }</span>
                        </Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </div>
        </Navbar>
    );
};

export default Navigation;
