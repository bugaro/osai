'use client';

import { useEffect, useRef } from 'react';
import * as d3Drag from 'd3-drag';
import * as d3Selection from 'd3-selection';
import { Network, AlertTriangle, Loader2 } from 'lucide-react';
import { useDashboardStore } from '@/shared/store/dashboardStore';
import { useGraphData } from '../model/useGraphData';

import type { GraphNode, GraphNodeType } from '@/shared/types';
import { GRAPH_CONFIG } from '@/shared/lib/constants';

interface LayoutNode extends Omit<GraphNode, 'type'> {
  type: GraphNodeType;
  x: number;
  y: number;
}

interface LayoutEdge {
  source: string;
  target: string;
  label: string;
}

function isTierPrime(label: string): boolean {
  return label.includes('Prime');
}

function getNodeCenter(node: LayoutNode, type: string): { x: number; y: number } {
  const text = node.label || '';
  const charWidth = 7;
  const pad = 16;
  if (type === 'tier') {
    const radius = Math.max(18, (text.length * charWidth + pad) / 2);
    return { x: node.x, y: node.y };
  }
  if (type === 'zone') {
    const rectWidth = Math.max(50, text.length * charWidth + pad);
    return { x: node.x, y: node.y };
  }
  if (type === 'limit') {
    const rectWidth = Math.max(64, text.length * charWidth + pad);
    return { x: node.x, y: node.y };
  }
  return { x: node.x, y: node.y };
}

function getNodeDimensions(node: LayoutNode): { width: number; height: number } {
  const text = node.label || '';
  const charWidth = 7;
  const pad = 16;
  switch (node.type) {
    case 'zone':
      return { width: Math.max(120, text.length * charWidth + pad), height: 36 };
    case 'tier': {
      const radius = Math.max(28, (text.length * charWidth + pad) / 2);
      return { width: radius * 2, height: radius * 2 };
    }
    case 'limit':
      return { width: Math.max(100, text.length * charWidth + pad), height: 32 };
    default:
      return { width: Math.max(90, text.length * charWidth + pad), height: 32 };
  }
}

function computeHierarchicalLayout(
  nodes: LayoutNode[],
  width: number,
  height: number,
): void {
  for (const node of nodes) {
    node.x = width / 2;
    node.y = height / 2;
  }

  const layerOrder: GraphNodeType[] = ['zone', 'tier', 'limit', 'voucher'];

  for (const layer of layerOrder) {
    const layerNodes = nodes.filter((n) => n.type === layer);
    const count = layerNodes.length;
    if (count === 0) continue;

    const y = height * (GRAPH_CONFIG.LAYER_Y[layer] ?? 0.5);
    const useableWidth = width * 0.8;
    const spacing = count > 1 ? useableWidth / (count - 1) : 0;
    const startX = (width - useableWidth) / 2;

    layerNodes.forEach((node, i) => {
      node.x = count > 1 ? startX + spacing * i : width / 2;
      node.y = y;
    });
  }
}

