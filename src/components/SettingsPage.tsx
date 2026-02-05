import React, { useState, useCallback, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { RefreshCw, Download, Upload, Keyboard, Mic, Shield, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import ApiKeyInput from "./ui/ApiKeyInput";
import { ConfirmDialog, AlertDialog } from "./ui/dialog";
import { useSettings } from "../hooks/useSettings";
import { useDialogs } from "../hooks/useDialogs";
import { useAgentName } from "../utils/agentName";
import { usePermissions } from "../hooks/usePermissions";
import { useClipboard } from "../hooks/useClipboard";
import { REASONING_PROVIDERS } from "../utils/languages";
import { useMicrophone } from "../hooks/useMicrophone";
import LanguageSelector from "./ui/LanguageSelector";
import PromptStudio from "./ui/PromptStudio";
import styleManager from "../helpers/styleManager";
import ConnectionStatusIndicator from "./ui/ConnectionStatusIndicator";
const InteractiveKeyboard = React.lazy(() => import("./ui/Keyboard"));

// Type for formality styles
type FormalityStyle = 'formal' | 'casual' | 'neutral';

// Type for app mapping
interface AppMapping {
  id: string;
  pattern: string;
  style: FormalityStyle;
  isDefault: boolean;
}

/**
 * Style badge component for displaying formality style
 */
function StyleBadge({ style }: { style: FormalityStyle }) {
  const styleConfig = {
    formal: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Formal' },
    casual: { bg: 'bg-green-100', text: 'text-green-800', label: 'Casual' },
    neutral: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Neutral' },
  };
  const config = styleConfig[style];
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

/**
 * App Mapping Row Component - displays a single mapping with edit/delete actions
 */
interface MappingRowProps {
  mapping: AppMapping;
  isEditing: boolean;
  editPattern: string;
  editStyle: FormalityStyle;
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditSave: () => void;
  onDelete: () => void;
  onPatternChange: (value: string) => void;
  onStyleChange: (value: FormalityStyle) => void;
}

function MappingRow({
  mapping,
  isEditing,
  editPattern,
  editStyle,
  onEditStart,
  onEditCancel,
  onEditSave,
  onDelete,
  onPatternChange,
  onStyleChange,
}: MappingRowProps) {
  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-300">
        <Input
          value={editPattern}
          onChange={(e) => onPatternChange(e.target.value)}
          placeholder="App name or pattern"
          className="flex-1 text-sm"
          autoFocus
        />
        <select
          value={editStyle}
          onChange={(e) => onStyleChange(e.target.value as FormalityStyle)}
          className="text-sm border border-gray-300 rounded-md p-2 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        >
          <option value="formal">Formal</option>
          <option value="casual">Casual</option>
          <option value="neutral">Neutral</option>
        </select>
        <button
          onClick={onEditSave}
          disabled={!editPattern.trim()}
          className="p-2 text-green-600 hover:bg-green-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          title="Save"
        >
          <Check size={16} />
        </button>
        <button
          onClick={onEditCancel}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
          title="Cancel"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${
      mapping.isDefault 
        ? 'bg-gray-50 border-gray-200' 
        : 'bg-white border-indigo-200'
    }`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className={`font-mono text-sm truncate ${mapping.isDefault ? 'text-gray-600' : 'text-gray-900'}`}>
          {mapping.pattern}
        </span>
        {mapping.isDefault && (
          <span className="text-xs text-gray-400 shrink-0">(default)</span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <StyleBadge style={mapping.style} />
        {!mapping.isDefault && (
          <>
            <button
              onClick={onEditStart}
              className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors"
              title="Edit mapping"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors"
              title="Delete mapping"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Context-Aware Styling Section Component
 * 
 * Provides UI for enabling/disabling context-aware styling, configuring
 * the default style for unmapped applications, and managing app mappings.
 * 
 * Uses React state to ensure the toggle visually updates when clicked and
 * persists the setting to localStorage via styleManager.
 */
interface ContextAwareStylingProps {
  showAlertDialog: (config: { title: string; description: string }) => void;
}

function ContextAwareStylingSection({ showAlertDialog }: ContextAwareStylingProps) {
  // React state to track enabled status - ensures UI re-renders on toggle
  const [isEnabled, setIsEnabled] = useState(() => styleManager.isEnabled());
  // React state to track default style - ensures UI re-renders on change
  const [defaultStyle, setDefaultStyle] = useState<FormalityStyle>(() => styleManager.getDefaultStyle() as FormalityStyle);
  // React state for mappings list
  const [mappings, setMappings] = useState<AppMapping[]>(() => styleManager.getMappings() as AppMapping[]);
  // State for adding new mapping
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPattern, setNewPattern] = useState('');
  const [newStyle, setNewStyle] = useState<FormalityStyle>('neutral');
  // State for editing existing mapping
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPattern, setEditPattern] = useState('');
  const [editStyle, setEditStyle] = useState<FormalityStyle>('neutral');
  // State for showing default mappings
  const [showDefaults, setShowDefaults] = useState(false);

  /**
   * Refresh mappings from styleManager
   */
  const refreshMappings = useCallback(() => {
    setMappings(styleManager.getMappings() as AppMapping[]);
  }, []);

  /**
   * Handle exporting mappings to a JSON file
   */
  const handleExportMappings = useCallback(() => {
    try {
      const json = styleManager.exportMappings();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ollie-app-mappings.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showAlertDialog({
        title: "Mappings Exported",
        description: "Your custom app mappings have been exported successfully.",
      });
    } catch (error) {
      showAlertDialog({
        title: "Export Failed",
        description: "Failed to export mappings. Please try again.",
      });
    }
  }, [showAlertDialog]);

  /**
   * Handle importing mappings from a JSON file
   */
  const handleImportMappings = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const result = styleManager.importMappings(text);
        
        if (result.success) {
          refreshMappings();
          showAlertDialog({
            title: "Mappings Imported",
            description: result.imported > 0 
              ? `Successfully imported ${result.imported} mapping${result.imported !== 1 ? 's' : ''}.${result.errors.length > 0 ? ` ${result.errors.length} item(s) skipped.` : ''}`
              : "No new mappings were imported.",
          });
        } else {
          showAlertDialog({
            title: "Import Failed",
            description: result.errors.length > 0 
              ? `Failed to import mappings: ${result.errors[0]}`
              : "Failed to import mappings. Please check the file format.",
          });
        }
      } catch (error) {
        showAlertDialog({
          title: "Import Failed",
          description: "Failed to read the file. Please ensure it's a valid JSON file.",
        });
      }
    };
    
    input.click();
  }, [refreshMappings, showAlertDialog]);

  /**
   * Handle toggle change - updates both React state and localStorage
   */
  const handleToggleChange = useCallback((checked: boolean) => {
    setIsEnabled(checked);
    styleManager.setEnabled(checked);
    showAlertDialog({
      title: checked ? "Context-Aware Styling Enabled" : "Context-Aware Styling Disabled",
      description: checked 
        ? "Text will now be styled based on the target application."
        : "Text will use the default style for all applications.",
    });
  }, [showAlertDialog]);

  /**
   * Handle default style change - updates both React state and localStorage
   */
  const handleDefaultStyleChange = useCallback((style: FormalityStyle) => {
    setDefaultStyle(style);
    styleManager.setDefaultStyle(style);
    showAlertDialog({
      title: "Default Style Updated",
      description: `Default style set to "${style}" for unmapped applications.`,
    });
  }, [showAlertDialog]);

  /**
   * Handle adding a new mapping
   */
  const handleAddMapping = useCallback(() => {
    if (!newPattern.trim()) return;
    
    const mapping = styleManager.addMapping(newPattern.trim(), newStyle);
    refreshMappings();
    setIsAddingNew(false);
    setNewPattern('');
    setNewStyle('neutral');
    
    showAlertDialog({
      title: "Mapping Added",
      description: `"${mapping.pattern}" will now use ${mapping.style} style.`,
    });
  }, [newPattern, newStyle, refreshMappings, showAlertDialog]);

  /**
   * Handle starting edit mode for a mapping
   */
  const handleEditStart = useCallback((mapping: AppMapping) => {
    setEditingId(mapping.id);
    setEditPattern(mapping.pattern);
    setEditStyle(mapping.style);
  }, []);

  /**
   * Handle canceling edit mode
   */
  const handleEditCancel = useCallback(() => {
    setEditingId(null);
    setEditPattern('');
    setEditStyle('neutral');
  }, []);

  /**
   * Handle saving an edited mapping
   */
  const handleEditSave = useCallback(() => {
    if (!editingId || !editPattern.trim()) return;
    
    styleManager.updateMapping(editingId, {
      pattern: editPattern.trim(),
      style: editStyle,
    });
    refreshMappings();
    setEditingId(null);
    setEditPattern('');
    setEditStyle('neutral');
    
    showAlertDialog({
      title: "Mapping Updated",
      description: `"${editPattern.trim()}" will now use ${editStyle} style.`,
    });
  }, [editingId, editPattern, editStyle, refreshMappings, showAlertDialog]);

  /**
   * Handle deleting a mapping
   */
  const handleDeleteMapping = useCallback((mapping: AppMapping) => {
    const success = styleManager.removeMapping(mapping.id);
    if (success) {
      refreshMappings();
      showAlertDialog({
        title: "Mapping Deleted",
        description: `Removed mapping for "${mapping.pattern}".`,
      });
    }
  }, [refreshMappings, showAlertDialog]);

  // Separate custom and default mappings
  const customMappings = mappings.filter(m => !m.isDefault);
  const defaultMappings = mappings.filter(m => m.isDefault);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Context-Aware Styling
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Automatically adjust text formality based on the application you're using.
          Email clients use formal tone, chat apps use casual tone, and other apps use neutral tone.
        </p>
      </div>

      {/* Context-Aware Styling Container */}
      <div className="space-y-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-indigo-900">
              Enable Context-Aware Styling
            </h4>
            <p className="text-xs text-indigo-700">
              Automatically detect target app and apply appropriate text style
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isEnabled}
              onChange={(e) => handleToggleChange(e.target.checked)}
              aria-label="Enable context-aware styling"
            />
            <div
              className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                isEnabled ? "bg-indigo-600" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform duration-200 ${
                  isEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              ></div>
            </div>
          </label>
        </div>

        {/* Default Style Selector */}
        <div className="pt-4 border-t border-indigo-200">
          <h4 className="font-medium text-indigo-900 mb-2">
            Default Style for Unmapped Apps
          </h4>
          <p className="text-xs text-indigo-700 mb-3">
            This style is used when an application doesn't have a specific mapping.
          </p>
          <div className="flex gap-2">
            {(['formal', 'casual', 'neutral'] as const).map((style) => (
              <button
                key={style}
                onClick={() => handleDefaultStyleChange(style)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  defaultStyle === style
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-indigo-700 border border-indigo-300 hover:bg-indigo-50"
                }`}
                aria-pressed={defaultStyle === style}
              >
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* App Mappings List */}
        <div className="pt-4 border-t border-indigo-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-medium text-indigo-900">
                Application Mappings
              </h4>
              <p className="text-xs text-indigo-700">
                Configure which text style to use for specific applications.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleImportMappings}
                size="sm"
                variant="outline"
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                title="Import mappings from file"
              >
                <Upload size={14} className="mr-1" />
                Import
              </Button>
              <Button
                onClick={handleExportMappings}
                size="sm"
                variant="outline"
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                title="Export mappings to file"
              >
                <Download size={14} className="mr-1" />
                Export
              </Button>
              <Button
                onClick={() => setIsAddingNew(true)}
                disabled={isAddingNew}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus size={14} className="mr-1" />
                Add Mapping
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {/* Add New Mapping Form */}
            {isAddingNew && (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-300">
                <Input
                  value={newPattern}
                  onChange={(e) => setNewPattern(e.target.value)}
                  placeholder="App name or pattern (e.g., 'notion', 'com.apple.*')"
                  className="flex-1 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newPattern.trim()) {
                      handleAddMapping();
                    } else if (e.key === 'Escape') {
                      setIsAddingNew(false);
                      setNewPattern('');
                    }
                  }}
                />
                <select
                  value={newStyle}
                  onChange={(e) => setNewStyle(e.target.value as FormalityStyle)}
                  className="text-sm border border-gray-300 rounded-md p-2 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                  <option value="neutral">Neutral</option>
                </select>
                <button
                  onClick={handleAddMapping}
                  disabled={!newPattern.trim()}
                  className="p-2 text-green-600 hover:bg-green-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Add"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => {
                    setIsAddingNew(false);
                    setNewPattern('');
                  }}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                  title="Cancel"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Custom Mappings */}
            {customMappings.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-indigo-800 uppercase tracking-wide">
                  Custom Mappings ({customMappings.length})
                </p>
                {customMappings.map((mapping) => (
                  <MappingRow
                    key={mapping.id}
                    mapping={mapping}
                    isEditing={editingId === mapping.id}
                    editPattern={editPattern}
                    editStyle={editStyle}
                    onEditStart={() => handleEditStart(mapping)}
                    onEditCancel={handleEditCancel}
                    onEditSave={handleEditSave}
                    onDelete={() => handleDeleteMapping(mapping)}
                    onPatternChange={setEditPattern}
                    onStyleChange={setEditStyle}
                  />
                ))}
              </div>
            )}

            {/* Empty State for Custom Mappings */}
            {customMappings.length === 0 && !isAddingNew && (
              <div className="bg-white rounded-lg border border-indigo-200 p-4 text-center">
                <p className="text-sm text-gray-500">
                  No custom mappings yet. Click "Add Mapping" to create one.
                </p>
              </div>
            )}

            {/* Default Mappings (Collapsible) */}
            <div className="mt-4">
              <button
                onClick={() => setShowDefaults(!showDefaults)}
                className="flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                <span className={`transform transition-transform ${showDefaults ? 'rotate-90' : ''}`}>
                  ▶
                </span>
                Default Mappings ({defaultMappings.length})
              </button>
              
              {showDefaults && (
                <div className="mt-2 space-y-1.5 pl-4 border-l-2 border-gray-200">
                  {defaultMappings.map((mapping) => (
                    <MappingRow
                      key={mapping.id}
                      mapping={mapping}
                      isEditing={false}
                      editPattern=""
                      editStyle="neutral"
                      onEditStart={() => {}}
                      onEditCancel={() => {}}
                      onEditSave={() => {}}
                      onDelete={() => {}}
                      onPatternChange={() => {}}
                      onStyleChange={() => {}}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export type SettingsSectionType =
  | "general"
  | "transcription"
  | "aiModels"
  | "agentConfig"
  | "prompts"
  | "contextAwareStyling";

interface SettingsPageProps {
  activeSection?: SettingsSectionType;
}

export default function SettingsPage({
  activeSection = "general",
}: SettingsPageProps) {
  // Use custom hooks
  const {
    confirmDialog,
    alertDialog,
    showConfirmDialog,
    showAlertDialog,
    hideConfirmDialog,
    hideAlertDialog,
  } = useDialogs();

  const {
    preferredLanguage,
    useReasoningModel,
    reasoningModel,
    reasoningProvider,
    anthropicApiKey,
    awsAccessKeyId,
    awsSecretAccessKey,
    awsRegion,
    dictationKey,
    setPreferredLanguage,
    setUseReasoningModel,
    setReasoningModel,
    setReasoningProvider,
    setAnthropicApiKey,
    setAwsAccessKeyId,
    setAwsSecretAccessKey,
    setAwsRegion,
    setDictationKey,
    updateTranscriptionSettings,
    updateReasoningSettings,
    updateApiKeys,
  } = useSettings();

  // Update state
  const [currentVersion, setCurrentVersion] = useState<string>("");
  const [updateStatus, setUpdateStatus] = useState<{
    updateAvailable: boolean;
    updateDownloaded: boolean;
    isDevelopment: boolean;
  }>({ updateAvailable: false, updateDownloaded: false, isDevelopment: false });
  const [checkingForUpdates, setCheckingForUpdates] = useState(false);
  const [downloadingUpdate, setDownloadingUpdate] = useState(false);
  const [updateDownloadProgress, setUpdateDownloadProgress] = useState(0);
  const [updateInfo, setUpdateInfo] = useState<{
    version?: string;
    releaseDate?: string;
    releaseNotes?: string;
  }>({});

  const permissionsHook = usePermissions(showAlertDialog);
  const { pasteFromClipboardWithFallback } = useClipboard(showAlertDialog);
  const { agentName, setAgentName } = useAgentName();
  const { devices: micDevices, selectedDeviceId: selectedMic, selectDevice: selectMic, refreshDevices: refreshMics, isLoading: micsLoading } = useMicrophone();

  // Defer heavy operations for better performance
  useEffect(() => {
    let mounted = true;

    // Defer version and update checks to improve initial render
    const timer = setTimeout(async () => {
      if (!mounted) return;
      
      const versionResult = await window.electronAPI?.getAppVersion();
      if (versionResult && mounted) setCurrentVersion(versionResult.version);

      const statusResult = await window.electronAPI?.getUpdateStatus();
      if (statusResult && mounted) {
        setUpdateStatus(statusResult);
        subscribeToUpdates();
      }
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
      // Always clean up update listeners if they exist
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners?.("update-available");
        window.electronAPI.removeAllListeners?.("update-downloaded");
        window.electronAPI.removeAllListeners?.("update-error");
        window.electronAPI.removeAllListeners?.("update-download-progress");
      }
    };
  }, []);

  const subscribeToUpdates = () => {
    if (window.electronAPI) {
      const handleUpdateAvailable = (event, info) => {
        setUpdateStatus((prev) => ({ ...prev, updateAvailable: true }));
        setUpdateInfo({
          version: info.version,
          releaseDate: info.releaseDate,
          releaseNotes: info.releaseNotes,
        });
      };

      const handleUpdateDownloaded = (event, info) => {
        setUpdateStatus((prev) => ({ ...prev, updateDownloaded: true }));
        setDownloadingUpdate(false);
      };

      const handleUpdateProgress = (event, progressObj) => {
        setUpdateDownloadProgress(progressObj.percent || 0);
      };

      const handleUpdateError = (event, error) => {
        setCheckingForUpdates(false);
        setDownloadingUpdate(false);
        console.error("Update error:", error);
      };

      window.electronAPI.onUpdateAvailable?.(handleUpdateAvailable);
      window.electronAPI.onUpdateDownloaded?.(handleUpdateDownloaded);
      window.electronAPI.onUpdateDownloadProgress?.(handleUpdateProgress);
      window.electronAPI.onUpdateError?.(handleUpdateError);
    }
  };

  const saveReasoningSettings = useCallback(() => {
    updateReasoningSettings({ useReasoningModel, reasoningModel });
    updateApiKeys({
      ...(reasoningProvider === "bedrock" &&
        awsAccessKeyId.trim() && { awsAccessKeyId, awsSecretAccessKey, awsRegion }),
      ...(reasoningProvider === "anthropic" &&
        anthropicApiKey.trim() && { anthropicApiKey }),
    });

    showAlertDialog({
      title: "Reasoning Settings Saved",
      description: `AI text enhancement ${
        useReasoningModel ? "enabled" : "disabled"
      } with ${
        REASONING_PROVIDERS[
          reasoningProvider as keyof typeof REASONING_PROVIDERS
        ]?.name || reasoningProvider
      } ${reasoningModel}`,
    });
  }, [
    useReasoningModel,
    reasoningModel,
    reasoningProvider,
    anthropicApiKey,
    awsAccessKeyId,
    awsSecretAccessKey,
    awsRegion,
    updateReasoningSettings,
    updateApiKeys,
    showAlertDialog,
  ]);

  // Removed saveApiKey function - OpenAI API key handling removed per R3
  // AWS Transcribe is now the sole transcription method

  const resetAccessibilityPermissions = () => {
    const message = `🔄 RESET ACCESSIBILITY PERMISSIONS\n\nIf you've rebuilt or reinstalled Ollie and automatic inscription isn't functioning, you may have obsolete permissions from the previous version.\n\n📋 STEP-BY-STEP RESTORATION:\n\n1️⃣ Open System Settings (or System Preferences)\n   • macOS Ventura+: Apple Menu → System Settings\n   • Older macOS: Apple Menu → System Preferences\n\n2️⃣ Navigate to Privacy & Security → Accessibility\n\n3️⃣ Look for obsolete Ollie entries:\n   • Any entries named "Ollie"\n   • Any entries named "Electron"\n   • Any entries with unclear or generic names\n   • Entries pointing to old application locations\n\n4️⃣ Remove ALL obsolete entries:\n   • Select each old entry\n   • Click the minus (-) button\n   • Enter your password if prompted\n\n5️⃣ Add the current Ollie:\n   • Click the plus (+) button\n   • Navigate to and select the CURRENT Ollie app\n   • Ensure the checkbox is ENABLED\n\n6️⃣ Restart Ollie completely\n\n💡 This is very common during development when rebuilding applications!\n\nClick OK when you're ready to open System Settings.`;

    showConfirmDialog({
      title: "Reset Accessibility Permissions",
      description: message,
      onConfirm: () => {
        showAlertDialog({
          title: "Opening System Settings",
          description:
            "Opening System Settings... Look for the Accessibility section under Privacy & Security.",
        });

        window.open(
          "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility",
          "_blank"
        );
      },
    });
  };

  const saveKey = async () => {
    try {
      await window.electronAPI?.updateHotkey(dictationKey);
      showAlertDialog({
        title: "Key Saved",
        description: `Dictation key saved: ${dictationKey}`,
      });
    } catch (error) {
      console.error("Failed to update hotkey:", error);
      showAlertDialog({
        title: "Error",
        description: `Failed to update hotkey: ${error.message}`,
      });
    }
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case "general":
        return (
          <div className="space-y-8">
            {/* App Updates Section */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  App Updates
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Keep Ollie up to date with the latest features and
                  improvements.
                </p>
              </div>
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-neutral-800">
                    Current Version
                  </p>
                  <p className="text-xs text-neutral-600">
                    {currentVersion || "Loading..."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {updateStatus.isDevelopment ? (
                    <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                      Development Mode
                    </span>
                  ) : updateStatus.updateAvailable ? (
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      Update Available
                    </span>
                  ) : (
                    <span className="text-xs text-neutral-600 bg-neutral-100 px-2 py-1 rounded-full">
                      Up to Date
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={async () => {
                    setCheckingForUpdates(true);
                    try {
                      const result =
                        await window.electronAPI?.checkForUpdates();
                      if (result?.updateAvailable) {
                        setUpdateInfo({
                          version: result.version,
                          releaseDate: result.releaseDate,
                          releaseNotes: result.releaseNotes,
                        });
                        setUpdateStatus((prev) => ({
                          ...prev,
                          updateAvailable: true,
                        }));
                        showAlertDialog({
                          title: "Update Available",
                          description: `Update available: v${result.version}`,
                        });
                      } else {
                        showAlertDialog({
                          title: "No Updates",
                          description:
                            result?.message || "No updates available",
                        });
                      }
                    } catch (error: any) {
                      showAlertDialog({
                        title: "Update Check Failed",
                        description: `Error checking for updates: ${error.message}`,
                      });
                    } finally {
                      setCheckingForUpdates(false);
                    }
                  }}
                  disabled={checkingForUpdates || updateStatus.isDevelopment}
                  className="w-full"
                >
                  {checkingForUpdates ? (
                    <>
                      <RefreshCw size={16} className="animate-spin mr-2" />
                      Checking for Updates...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} className="mr-2" />
                      Check for Updates
                    </>
                  )}
                </Button>

                {updateStatus.updateAvailable && !updateStatus.updateDownloaded && (
                  <Button
                    onClick={async () => {
                      setDownloadingUpdate(true);
                      setUpdateDownloadProgress(0);
                      try {
                        await window.electronAPI?.downloadUpdate();
                      } catch (error: any) {
                        setDownloadingUpdate(false);
                        showAlertDialog({
                          title: "Download Failed",
                          description: `Failed to download update: ${error.message}`,
                        });
                      }
                    }}
                    disabled={downloadingUpdate}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {downloadingUpdate ? (
                      <>
                        <Download size={16} className="animate-pulse mr-2" />
                        Downloading... {Math.round(updateDownloadProgress)}%
                      </>
                    ) : (
                      <>
                        <Download size={16} className="mr-2" />
                        Download Update v{updateInfo.version}
                      </>
                    )}
                  </Button>
                )}

                {updateStatus.updateDownloaded && (
                  <Button
                    onClick={async () => {
                      showConfirmDialog({
                        title: "Install Update",
                        description: `Ready to install update v${updateInfo.version}. The app will restart to complete installation.`,
                        onConfirm: async () => {
                          try {
                            await window.electronAPI?.installUpdate();
                          } catch (error: any) {
                            showAlertDialog({
                              title: "Install Failed",
                              description: `Failed to install update: ${error.message}`,
                            });
                          }
                        },
                      });
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <span className="mr-2">🚀</span>
                    Install Update & Restart
                  </Button>
                )}

                {updateInfo.version && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Update v{updateInfo.version}
                    </h4>
                    {updateInfo.releaseDate && (
                      <p className="text-sm text-blue-700 mb-2">
                        Released: {new Date(updateInfo.releaseDate).toLocaleDateString()}
                      </p>
                    )}
                    {updateInfo.releaseNotes && (
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">What's New:</p>
                        <div className="whitespace-pre-wrap">{updateInfo.releaseNotes}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Hotkey Section */}
            <div className="border-t pt-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Dictation Hotkey
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Configure the key you press to start and stop voice dictation.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activation Key
                  </label>
                  <Input
                    placeholder="Default: ` (backtick)"
                    value={dictationKey}
                    onChange={(e) => setDictationKey(e.target.value)}
                    className="text-center text-lg font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Press this key from anywhere to start/stop dictation
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Click any key to select it:
                  </h4>
                  <React.Suspense
                    fallback={
                      <div className="h-32 flex items-center justify-center text-gray-500">
                        Loading keyboard...
                      </div>
                    }
                  >
                    <InteractiveKeyboard
                      selectedKey={dictationKey}
                      setSelectedKey={setDictationKey}
                    />
                  </React.Suspense>
                </div>
                <Button
                  onClick={saveKey}
                  disabled={!dictationKey.trim()}
                  className="w-full"
                >
                  Save Hotkey
                </Button>
              </div>
            </div>

            {/* Permissions Section */}
            <div className="border-t pt-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Permissions
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Test and manage app permissions for microphone and
                  accessibility.
                </p>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={permissionsHook.requestMicPermission}
                  variant="outline"
                  className="w-full"
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Test Microphone Permission
                </Button>
                <Button
                  onClick={permissionsHook.testAccessibilityPermission}
                  variant="outline"
                  className="w-full"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Test Accessibility Permission
                </Button>
                <Button
                  onClick={resetAccessibilityPermissions}
                  variant="secondary"
                  className="w-full"
                >
                  <span className="mr-2">⚙️</span>
                  Fix Permission Issues
                </Button>
              </div>
            </div>

            {/* Microphone Selection */}
            <div className="border-t pt-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Microphone
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Select which microphone to use for voice dictation.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <select
                    value={selectedMic}
                    onChange={(e) => {
                      selectMic(e.target.value);
                      showAlertDialog({
                        title: "Microphone Changed",
                        description: `Now using: ${micDevices.find(d => d.deviceId === e.target.value)?.label || "System Default"}`,
                      });
                    }}
                    disabled={micsLoading}
                    className="flex-1 text-sm border border-gray-300 rounded-md p-2 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    {micDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={refreshMics}
                    variant="outline"
                    size="sm"
                    disabled={micsLoading}
                  >
                    <RefreshCw size={16} className={micsLoading ? "animate-spin" : ""} />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  {micDevices.length <= 1 
                    ? "Only the system default microphone is available" 
                    : `${micDevices.length - 1} microphone${micDevices.length > 2 ? "s" : ""} detected`}
                </p>
              </div>
            </div>

            {/* About Section */}
            <div className="border-t pt-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  About Ollie
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Ollie converts your speech to text using AI. Press your
                  hotkey, speak, and we'll type what you said wherever your
                  cursor is.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-6">
                <div className="text-center p-4 border border-gray-200 rounded-xl bg-white">
                  <div className="w-8 h-8 mx-auto mb-2 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <Keyboard className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-medium text-gray-800 mb-1">
                    Default Hotkey
                  </p>
                  <p className="text-gray-600 font-mono text-xs">
                    {dictationKey || "` (backtick)"}
                  </p>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-xl bg-white">
                  <div className="w-8 h-8 mx-auto mb-2 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">🏷️</span>
                  </div>
                  <p className="font-medium text-gray-800 mb-1">Version</p>
                  <p className="text-gray-600 text-xs">
                    {currentVersion || "0.1.0"}
                  </p>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-xl bg-white">
                  <div className="w-8 h-8 mx-auto mb-2 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <p className="font-medium text-gray-800 mb-1">Status</p>
                  <p className="text-green-600 text-xs font-medium">Active</p>
                </div>
              </div>

              {/* System Actions */}
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    showConfirmDialog({
                      title: "Reset Onboarding",
                      description:
                        "Are you sure you want to reset the onboarding process? This will clear your setup and show the welcome flow again.",
                      onConfirm: () => {
                        localStorage.removeItem("onboardingCompleted");
                        window.location.reload();
                      },
                      variant: "destructive",
                    });
                  }}
                  variant="outline"
                  className="w-full text-amber-600 border-amber-300 hover:bg-amber-50 hover:border-amber-400"
                >
                  <span className="mr-2">🔄</span>
                  Reset Onboarding
                </Button>
                <Button
                  onClick={() => {
                    showConfirmDialog({
                      title: "⚠️ DANGER: Cleanup App Data",
                      description:
                        "This will permanently delete ALL Ollie data including:\n\n• Database and transcriptions\n• Local storage settings\n• Environment files\n\nYou will need to manually remove app permissions in System Settings.\n\nThis action cannot be undone. Are you sure?",
                      onConfirm: () => {
                        window.electronAPI
                          ?.cleanupApp()
                          .then(() => {
                            showAlertDialog({
                              title: "Cleanup Completed",
                              description:
                                "✅ Cleanup completed! All app data has been removed.",
                            });
                            setTimeout(() => {
                              window.location.reload();
                            }, 1000);
                          })
                          .catch((error) => {
                            showAlertDialog({
                              title: "Cleanup Failed",
                              description: `❌ Cleanup failed: ${error.message}`,
                            });
                          });
                      },
                      variant: "destructive",
                    });
                  }}
                  variant="outline"
                  className="w-full text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                >
                  <span className="mr-2">🗑️</span>
                  Clean Up All App Data
                </Button>
              </div>
            </div>
          </div>
        );

      case "transcription":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Speech to Text Processing
              </h3>
              <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                <h4 className="font-medium text-green-900">☁️ AWS Transcribe (Streaming)</h4>
                <p className="text-sm text-green-700">
                  Using AWS Transcribe Streaming for fast, real-time speech-to-text. 
                  Credentials are loaded from your AWS configuration (~/.aws/credentials).
                </p>
                <ConnectionStatusIndicator className="mt-2" />
              </div>
            </div>

            <div className="space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <h4 className="font-medium text-gray-900">Preferred Language</h4>
              <LanguageSelector
                value={preferredLanguage}
                onChange={(value) => {
                  setPreferredLanguage(value);
                  updateTranscriptionSettings({ preferredLanguage: value });
                  // Also save to transcribeLanguage for streaming audio manager (R4)
                  localStorage.setItem("transcribeLanguage", value);
                }}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                "Auto-detect (Recommended)" uses AWS Transcribe's automatic language identification.
                Select a specific language to override auto-detection.
              </p>
            </div>

            <Button
              onClick={() => {
                updateTranscriptionSettings({
                  preferredLanguage,
                });

                showAlertDialog({
                  title: "Settings Saved",
                  description: `Transcription: AWS Transcribe Streaming. Language: ${preferredLanguage}.`,
                });
              }}
              className="w-full"
            >
              Save Transcription Settings
            </Button>

            {/* Debug Section */}
            <div className="mt-8 p-4 bg-gray-100 border border-gray-300 rounded-xl">
              <h4 className="font-medium text-gray-700 mb-2 text-sm">🔧 Debug Info</h4>
              <div className="text-xs text-gray-600 space-y-1 mb-3 font-mono">
                <p>useReasoningModel: {String(useReasoningModel)} (localStorage: {localStorage.getItem("useReasoningModel") || "null"})</p>
                <p>reasoningModel: {reasoningModel}</p>
                <p>preferredLanguage: {preferredLanguage}</p>
              </div>
              <Button
                onClick={() => {
                  // Refresh connection status
                  window.electronAPI?.connectionHealthCheck?.().then((result: { healthy: boolean; error?: string }) => {
                    showAlertDialog({
                      title: "Connection Status",
                      description: result.healthy 
                        ? "✅ AWS connections are healthy and ready." 
                        : `⚠️ Connection issue: ${result.error || 'Unknown error'}`,
                    });
                  });
                }}
                variant="outline"
                size="sm"
                className="w-full text-xs"
              >
                Check AWS Connection Status
              </Button>
            </div>
          </div>
        );

      case "aiModels":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI Text Enhancement
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Configure how AI models clean up and format your transcriptions.
                This handles commands like "scratch that", creates proper lists,
                and fixes obvious errors while preserving your natural tone.
              </p>

              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                <div>
                  <label className="text-sm font-medium text-green-800">
                    Enable AI Text Enhancement
                  </label>
                  <p className="text-xs text-green-700">
                    Use AI to automatically improve transcription quality
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={useReasoningModel}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setUseReasoningModel(enabled);
                      updateReasoningSettings({ useReasoningModel: enabled });
                    }}
                  />
                  <div
                    className={`w-11 h-6 bg-gray-200 rounded-full transition-colors duration-200 ${
                      useReasoningModel ? "bg-green-600" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform duration-200 ${
                        useReasoningModel ? "translate-x-5" : "translate-x-0"
                      }`}
                    ></div>
                  </div>
                </label>
              </div>
            </div>

            {useReasoningModel && (
              <>
                <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h4 className="font-medium text-blue-900">AI Provider</h4>
                  <select
                    value={reasoningProvider}
                    onChange={(e) => {
                      setReasoningProvider(e.target.value);
                    }}
                    className="w-full text-sm border border-blue-300 rounded-md p-2 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {Object.entries(REASONING_PROVIDERS).map(
                      ([id, provider]) => (
                        <option key={id} value={id}>
                          {provider.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="space-y-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <h4 className="font-medium text-indigo-900">AI Model</h4>
                  <select
                    value={reasoningModel}
                    onChange={(e) => setReasoningModel(e.target.value)}
                    className="w-full text-sm border border-indigo-300 rounded-md p-2 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    {REASONING_PROVIDERS[
                      reasoningProvider as keyof typeof REASONING_PROVIDERS
                    ]?.models.map((model) => (
                      <option key={model.value} value={model.value}>
                        {model.label} - {model.description}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-indigo-600">
                    Different models offer varying levels of quality and speed
                  </p>
                </div>

                {reasoningProvider === "bedrock" && (
                  <div className="space-y-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-orange-900">
                        AWS Bedrock Credentials
                      </h4>
                      <ConnectionStatusIndicator className="ml-2" />
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-orange-700 mb-1">Access Key ID</label>
                        <Input
                          type="password"
                          placeholder="AKIA..."
                          value={awsAccessKeyId}
                          onChange={(e) => setAwsAccessKeyId(e.target.value)}
                          className="text-sm border-orange-300 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-orange-700 mb-1">Secret Access Key</label>
                        <Input
                          type="password"
                          placeholder="Secret key..."
                          value={awsSecretAccessKey}
                          onChange={(e) => setAwsSecretAccessKey(e.target.value)}
                          className="text-sm border-orange-300 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-orange-700 mb-1">Region</label>
                        <Input
                          type="text"
                          placeholder="us-east-1"
                          value={awsRegion}
                          onChange={(e) => setAwsRegion(e.target.value)}
                          className="text-sm border-orange-300 focus:border-orange-500"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-orange-600">
                      Uses Claude models via AWS Bedrock. Leave credentials empty to use ~/.aws/credentials.
                    </p>
                    <Button
                      onClick={async () => {
                        showAlertDialog({
                          title: "Testing Bedrock...",
                          description: "Sending test request to AWS Bedrock...",
                        });
                        try {
                          console.log('[Settings] Testing Bedrock with model:', reasoningModel);
                          const result = await window.electronAPI?.invokeBedrockModel({
                            modelId: reasoningModel,
                            text: "Say 'Bedrock connection successful!' in exactly those words.",
                            region: awsRegion || "us-east-1",
                          });
                          console.log('[Settings] Bedrock test result:', result);
                          showAlertDialog({
                            title: "✅ Bedrock Works!",
                            description: `Response: ${result?.substring(0, 200) || "No response"}`,
                          });
                        } catch (error: any) {
                          console.error('[Settings] Bedrock test error:', error);
                          showAlertDialog({
                            title: "❌ Bedrock Error",
                            description: `Error: ${error.message}\n\nMake sure you have valid AWS credentials (run 'ada credentials update' or check ~/.aws/credentials)`,
                          });
                        }
                      }}
                      variant="outline"
                      className="w-full mt-2 border-orange-400 text-orange-700 hover:bg-orange-100"
                    >
                      🧪 Test Bedrock Connection
                    </Button>
                  </div>
                )}

                {reasoningProvider === "anthropic" && (
                  <div className="space-y-4 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                    <h4 className="font-medium text-purple-900">
                      Anthropic API Key
                    </h4>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        placeholder="sk-ant-..."
                        value={anthropicApiKey}
                        onChange={(e) => setAnthropicApiKey(e.target.value)}
                        className="flex-1 text-sm border-purple-300 focus:border-purple-500"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          pasteFromClipboardWithFallback(setAnthropicApiKey)
                        }
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        Paste
                      </Button>
                    </div>
                    <p className="text-xs text-purple-600">
                      Get your API key from console.anthropic.com
                    </p>
                  </div>
                )}
              </>
            )}

            <Button onClick={saveReasoningSettings} className="w-full">
              Save AI Model Settings
            </Button>

            {/* Direct Bedrock Test - Always visible */}
            <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-xl">
              <h4 className="font-bold text-yellow-800 mb-2">🔧 Debug: Direct Bedrock Test</h4>
              <p className="text-xs text-yellow-700 mb-3">
                Current provider: {reasoningProvider} | Model: {reasoningModel}
              </p>
              <Button
                onClick={async () => {
                  const testModel = "anthropic.claude-3-haiku-20240307-v1:0";
                  console.log('[DEBUG] =====================================');
                  console.log('[DEBUG] Testing Bedrock directly');
                  console.log('[DEBUG] Model:', testModel);
                  console.log('[DEBUG] =====================================');
                  
                  showAlertDialog({
                    title: "Testing Bedrock...",
                    description: `Calling ${testModel}...`,
                  });
                  
                  try {
                    const result = await window.electronAPI?.invokeBedrockModel({
                      modelId: testModel,
                      text: "Reply with exactly: BEDROCK WORKS",
                      region: "us-east-1",
                    });
                    console.log('[DEBUG] Bedrock SUCCESS:', result);
                    showAlertDialog({
                      title: "✅ BEDROCK WORKS!",
                      description: `Response: ${result}`,
                    });
                  } catch (error: any) {
                    console.error('[DEBUG] Bedrock FAILED:', error);
                    showAlertDialog({
                      title: "❌ Bedrock Failed",
                      description: error.message,
                    });
                  }
                }}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
              >
                🧪 TEST BEDROCK NOW
              </Button>
            </div>
          </div>
        );

      case "agentConfig":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Agent Configuration
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Customize your AI assistant's name and behavior to make
                interactions more personal and effective.
              </p>
            </div>

            <div className="space-y-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl">
              <h4 className="font-medium text-purple-900 mb-3">
                💡 How to use agent names:
              </h4>
              <ul className="text-sm text-purple-800 space-y-2">
                <li>
                  • Say "Hey {agentName}, write a formal email" for specific
                  instructions
                </li>
                <li>
                  • Use "Hey {agentName}, format this as a list" for text
                  enhancement commands
                </li>
                <li>
                  • The agent will recognize when you're addressing it directly
                  vs. dictating content
                </li>
                <li>
                  • Makes conversations feel more natural and helps distinguish
                  commands from dictation
                </li>
              </ul>
            </div>

            <div className="space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <h4 className="font-medium text-gray-900">Current Agent Name</h4>
              <div className="flex gap-3">
                <Input
                  placeholder="e.g., Assistant, Jarvis, Alex..."
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="flex-1 text-center text-lg font-mono"
                />
                <Button
                  onClick={() => {
                    setAgentName(agentName.trim());
                    showAlertDialog({
                      title: "Agent Name Updated",
                      description: `Your agent is now named "${agentName.trim()}". You can address it by saying "Hey ${agentName.trim()}" followed by your instructions.`,
                    });
                  }}
                  disabled={!agentName.trim()}
                >
                  Save
                </Button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Choose a name that feels natural to say and remember
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                🎯 Example Usage:
              </h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>
                  • "Hey {agentName}, write an email to my team about the
                  meeting"
                </p>
                <p>
                  • "Hey {agentName}, make this more professional" (after
                  dictating text)
                </p>
                <p>• "Hey {agentName}, convert this to bullet points"</p>
                <p>
                  • Regular dictation: "This is just normal text" (no agent name
                  needed)
                </p>
              </div>
            </div>
          </div>
        );


      case "prompts":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI Prompt Management
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                View and customize the prompts that power Ollie's AI text processing. 
                Adjust these to change how your transcriptions are formatted and enhanced.
              </p>
            </div>
            
            <PromptStudio />
          </div>
        );

      case "contextAwareStyling":
        return <ContextAwareStylingSection showAlertDialog={showAlertDialog} />;
      default:
        return null;
    }
  };

  return (
    <>
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => !open && hideConfirmDialog()}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
      />

      <AlertDialog
        open={alertDialog.open}
        onOpenChange={(open) => !open && hideAlertDialog()}
        title={alertDialog.title}
        description={alertDialog.description}
        onOk={() => {}}
      />

      {renderSectionContent()}
    </>
  );
}

