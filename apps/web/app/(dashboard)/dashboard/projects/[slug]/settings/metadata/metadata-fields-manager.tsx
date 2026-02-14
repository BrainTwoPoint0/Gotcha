'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Select } from '@/app/components/Select';

interface ConfiguredField {
  id: string;
  fieldKey: string;
  displayName: string | null;
  fieldType: string;
  isActive: boolean;
}

interface DiscoveredField {
  key: string;
  occurrences: number;
  samples: unknown[];
}

interface MetadataFieldsManagerProps {
  projectSlug: string;
  configuredFields: ConfiguredField[];
  discoveredFields: DiscoveredField[];
}

export function MetadataFieldsManager({
  projectSlug,
  configuredFields,
  discoveredFields,
}: MetadataFieldsManagerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    displayName: string;
    fieldType: string;
  }>({ displayName: '', fieldType: 'string' });

  const addField = async (fieldKey: string, displayName?: string) => {
    setLoading(fieldKey);
    try {
      await fetch(`/api/projects/${projectSlug}/metadata-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldKey,
          displayName: displayName || fieldKey,
          fieldType: 'string',
          isActive: true,
        }),
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to add field:', error);
    } finally {
      setLoading(null);
    }
  };

  const updateField = async (id: string, updates: Partial<ConfiguredField>) => {
    setLoading(id);
    try {
      await fetch(`/api/projects/${projectSlug}/metadata-fields`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      router.refresh();
      setEditingField(null);
    } catch (error) {
      console.error('Failed to update field:', error);
    } finally {
      setLoading(null);
    }
  };

  const deleteField = async (id: string) => {
    if (!confirm('Remove this field from segmentation?')) return;

    setLoading(id);
    try {
      await fetch(`/api/projects/${projectSlug}/metadata-fields?id=${id}`, {
        method: 'DELETE',
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to delete field:', error);
    } finally {
      setLoading(null);
    }
  };

  const startEditing = (field: ConfiguredField) => {
    setEditingField(field.id);
    setEditValues({
      displayName: field.displayName || field.fieldKey,
      fieldType: field.fieldType,
    });
  };

  return (
    <div className="space-y-8">
      {/* Configured Fields */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Configured Fields</h2>
          <p className="text-sm text-gray-500">These fields are available for user segmentation</p>
        </div>

        {configuredFields.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No fields configured yet.</p>
            <p className="text-sm mt-1">Add fields from the discovered list below.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {configuredFields.map((field) => (
              <div key={field.id} className="p-4 sm:p-6">
                {editingField === field.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={editValues.displayName}
                        onChange={(e) =>
                          setEditValues({ ...editValues, displayName: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <Select label="Field Type" value={editValues.fieldType} onChange={(e) => setEditValues({ ...editValues, fieldType: (e.target as HTMLSelectElement).value })}>
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                    </Select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateField(field.id, editValues)}
                        disabled={loading === field.id}
                        className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded-md hover:bg-slate-800 disabled:opacity-50"
                      >
                        {loading === field.id ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingField(null)}
                        className="px-3 py-1.5 text-gray-600 text-sm hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {field.displayName || field.fieldKey}
                        </span>
                        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                          {field.fieldKey}
                        </code>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            field.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {field.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Type: {field.fieldType}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(field)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => updateField(field.id, { isActive: !field.isActive })}
                        disabled={loading === field.id}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md disabled:opacity-50"
                      >
                        {field.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => deleteField(field.id)}
                        disabled={loading === field.id}
                        className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800 border border-red-200 rounded-md disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Discovered Fields */}
      {discoveredFields.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Discovered Fields</h2>
            <p className="text-sm text-gray-500">
              Fields found in your response data that aren&apos;t configured yet
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {discoveredFields.map((field) => (
              <div
                key={field.key}
                className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <code className="font-medium text-gray-900">{field.key}</code>
                    <span className="text-xs text-gray-500">{field.occurrences} occurrences</span>
                  </div>
                  {field.samples.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Sample values:{' '}
                      {field.samples
                        .map((s) => (typeof s === 'string' ? `"${s}"` : String(s)))
                        .join(', ')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => addField(field.key)}
                  disabled={loading === field.key}
                  className="px-3 py-1.5 text-sm bg-slate-700 text-white rounded-md hover:bg-slate-800 disabled:opacity-50"
                >
                  {loading === field.key ? 'Adding...' : 'Add for Segmentation'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {discoveredFields.length === 0 && configuredFields.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No user metadata found</h3>
          <p className="text-gray-600 mb-4">
            To configure metadata fields, start passing user attributes when collecting feedback:
          </p>
          <pre className="bg-slate-800 text-slate-100 rounded-lg p-4 text-sm overflow-x-auto">
            {`<Gotcha
  elementId="feature-x"
  user={{
    id: 'user_123',
    plan: 'pro',
    location: 'US',
    age: 28
  }}
/>`}
          </pre>
        </div>
      )}
    </div>
  );
}
