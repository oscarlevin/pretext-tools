import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
//import React from 'react'

const TheoremLikeComponent = () => {
    return (
        <NodeViewWrapper className="block-component" contentEditable={true} ptxtag="theorem">
            <div className="block-title">Theorem xx.yy.  </div>
            <NodeViewContent className="thm-component-content" />
        </NodeViewWrapper>
    )
}

const ProofComponent = () => {
    return (
        <NodeViewWrapper className="proof" contentEditable={true} ptxtag="proof">
            <div className="block-title">Proof.  </div>
            <NodeViewContent className="thm-component-content" />
        </NodeViewWrapper>
    )
}

export { TheoremLikeComponent, ProofComponent }