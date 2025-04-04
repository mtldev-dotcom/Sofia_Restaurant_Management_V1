import React from "react";
import Header from "@/components/Header";

// Extremely simple implementation with no dependencies on store or complex components
const HomeMinimal = () => {
  console.log("Rendering ultra-minimal Home component");
  
  // Simple handlers
  const handleSave = () => console.log("Save clicked");
  const handleLoad = () => console.log("Load clicked");
  const handleNew = () => console.log("New clicked");
  
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      overflow: "hidden",
      backgroundColor: "white"
    }}>
      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        <Header
          title="Floor Plan Designer (Minimal)"
          onSave={handleSave}
          onLoad={handleLoad}
          onNew={handleNew}
        />
      </div>
      
      {/* Content Area */}
      <div style={{
        display: "flex",
        flex: 1,
        overflow: "hidden"
      }}>
        {/* Sidebar */}
        <div style={{
          width: "280px",
          borderRight: "1px solid #ccc",
          overflow: "auto",
          backgroundColor: "#f9f9f9",
          padding: "20px"
        }}>
          <h2 style={{ marginBottom: "15px", fontSize: "18px" }}>Elements Panel</h2>
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "14px", marginBottom: "10px" }}>Tables</h3>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr", 
              gap: "10px" 
            }}>
              <div style={{ 
                padding: "10px", 
                border: "1px solid #ddd", 
                borderRadius: "4px",
                textAlign: "center"
              }}>
                Round Table
              </div>
              <div style={{ 
                padding: "10px", 
                border: "1px solid #ddd", 
                borderRadius: "4px",
                textAlign: "center" 
              }}>
                Square Table
              </div>
            </div>
          </div>
          
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "14px", marginBottom: "10px" }}>Chairs</h3>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr", 
              gap: "10px" 
            }}>
              <div style={{ 
                padding: "10px", 
                border: "1px solid #ddd", 
                borderRadius: "4px",
                textAlign: "center" 
              }}>
                Standard Chair
              </div>
              <div style={{ 
                padding: "10px", 
                border: "1px solid #ddd", 
                borderRadius: "4px",
                textAlign: "center" 
              }}>
                Armchair
              </div>
            </div>
          </div>
        </div>
        
        {/* Editor */}
        <div style={{
          flex: 1,
          backgroundColor: "#f0f0f0",
          display: "flex",
          flexDirection: "column"
        }}>
          {/* Toolbar */}
          <div style={{
            padding: "10px",
            borderBottom: "1px solid #ddd",
            display: "flex",
            gap: "10px"
          }}>
            <button style={{
              padding: "5px 10px",
              border: "1px solid #ccc",
              borderRadius: "4px"
            }}>
              Undo
            </button>
            <button style={{
              padding: "5px 10px",
              border: "1px solid #ccc",
              borderRadius: "4px"
            }}>
              Redo
            </button>
            <button style={{
              padding: "5px 10px",
              border: "1px solid #ccc",
              borderRadius: "4px"
            }}>
              Delete
            </button>
          </div>
          
          {/* Canvas Area */}
          <div style={{
            flex: 1,
            padding: "20px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}>
            <div style={{
              width: "800px",
              height: "600px",
              backgroundColor: "white",
              border: "1px solid #ddd",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              backgroundImage: "linear-gradient(to right, #eee 1px, transparent 1px), linear-gradient(to bottom, #eee 1px, transparent 1px)",
              backgroundSize: "20px 20px"
            }}>
              <div style={{ padding: "20px", color: "#666", textAlign: "center", marginTop: "200px" }}>
                This is the canvas area where elements would appear.
                <br/>
                Normal implementation uses CanvasElement components to render draggable items.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeMinimal;