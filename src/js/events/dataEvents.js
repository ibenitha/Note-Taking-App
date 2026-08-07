// events/dataEvents.js
//
// Only responsibility: exporting all notes to a downloadable JSON file,
// and importing notes back from a JSON file the user picks. The actual
// validating/deduping of imported data lives in noteManager.js (it's
// note-shape logic, not file I/O); storage.js still owns persisting the
// result. This file only handles the Blob download, the FileReader, and
// wiring the Export/Import controls.

import * as storage from "../storage/storage.js";
import * as noteManager from "../models/noteManager.js";
import * as feedback from "../ui/feedback.js";

const EXPORT_FILENAME_PREFIX = "notes-export-";

// Builds a JSON file of the current notes and triggers a browser download
// for it. The envelope shape ({ version, exportedAt, notes }) is what
// noteManager.validateImportedNotes() expects back on import.
function exportNotes(core) {
  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    notes: core.state.notes,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${EXPORT_FILENAME_PREFIX}${new Date().toISOString().slice(0, 10)}.json`;
  link.click();

  URL.revokeObjectURL(url);
  feedback.showToast("Notes exported successfully!");
}

// Reads the chosen file, validates its structure, merges in whatever
// isn't already a duplicate, then saves and re-renders exactly like any
// other change to state.notes.
function importNotesFromFile(file, core, errorField) {
  const reader = new FileReader();

  reader.onload = () => {
    let importedNotes;
    try {
      const data = JSON.parse(reader.result);
      importedNotes = noteManager.validateImportedNotes(data);
    } catch (error) {
      errorField.textContent = error.message || "This file could not be read as a notes export.";
      return;
    }

    errorField.textContent = "";
    const { addedCount, duplicateCount } = noteManager.mergeImportedNotes(core.state.notes, importedNotes);

    if (addedCount > 0) {
      storage.saveNotes(core.state.notes);
      core.renderApp();
    }

    const notesWord = addedCount === 1 ? "note" : "notes";
    const message =
      duplicateCount > 0
        ? `Imported ${addedCount} ${notesWord}, skipped ${duplicateCount} duplicate${duplicateCount === 1 ? "" : "s"}.`
        : `Imported ${addedCount} ${notesWord}.`;
    feedback.showToast(message);
  };

  reader.onerror = () => {
    errorField.textContent = "This file could not be read.";
  };

  reader.readAsText(file);
}

// Wires the export/import controls inside the given container to the
// given core. Takes a container (instead of querying `document` itself)
// so it can wire either the desktop settings panel or its mobile-cloned
// copy — see settingsEvents.js's showMobileSettingsSubPanel, which clones
// fieldsets and re-wires their controls the same way for the other
// settings sections.
export function wireDataPanel(container, core) {
  const exportButton = container.querySelector(".export-notes-btn");
  const importButton = container.querySelector(".import-notes-btn");
  const fileInput = container.querySelector(".import-notes-input");
  const errorField = container.querySelector(".import-error");

  if (exportButton) {
    exportButton.addEventListener("click", () => exportNotes(core));
  }

  if (importButton && fileInput) {
    importButton.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
      const file = fileInput.files[0];
      if (file) {
        importNotesFromFile(file, core, errorField);
      }
      fileInput.value = ""; // allow re-selecting the same file next time
    });
  }
}

export function init(core) {
  wireDataPanel(document, core);
}
