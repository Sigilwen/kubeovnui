// Resource field configurations for dynamic form generation
export const resourceConfigs = {
    subnets: {
        displayName: 'Subnet',
        icon: '🌐',
        fields: [
            { key: 'cidrBlock', label: 'CIDR Block', type: 'text', placeholder: 'e.g., 10.0.1.0/24', required: true },
            { key: 'gateway', label: 'Gateway', type: 'text', placeholder: 'e.g., 10.0.1.1' },
            { key: 'vpc', label: 'VPC', type: 'text', placeholder: 'VPC name' },
            { key: 'protocol', label: 'Protocol', type: 'select', options: ['IPv4', 'IPv6', 'Dual'] },
            { key: 'excludeIps', label: 'Exclude IPs', type: 'text', placeholder: 'Comma separated IPs or ranges', isArray: true },
            { key: 'gatewayType', label: 'Gateway Type', type: 'select', options: ['distributed', 'centralized'] },
            { key: 'natOutgoing', label: 'NAT Outgoing', type: 'checkbox' },
            { key: 'enableLb', label: 'Enable Load Balancer', type: 'checkbox' },
            { key: 'private', label: 'Private', type: 'checkbox' }
        ]
    },
    'vpc-nat-gateways': {
        displayName: 'VPC NAT Gateway',
        icon: '🛠️',
        fields: [
            { key: 'lanIp', label: 'LAN IP', type: 'text', placeholder: 'e.g., 10.0.1.1', required: true },
            { key: 'subnet', label: 'Subnet', type: 'text', placeholder: 'Subnet name', required: true },
            { key: 'vpc', label: 'VPC', type: 'text', placeholder: 'VPC name', required: true },
            { key: 'externalSubnets', label: 'External Subnets', type: 'text', placeholder: 'Comma separated subnet names', isArray: true },
            { key: 'selector', label: 'Node Selector', type: 'textarea', placeholder: 'One selector per line', isArray: true, rows: 3 }
        ]
    },
    vpcs: {
        displayName: 'VPC',
        icon: '🏢',
        fields: [
            { key: 'namespaces', label: 'Namespaces', type: 'text', placeholder: 'Comma separated namespaces', isArray: true }
        ]
    },
    ips: {
        displayName: 'IP',
        icon: '📋',
        fields: [
            { key: 'podName', label: 'Pod Name', type: 'text', placeholder: 'Pod name', required: true },
            { key: 'namespace', label: 'Namespace', type: 'text', placeholder: 'Namespace' },
            { key: 'subnet', label: 'Subnet', type: 'text', placeholder: 'Subnet name' },
            { key: 'attachSubnets', label: 'Attach Subnets', type: 'text', placeholder: 'Comma separated subnet names', isArray: true },
            { key: 'ipAddress', label: 'IP Address', type: 'text', placeholder: 'e.g., 10.0.1.100', required: true },
            { key: 'macAddress', label: 'MAC Address', type: 'text', placeholder: 'e.g., aa:bb:cc:dd:ee:ff' }
        ]
    },
    ippools: {
        displayName: 'IP Pool',
        icon: '🏊',
        fields: [
            { key: 'subnet', label: 'Subnet', type: 'text', placeholder: 'Subnet name', required: true },
            { key: 'ips', label: 'IP Addresses', type: 'textarea', placeholder: 'One IP per line', isArray: true, rows: 5 },
            { key: 'namespaces', label: 'Namespaces', type: 'text', placeholder: 'Comma separated namespaces', isArray: true }
        ]
    },
    'security-groups': {
        displayName: 'Security Group',
        icon: '🔒',
        fields: [
            { key: 'ingressRules', label: 'Ingress Rules', type: 'textarea', placeholder: 'JSON array of ingress rules', rows: 4 },
            { key: 'egressRules', label: 'Egress Rules', type: 'textarea', placeholder: 'JSON array of egress rules', rows: 4 },
            { key: 'allowSameGroupTraffic', label: 'Allow Same Group Traffic', type: 'checkbox' }
        ]
    },
    'qos-policies': {
        displayName: 'QoS Policy',
        icon: '⚡',
        fields: [
            { key: 'bandwidthLimitRules', label: 'Bandwidth Limit Rules', type: 'textarea', placeholder: 'JSON array of bandwidth rules', rows: 3 },
            { key: 'priority', label: 'Priority', type: 'number', placeholder: 'Priority level (0-255)' }
        ]
    },
    vips: {
        displayName: 'Virtual IP',
        icon: '🎯',
        fields: [
            { key: 'subnet', label: 'Subnet', type: 'text', placeholder: 'Subnet name', required: true },
            { key: 'type', label: 'Type', type: 'select', options: ['', 'ClusterIP', 'NodePort', 'LoadBalancer'] },
            { key: 'attachSubnets', label: 'Attach Subnets', type: 'text', placeholder: 'Comma separated subnet names', isArray: true }
        ]
    },
    'provider-networks': {
        displayName: 'Provider Network',
        icon: '🌉',
        fields: [
            { key: 'type', label: 'Type', type: 'select', options: ['', 'vlan', 'vxlan', 'geneve'], required: true },
            { key: 'defaultInterface', label: 'Default Interface', type: 'text', placeholder: 'Interface name' },
            { key: 'customInterfaces', label: 'Custom Interfaces', type: 'textarea', placeholder: 'JSON array of custom interfaces', rows: 3 },
            { key: 'excludeNodes', label: 'Exclude Nodes', type: 'text', placeholder: 'Comma separated node names', isArray: true }
        ]
    },
    vlans: {
        displayName: 'VLAN',
        icon: '🔗',
        fields: [
            { key: 'id', label: 'VLAN ID', type: 'number', placeholder: 'VLAN ID (1-4094)', required: true },
            { key: 'provider', label: 'Provider', type: 'text', placeholder: 'Provider network name', required: true },
            { key: 'subnet', label: 'Subnet', type: 'text', placeholder: 'Subnet name' }
        ]
    },
    'vpc-dnses': {
        displayName: 'VPC DNS',
        icon: '🔍',
        fields: [
            { key: 'vpc', label: 'VPC', type: 'text', placeholder: 'VPC name', required: true },
            { key: 'dns', label: 'DNS Servers', type: 'text', placeholder: 'Comma separated DNS servers', isArray: true }
        ]
    }
};

// Get display columns for table view
export const getDisplayColumns = (resourceType) => {
    const config = resourceConfigs[resourceType];
    if (!config) return ['Name', 'Created'];
    
    const columns = ['Name'];
    
    // Add key fields as columns
    const keyFields = config.fields.filter(f => f.required || ['cidrBlock', 'gateway', 'vpc', 'subnet', 'lanIp', 'type'].includes(f.key));
    columns.push(...keyFields.map(f => f.label));
    
    columns.push('Created', 'Actions');
    return columns;
};

// Get cell value for display
export const getCellValue = (obj, field) => {
    const value = obj.spec?.[field.key] || obj.status?.[field.key];
    
    if (!value) return 'N/A';
    
    if (field.isArray && Array.isArray(value)) {
        return value.join(', ');
    }
    
    if (field.type === 'checkbox') {
        return value ? '✅' : '❌';
    }
    
    return String(value);
};
