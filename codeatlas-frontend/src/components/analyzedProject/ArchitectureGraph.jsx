import React, { useEffect, useState, useRef } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import { FaHandPointer, FaMinus, FaPlus, FaExclamationCircle } from "react-icons/fa";
import { GrPowerReset } from "react-icons/gr";
import "../../assets/styles/analyzedProjects.css";

cytoscape.use(dagre);

function ArchitectureGraph({ githubURL }) {
  const [graph, setGraph] = useState(null);
  const [selected, setSelected] = useState(null);
  const [grabEnabled, setGrabEnabled] = useState(true);
  const cyRef = useRef(null);

  useEffect(() => {
    if (!githubURL) return;
    setGraph(null);
    fetch("http://localhost:5000/api/architecture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ githubURL }),
    })
      .then((r) => r.json())
      .then((data) => setGraph(data.graph))
      .catch((err) => console.error(err));
  }, [githubURL]);

  if (!graph) return <div>Loading architecture...</div>;

  const nodeIds = new Set(graph.nodes.map((n) => n.id));
  const elements = [];

  // Prepare elements
  graph.nodes.forEach((n) => {
    elements.push({
      data: {
        id: n.id,
        label: n.label || n.id,
        type: n.type || "file",
        complexity: n.complexity || 0,
        loc: n.loc || 0,
        size: n.size || n.loc || 0,
        health: n.healthScore || 100,
        issues: n.issues || [],
        color:
          n.complexity > 20
            ? "#ff6b6b"
            : n.healthScore >= 75
            ? "#8ce99a"
            : n.healthScore >= 40
            ? "#ffd166"
            : "#ff6b6b",
      },
    });
  });

  graph.edges.forEach((e, i) => {
    if (!nodeIds.has(e.source)) {
      elements.push({ data: { id: e.source, label: e.source, type: "package", complexity: 0, health: 100, color: "#9ec1cf" } });
      nodeIds.add(e.source);
    }
    if (!nodeIds.has(e.target)) {
      elements.push({ data: { id: e.target, label: e.target, type: "package", complexity: 0, health: 100, color: "#9ec1cf" } });
      nodeIds.add(e.target);
    }
    elements.push({
      data: {
        id: `e${i}`,
        source: e.source,
        target: e.target,
        relation: e.relation,
        frequency: e.frequency || 1,
      },
    });
  });

  const stylesheet = [
    {
      selector: "node",
      style: {
        label: "data(label)",
        "text-valign": "center",
        "text-halign": "center",
        "background-color": "data(color)",
        width: "mapData(size, 0, 500, 30, 100)",
        height: "mapData(complexity, 0, 50, 30, 80)",
        shape: "round-rectangle",
        "font-size": 10,
      },
    },
    {
      selector: "node[complexity > 20]",
      style: {
        "border-width": 3,
        "border-color": "#ff3b3b",
      },
    },
    {
      selector: "node[complexity <= 20]",
      style: {
        "border-width": 1,
        "border-color": "#333",
      },
    },
    {
      selector: "edge",
      style: {
        width: "mapData(frequency, 1, 5, 2, 8)",
        "curve-style": "bezier",
        "target-arrow-shape": "triangle",
        "target-arrow-color": "#999",
        lineColor: "#999",
      },
    },
    {
      selector: "node:selected",
      style: { "overlay-opacity": 0, "border-width": 2, "border-color": "#333" },
    },
  ];

  const zoomIn = () => cyRef.current && cyRef.current.zoom(cyRef.current.zoom() * 1.2);
  const zoomOut = () => cyRef.current && cyRef.current.zoom(cyRef.current.zoom() / 1.2);
  const resetZoom = () => cyRef.current && cyRef.current.fit();
  const toggleGrab = () => {
    if (!cyRef.current) return;
    setGrabEnabled(!grabEnabled);
    cyRef.current.userPanningEnabled(!grabEnabled);
  };

  return (
    <div style={{ display: "flex", gap: "12px" }}>
      <div style={{ flex: 1, position: "relative" }}>
        {/* Zoom Controls */}
        <div className="zoom-buttons">
          <button onClick={zoomIn} className="plus-button"><FaPlus /></button>
          <button onClick={zoomOut} className="minus-button"><FaMinus /></button>
          <button onClick={resetZoom} className="reset-button"><GrPowerReset /></button>
          <button onClick={toggleGrab} className="reset-button">{grabEnabled ? <FaHandPointer /> : "🖐️"}</button>
        </div>

        <CytoscapeComponent
          elements={elements}
          style={{ width: "100%", height: "600px" }}
          layout={{ name: "dagre", rankDir: "LR" }}
          stylesheet={stylesheet}
          cy={(cy) => {
            cyRef.current = cy;

            cy.on("tap", "node", (evt) => {
              const n = evt.target;
              setSelected({
                id: n.data("id"),
                label: n.data("label"),
                type: n.data("type"),
                complexity: n.data("complexity"),
                loc: n.data("loc"),
                health: n.data("health"),
                issues: n.data("issues"),
              });
            });

            setTimeout(() => cy.fit(), 300);
          }}
        />
      </div>

      {/* Detail Panel */}
      <div style={{ width: "300px", borderLeft: "1px solid #eee", paddingLeft: "12px" }}>
        {selected ? (
          <div>
            <p><b>Details:</b> {selected.label}</p>
            <p>Type: {selected.type}</p>
            <p>Lines Of Code (LOC): {selected.loc}</p>
            <p>Complexity: {selected.complexity}</p>
            <p>Health: {selected.health}</p>
            {selected.issues.length > 0 && (
              <p>Issues: {selected.issues.map((i, idx) => <span key={idx}><FaExclamationCircle /> {i}<br/></span>)}</p>
            )}
          </div>
        ) : (
          <p>Click a node to view details</p>
        )}
      </div>
    </div>
  );
}

export default ArchitectureGraph;
