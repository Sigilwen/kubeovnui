import React from 'react';
import { Handle, Position } from 'reactflow';

const TextUpdaterNode = ({ data }) => {
    const handleClick = () => {
        if (data.onClick) {
            data.onClick(data.originalObject, data.objectType);
        }
    };

    return (
        <div 
            className="text-updater-node" 
            style={{
                background: data.background || '#fff',
                border: data.border || '1px solid #ddd',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: '500',
                minWidth: '120px',
                textAlign: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                cursor: data.onClick ? 'pointer' : 'default',
                transition: 'all 0.2s ease-in-out',
                position: 'relative'
            }}
            onClick={handleClick}
            onMouseEnter={(e) => {
                if (data.onClick) {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                }
            }}
            onMouseLeave={(e) => {
                if (data.onClick) {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }
            }}
        >
            <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
            <div style={{ fontWeight: 'bold', marginBottom: data.info ? '4px' : '0' }}>
                {data.label}
            </div>
            {data.info && (
                <div style={{ fontSize: '10px', color: '#666', fontWeight: 'normal' }}>
                    {data.info}
                </div>
            )}
            {data.onClick && (
                <div style={{ 
                    position: 'absolute', 
                    top: '2px', 
                    right: '4px', 
                    fontSize: '8px', 
                    color: '#888',
                    background: 'rgba(255,255,255,0.8)',
                    borderRadius: '2px',
                    padding: '1px 3px'
                }}>
                    ✏️
                </div>
            )}
            <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
        </div>
    );
};

export default TextUpdaterNode;