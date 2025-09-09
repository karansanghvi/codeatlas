import React, { useEffect, useRef, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import { GrPowerReset } from "react-icons/gr";

// register dagre layout
cytoscape.use(dagre);

function ArchitectureGraph({ githubURL }) {
  const [graph, setGraph] = useState(null);
  const [selected, setSelected] = useState(null);
  const cyRef = useRef(null); // ⬅️ For zoom controls

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

  graph.nodes.forEach((n) => {
    elements.push({
      data: {
        id: n.id,
        label: n.label || n.id,
        type: n.type || "file",
        complexity: n.complexity || 0,
        health: n.healthScore || 100,
        color:
          n.healthScore >= 75
            ? "#8ce99a"
            : n.healthScore >= 40
            ? "#ffd166"
            : "#ff6b6b",
      },
    });
  });

  graph.edges.forEach((e, i) => {
    if (!nodeIds.has(e.source)) {
      elements.push({
        data: {
          id: e.source,
          label: e.source,
          type: "package",
          complexity: 0,
          health: 100,
          color: "#9ec1cf",
        },
      });
      nodeIds.add(e.source);
    }
    if (!nodeIds.has(e.target)) {
      elements.push({
        data: {
          id: e.target,
          label: e.target,
          type: "package",
          complexity: 0,
          health: 100,
          color: "#9ec1cf",
        },
      });
      nodeIds.add(e.target);
    }

    elements.push({
      data: {
        id: `e${i}`,
        source: e.source,
        target: e.target,
        relation: e.relation,
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
        shape: "round-rectangle",
        width: "label",
        padding: "8px",
        "font-size": 10,
      },
    },
    {
      selector: 'node[type="file"]',
      style: { "border-width": 1, "border-color": "#333" },
    },
    {
      selector: 'node[type="package"]',
      style: {
        "border-width": 2,
        "border-color": "#555",
        "background-opacity": 0.6,
      },
    },
    {
      selector: "edge",
      style: {
        width: 2,
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

  const handleZoomIn = () => {
    if (cyRef.current) {
      const cy = cyRef.current;
      const zoom = cy.zoom();
      cy.zoom(zoom + 0.2); 
      cy.center(); 
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      const cy = cyRef.current;
      const zoom = cy.zoom();
      cy.zoom(zoom - 0.2); 
      cy.center(); 
    }
  };

  const handleResetZoom = () => {
    if (cyRef.current) {
      cyRef.current.fit();
    }
  };

  return (
    <>
      <div style={{ flex: 1, position: "relative" }}>
        <div className="zoom-buttons">
          <button onClick={handleZoomIn} className="plus-button">+</button>
          <button onClick={handleZoomOut} className="minus-button">-</button>
          <button onClick={handleResetZoom} className="reset-button"><GrPowerReset /></button>
        </div>

        <CytoscapeComponent
          elements={elements}
          style={{ width: "100%", height: "180px" }}
          layout={{ name: "dagre", rankDir: "TB" }}
          stylesheet={stylesheet}
          cy={(cy) => {
            cyRef.current = cy; // Store reference
            cy.on("tap", "node", (evt) => {
              const node = evt.target;
              setSelected({
                id: node.data("id"),
                label: node.data("label"),
                type: node.data("type"),
                complexity: node.data("complexity"),
                health: node.data("health"),
              });
            });
            setTimeout(() => {
              cy.resize();
              cy.fit();
            }, 300);
          }}
        />
      </div>

      <div>
        {selected ? (
          <div>
            <p>
              <b>Details: {selected.label}</b>
            </p>
            <p>Type: {selected.type} | Complexity: {selected.complexity} | Health score: {selected.health}</p>
          </div>
        ) : (
          <p>Click a node to view details</p>
        )}
      </div>
    </>
  );
}

export default ArchitectureGraph;
