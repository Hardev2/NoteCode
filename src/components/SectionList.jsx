import { useState } from "react";

export default function SectionList({ sections, onReorder, renderSection }) {
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);

  const finishDrag = () => {
    setDragId(null);
    setOverId(null);
  };

  const handleDrop = (targetId) => {
    if (!dragId || dragId === targetId) {
      finishDrag();
      return;
    }
    const fromIndex = sections.findIndex((s) => s.id === dragId);
    const toIndex = sections.findIndex((s) => s.id === targetId);
    if (fromIndex !== -1 && toIndex !== -1) onReorder(fromIndex, toIndex);
    finishDrag();
  };

  return (
    <div className="flex w-full flex-col gap-5">
      {sections.map((section) => {
        const isDragging = dragId === section.id;
        const isOver = overId === section.id && dragId && dragId !== section.id;

        return (
          <div
            key={section.id}
            className={`section-drag-row flex items-start gap-2 ${isDragging ? "section-drag-row--dragging" : ""} ${isOver ? "section-drag-row--over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (dragId && dragId !== section.id) setOverId(section.id);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) {
                setOverId((current) => (current === section.id ? null : current));
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(section.id);
            }}
          >
            <button
              type="button"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", section.id);
                setDragId(section.id);
              }}
              onDragEnd={finishDrag}
              className="section-drag-handle mt-3 shrink-0"
              title="Drag to reorder"
              aria-label="Drag to reorder section"
            >
              ⋮⋮
            </button>
            <div className="min-w-0 flex-1">{renderSection(section)}</div>
          </div>
        );
      })}
    </div>
  );
}
