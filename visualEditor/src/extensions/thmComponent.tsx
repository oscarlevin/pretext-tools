import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import React from 'react'

export default () => {
    return (
        <NodeViewWrapper className="thm-component" contentEditable={true} data-ptxtag="thmComponent">
            <div className="thm-component-header">
                <span className="thm-component-type">Component</span>
                <span className="thm-component-name">Component Name</span>
            </div>
            <NodeViewContent className="thm-component-content" />
            <div className="thm-component-footer">
                <span className="thm-component-number">xx.yy</span>
                <span className="thm-component-period">.</span>
            </div>
        </NodeViewWrapper>
    )
}