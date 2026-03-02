'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
                    <div className="space-y-1">
                      <Label>Display Name</Label>
                      <Input
                        type="text"
                        value={editValues.displayName}
                        onChange={(e) =>
                          setEditValues({ ...editValues, displayName: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Field Type</Label>
                      <Select
                        value={editValues.fieldType}
                        onValueChange={(v) => setEditValues({ ...editValues, fieldType: v })}
                      >
                        <SelectTrigger className="w-full sm:w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="string">String</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="boolean">Boolean</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateField(field.id, editValues)}
                        disabled={loading === field.id}
                      >
                        {loading === field.id ? 'Saving...' : 'Save'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingField(null)}>
                        Cancel
                      </Button>
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
                        <Badge variant={field.isActive ? 'default' : 'secondary'}>
                          {field.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Type: {field.fieldType}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => startEditing(field)}>
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateField(field.id, { isActive: !field.isActive })}
                        disabled={loading === field.id}
                      >
                        {field.isActive ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteField(field.id)}
                        disabled={loading === field.id}
                      >
                        Remove
                      </Button>
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
                <Button
                  size="sm"
                  onClick={() => addField(field.key)}
                  disabled={loading === field.key}
                >
                  {loading === field.key ? 'Adding...' : 'Add for Segmentation'}
                </Button>
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