export function KnowledgeGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { isLoading, error } = useGraphData();
  const graphData = useDashboardStore((s) => s.graphData);
  const positionsRef = useRef<LayoutNode[]>([]);

  useEffect(() => {
    if (!svgRef.current || !graphData || graphData.nodes.length === 0) return;

    const svgElement = d3Selection.select(svgRef.current);
    svgElement.selectAll('*').remove();

    const clientWidth = containerRef.current?.clientWidth || GRAPH_CONFIG.DEFAULT_WIDTH;
    const width = Math.max(800, clientWidth);
    const height = GRAPH_CONFIG.HEIGHT;
    svgElement.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

    const defs = svgElement.append('defs');

    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', GRAPH_CONFIG.COLORS.DEFAULT_LINE);

    defs.append('marker')
      .attr('id', 'arrow-prime')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', GRAPH_CONFIG.COLORS.PRIME_LINE);

    const nodes = graphData.nodes.map((n) => ({ ...n })) as LayoutNode[];
    const edges = graphData.edges.map((e) => ({ source: e.source, target: e.target, label: e.label })) as LayoutEdge[];

    computeHierarchicalLayout(nodes, width, height);
    positionsRef.current = nodes;

    const nodeById = new Map(nodes.map((n) => [n.id, n]));

    function getEdgeColor(edge: LayoutEdge): string {
      const sourceNode = nodeById.get(edge.source);
      if (sourceNode && isTierPrime(sourceNode.label)) {
        return GRAPH_CONFIG.COLORS.PRIME_LINE;
      }
      return GRAPH_CONFIG.COLORS.DEFAULT_LINE;
    }

    function getEdgeMarker(edge: LayoutEdge): string {
      const sourceNode = nodeById.get(edge.source);
      if (sourceNode && isTierPrime(sourceNode.label)) {
        return 'url(#arrow-prime)';
      }
      return 'url(#arrow)';
    }

    function renderEdges() {
      const link = svgElement.append('g')
        .selectAll('line')
        .data(edges)
        .enter()
        .append('line')
        .attr('stroke', (d: LayoutEdge) => getEdgeColor(d))
        .attr('stroke-width', 1.5)
        .attr('marker-end', (d: LayoutEdge) => getEdgeMarker(d));

      return link;
    }

    function updateEdges(link: d3Selection.Selection<SVGLineElement, LayoutEdge, SVGGElement, unknown>) {
      link
        .attr('x1', (d: LayoutEdge) => {
          const src = nodeById.get(d.source);
          return src ? getNodeCenter(src, src.type).x : 0;
        })
        .attr('y1', (d: LayoutEdge) => {
          const src = nodeById.get(d.source);
          if (!src) return 0;
          const dims = getNodeDimensions(src);
          if (src.type === 'tier') return src.y + dims.height / 2;
          return src.y + dims.height / 2;
        })
        .attr('x2', (d: LayoutEdge) => {
          const tgt = nodeById.get(d.target);
          return tgt ? getNodeCenter(tgt, tgt.type).x : 0;
        })
        .attr('y2', (d: LayoutEdge) => {
          const tgt = nodeById.get(d.target);
          if (!tgt) return 0;
          const dims = getNodeDimensions(tgt);
          return tgt.y - dims.height / 2;
        });
    }

    function renderNodes() {
      const node = svgElement.append('g')
        .selectAll('g')
        .data(nodes)
        .enter()
        .append('g')
        .attr('data-testid', (d: LayoutNode) => `node-${d.type}`)
        .attr('data-label', (d: LayoutNode) => d.label)
        .call(
          d3Drag.drag<SVGGElement, LayoutNode>()
            .on('drag', function (event: d3Drag.D3DragEvent<SVGGElement, LayoutNode, LayoutNode>, d: LayoutNode) {
              d.x = event.x;
              d.y = event.y;
              d3Selection.select(this).attr('transform', `translate(${d.x},${d.y})`);
              updateEdges(link);
            }) as unknown as (
              selection: d3Selection.Selection<SVGGElement, LayoutNode, SVGGElement, unknown>
            ) => void
        );

      node.each(function (this: SVGGElement, d: LayoutNode) {
        const g = d3Selection.select(this);

        const isLimitNode = d.type === 'limit';

        const text = d.label || '';
        const charWidth = 7;
        const pad = 16;

        if (d.type === 'zone') {
          const rectWidth = Math.max(120, text.length * charWidth + pad);
          const rectHeight = 36;
          g.append('rect')
            .attr('x', -rectWidth / 2)
            .attr('y', -rectHeight / 2)
            .attr('width', rectWidth)
            .attr('height', rectHeight)
            .attr('fill', GRAPH_CONFIG.COLORS.ZONE_FILL)
            .attr('stroke', GRAPH_CONFIG.COLORS.ZONE_STROKE)
            .attr('stroke-width', 1.5);
        } else if (d.type === 'tier') {
          const isPrime = isTierPrime(text);
          const radius = Math.max(28, (text.length * charWidth + pad) / 2);
          g.append('circle')
            .attr('r', radius)
            .attr('fill', GRAPH_CONFIG.COLORS.TIER_FILL)
            .attr('stroke', isPrime ? GRAPH_CONFIG.COLORS.TIER_PRIME_STROKE : GRAPH_CONFIG.COLORS.TIER_STANDARD_STROKE)
            .attr('stroke-width', 1.5);
        } else if (d.type === 'limit') {
          const isPrimeCeiling = text.includes('ceiling') || text.includes('15');
          const rectWidth = Math.max(100, text.length * charWidth + pad);
          const rectHeight = 32;
          g.append('rect')
            .attr('x', -rectWidth / 2)
            .attr('y', -rectHeight / 2)
            .attr('width', rectWidth)
            .attr('height', rectHeight)
            .attr('rx', 12)
            .attr('fill', isPrimeCeiling ? GRAPH_CONFIG.COLORS.LIMIT_PRIME_FILL : GRAPH_CONFIG.COLORS.LIMIT_STANDARD_FILL)
            .attr('stroke', isPrimeCeiling ? GRAPH_CONFIG.COLORS.LIMIT_PRIME_STROKE : GRAPH_CONFIG.COLORS.LIMIT_STANDARD_STROKE)
            .attr('stroke-width', 1.5);
        } else {
          const rectWidth = Math.max(90, text.length * charWidth + pad);
          const rectHeight = 32;
          g.append('rect')
            .attr('x', -rectWidth / 2)
            .attr('y', -rectHeight / 2)
            .attr('width', rectWidth)
            .attr('height', rectHeight)
            .attr('rx', 4)
            .attr('fill', GRAPH_CONFIG.COLORS.VOUCHER_FILL)
            .attr('stroke', GRAPH_CONFIG.COLORS.VOUCHER_STROKE)
            .attr('stroke-width', 1.5);
        }
      });

      node.append('text')
        .attr('dy', '.3em')
        .attr('text-anchor', 'middle')
        .attr('fill', GRAPH_CONFIG.COLORS.TEXT_FILL)
        .attr('font-size', '11')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('font-weight', '500')
        .attr('pointer-events', 'none')
        .attr('class', 'select-none')
        .text((d: LayoutNode) => d.label);

      node.attr('transform', (d: LayoutNode) => `translate(${d.x},${d.y})`);

      return node;
    }

    const link = renderEdges();
    updateEdges(link);
    renderNodes();

    return () => {
      svgElement.selectAll('*').remove();
    };
  }, [graphData]);

  return (
    <div className="bg-[#0E1424] border border-slate-800 rounded-xl p-5 h-[600px] flex flex-col" ref={containerRef}>
      <div className="flex items-center gap-2 mb-4">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <h3 className="font-semibold text-sm text-white">
          Business Rule Topology
        </h3>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-black/40 border border-slate-800 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        </div>
      ) : error || !graphData || graphData.nodes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-3 bg-black/40 border border-slate-800 rounded-lg">
          <div className="relative mb-2">
            <Network className="h-16 w-16 text-slate-700" />
            <AlertTriangle className="h-6 w-6 text-red-500 absolute -bottom-1 -right-1" />
          </div>
          <p className="text-slate-400 text-sm max-w-sm">
            Failed to load graph topology.
          </p>
        </div>
      ) : (
        <div className="flex-1 bg-black/40 border border-slate-800 rounded-lg relative overflow-auto min-h-0">
          <svg ref={svgRef} className="h-full" />
        </div>
      )}

      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase border-t border-slate-800/60 pt-4 mt-4">
        <span>Active Clusters: {graphData?.nodes.length || 0}</span>
        <span className="text-emerald-400">NOMINAL</span>
      </div>
    </div>
  );
}
